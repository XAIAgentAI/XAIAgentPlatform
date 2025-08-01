/**
 * 服务端钱包管理模块
 * 简化版本：包含所有核心功能
 */

import { createWalletClient, createPublicClient, http, formatEther, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { currentChain } from '@/config/networks';
import { prisma } from '@/lib/prisma';
import {
  DISTRIBUTION_RATIOS,
  DISTRIBUTION_ADDRESSES,
  getServerWalletPrivateKey,
  getMiningContractAddress,
  validateEnvironmentVariables
} from './config';
import { burnTokens, calculateBurnAmount } from './burn';
import { distributeLiquidityForAgent } from '@/lib/token-distribution/liquidity-distribution';
import type {
  DistributionResult,
  TransactionResult,
  DistributionAmounts
} from './types';

// 导出类型供外部使用
export type {
  DistributionRequest,
  DistributionResult,
  TransactionResult,
  WalletBalance,
  AgentInfo,
  DistributionAmounts,
  TaskData,
  TaskStatus,
  DistributionType
} from './types';

// 导出配置
export {
  DISTRIBUTION_RATIOS,
  DISTRIBUTION_ADDRESSES,
  getServerWalletPrivateKey,
  getMiningContractAddress,
  validateEnvironmentVariables
} from './config';

// 模块级别的客户端实例（共享）
let walletClient: any = null;
let publicClient: any = null;
let serverAccount: any = null;

/**
 * 初始化客户端（懒加载）
 */
function initializeClients() {
  if (walletClient && publicClient && serverAccount) {
    return { walletClient, publicClient, serverAccount };
  }

  try {
    console.log('🔧 初始化服务端钱包客户端...');

    // 验证环境变量
    validateEnvironmentVariables();

    // 获取私钥并创建账户
    const privateKey = getServerWalletPrivateKey();
    serverAccount = privateKeyToAccount(privateKey);

    // 创建公共客户端
    publicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });

    // 创建钱包客户端（预绑定account）
    walletClient = createWalletClient({
      account: serverAccount,
      chain: currentChain,
      transport: http(),
    });

    console.log(`✅ 服务端钱包初始化成功: ${serverAccount.address}`);
    return { walletClient, publicClient, serverAccount };
  } catch (error) {
    console.error('❌ 服务端钱包初始化失败:', error);
    // 重置客户端，下次重试
    walletClient = null;
    publicClient = null;
    serverAccount = null;
    throw error;
  }
}

/**
 * 获取服务端钱包客户端
 */
export function getServerWalletClients() {
  return initializeClients();
}

/**
 * 检查代币余额
 */
async function checkTokenBalance(tokenAddress: string): Promise<{ balance: string; formatted: string }> {
  const { publicClient, serverAccount } = initializeClients();

  try {
    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [serverAccount.address],
    });

    return {
      balance: balance.toString(),
      formatted: formatEther(balance as bigint),
    };
  } catch (error) {
    console.error('检查代币余额失败:', error);
    throw new Error('Failed to check token balance');
  }
}

/**
 * 获取 Agent 信息
 */
async function getAgentInfo(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      creator: {
        select: { address: true },
      },
    },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  return {
    id: agent.id,
    creator: {
      address: agent.creator.address,
    },
    iaoContractAddress: agent.iaoContractAddress || undefined,
    tokenAddress: agent.tokenAddress,
  };
}

/**
 * 批量执行transferAndLock操作
 * @param tokenAddress 代币地址
 * @param recipientAddress 接收者地址
 * @param amount 每次转账金额
 * @param lockTime 锁定时间（秒）
 * @param count 执行次数
 * @param concurrency 并发数，默认为5
 * @param maxRetries 最大重试次数，默认为3
 * @returns 执行结果
 */
export async function batchTransferAndLock(
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  lockTime: number,
  count: number,
  concurrency: number = 5,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  completedCount: number;
  failedCount: number;
  transactions: Array<{
    index: number;
    txHash: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}> {
  console.log(`🔄 开始批量执行transferAndLock - 总数: ${count}, 锁定时间: ${lockTime}秒`);
  console.log(`📝 参数详情:`);
  console.log(`  - 代币地址: ${tokenAddress}`);
  console.log(`  - 接收者: ${recipientAddress}`);
  console.log(`  - 每次金额: ${amount}`);

  // 初始化客户端
  const { walletClient, publicClient } = initializeClients();
  
  // 导入XAA合约ABI
  const xaaAbiModule = await import('@/config/xaa-abi.json');
  const xaaAbi = xaaAbiModule.default;
  
  // 转换为Wei
  const amountWei = parseEther(amount);
  
  try {
    console.log(`🔄 调用合约的批量transferAndLock功能`);
    
    // 创建50个相同锁定时间的锁定信息数组
    const lockInfos = Array.from({ length: count }, (_, i) => ({
      to: recipientAddress as `0x${string}`,
      amount: amountWei,
      lockSeconds: BigInt(lockTime * (i+1)) // 固定锁定时间
    }));
    
    console.log(`📊 生成了${count}个锁定信息，每个锁定${lockTime}秒（${lockTime / 86400}天）`);
    
    // 执行批量transferAndLock
    const hash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: xaaAbi,
      functionName: 'batchTransferAndLock',
      args: [
        lockInfos
      ],
    });
    
    console.log(`📤 批量transferAndLock交易已发送: ${hash}`);
    
    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 120000 // 120秒超时
    });
    
    if (receipt.status === 'success') {
      console.log(`✅ 批量transferAndLock成功 - Hash: ${hash}`);
      
      return {
        success: true,
        completedCount: count,
        failedCount: 0,
        transactions: [{
          index: 0,
          txHash: hash,
          status: 'success'
        }]
      };
    } else {
      console.error(`❌ 批量transferAndLock失败 - Hash: ${hash}`);
      
      return {
        success: false,
        completedCount: 0,
        failedCount: count,
        transactions: [{
          index: 0,
          txHash: hash,
          status: 'failed',
          error: 'Transaction failed'
        }]
      };
    }
  } catch (error) {
    console.error(`❌ 批量transferAndLock异常:`, error);
    
    return {
      success: false,
      completedCount: 0,
      failedCount: count,
      transactions: [{
        index: 0,
        txHash: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    };
  }
}

/**
 * 添加流动性到DBCSwap池子
 */
async function addLiquidityToPool(
  tokenAddress: string,
  tokenAmount: string,
  agentId: string
): Promise<{
  success: boolean;
  txHash?: string;
  poolAddress?: string;
  nftTokenId?: string;
  error?: string;
}> {
  try {
    console.log(`🏊 开始添加流动性 - 代币: ${tokenAddress}, 数量: ${tokenAmount}`);

    // 获取Agent信息以获取总供应量
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { totalSupply: true }
    });

    if (!agent?.totalSupply) {
      throw new Error('Agent总供应量未设置');
    }

    // 获取Agent的IAO合约地址
    const agentInfo = await getAgentInfo(agentId);

    // 调用流动性分发函数
    const result = await distributeLiquidityForAgent(
      agentId,
      tokenAddress,
      agent.totalSupply.toString(),
      agentInfo.iaoContractAddress
    );

    if (result.success) {
      console.log(`✅ 流动性添加成功 - 池子: ${result.poolAddress}, 交易: ${result.txHash}, NFT Token ID: ${result.nftTokenId}`);
      return {
        success: true,
        txHash: result.txHash,
        poolAddress: result.poolAddress,
        nftTokenId: result.nftTokenId
      };
    } else {
      console.error(`❌ 流动性添加失败: ${result.error}`);
      return {
        success: false,
        error: result.error
      };
    }

  } catch (error) {
    console.error('❌ 添加流动性异常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 创建分配任务记录（使用 Task 表）
 */
async function createDistributionTask(agentId: string, totalSupply: string, tokenAddress: string, userAddress: string) {
  console.log(`📝 创建分发任务记录 - Agent: ${agentId}, 总供应量: ${totalSupply}`);

  const task = await prisma.task.create({
    data: {
      type: 'DISTRIBUTE_TOKENS',
      status: 'PENDING',
      agentId,
      createdBy: userAddress,
      result: JSON.stringify({
        metadata: {
          totalSupply,
          tokenAddress,
          createdBy: userAddress,
        }
      }),
    },
  });

  console.log(`✅ 分发任务创建成功 - Task ID: ${task.id}`);



  return task;
}

/**
 * 更新分配任务状态（更新 Task 表）
 */
async function updateDistributionTask(taskId: string, status: string, transactions: TransactionResult[]) {
  console.log(`🔍 [DEBUG] 更新任务状态 - ID: ${taskId}, Status: ${status}`);

  const taskResult = {
    status,
    completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
    transactions: transactions.map(tx => ({
      type: tx.type,
      amount: tx.amount,
      txHash: tx.txHash,
      status: tx.status,
      toAddress: tx.toAddress,
      error: tx.error,
    })),
  };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      result: JSON.stringify(taskResult),
      completedAt: status === 'COMPLETED' ? new Date() : null,
    },
  });

  console.log(`✅ 任务状态已更新: ${taskId} -> ${status}`);
}

/**
 * 通过交易记录验证任务是否匹配当前token（用于历史数据兼容）
 */
async function verifyTaskByTransactions(taskData: any, agentInfo: any, tokenAddress: string): Promise<boolean> {
  console.log(`     🔍 通过交易记录验证任务匹配性 (token: ${tokenAddress})...`);

  if (!taskData.transactions || taskData.transactions.length === 0) {
    console.log(`     ❌ 没有交易记录，无法验证`);
    return false;
  }

  // 检查 creator 交易是否匹配当前 agent 的 creator
  const creatorTx = taskData.transactions.find((tx: any) => tx.type === 'creator');
  if (creatorTx) {
    const creatorMatches = creatorTx.toAddress.toLowerCase() === agentInfo.creator.address.toLowerCase();
    console.log(`     🔍 Creator 地址验证:`);
    console.log(`       - 交易中的 creator: ${creatorTx.toAddress}`);
    console.log(`       - Agent 的 creator: ${agentInfo.creator.address}`);
    console.log(`       - 地址匹配: ${creatorMatches ? '✅' : '❌'}`);

    if (!creatorMatches) {
      console.log(`     ❌ Creator 地址不匹配，这不是当前 agent 的任务`);
      return false;
    }
  }

  // 检查分配地址是否匹配预期的合约地址
  const airdropTx = taskData.transactions.find((tx: any) => tx.type === 'airdrop');
  const miningTx = taskData.transactions.find((tx: any) => tx.type === 'mining');

  let addressMatches = 0;
  let totalChecks = 0;

  if (airdropTx) {
    totalChecks++;
    const airdropMatches = airdropTx.toAddress.toLowerCase() === DISTRIBUTION_ADDRESSES.AIRDROP.toLowerCase();
    console.log(`     🔍 Airdrop 地址验证: ${airdropMatches ? '✅' : '❌'}`);
    if (airdropMatches) addressMatches++;
  }

  if (miningTx) {
    totalChecks++;
    const miningContractAddress = getMiningContractAddress();
    const miningMatches = miningTx.toAddress.toLowerCase() === miningContractAddress.toLowerCase();
    console.log(`     🔍 Mining 地址验证: ${miningMatches ? '✅' : '❌'}`);
    if (miningMatches) addressMatches++;
  }

  // 如果大部分地址都匹配，认为是同一个系统的任务
  const matchRatio = totalChecks > 0 ? addressMatches / totalChecks : 0;
  console.log(`     📊 地址匹配率: ${addressMatches}/${totalChecks} (${(matchRatio * 100).toFixed(1)}%)`);

  const isVerified = matchRatio >= 0.5; // 至少50%的地址匹配
  console.log(`     ${isVerified ? '✅' : '❌'} 交易记录验证${isVerified ? '通过' : '失败'}`);

  return isVerified;
}

/**
 * 合并历史分配任务，获取已完成的步骤列表
 */
async function getCompletedStepsFromHistory(agentId: string, tokenAddress: string): Promise<string[]> {
  console.log(`🔍 查找已有分配任务 - agentId: ${agentId}, tokenAddress: ${tokenAddress}`);

  // 查询所有相关的分发任务记录
  const allTasks = await prisma.task.findMany({
    where: {
      agentId,
      type: 'DISTRIBUTE_TOKENS'
    },
    orderBy: { createdAt: 'desc' }, // 按时间倒序，最新的在前面
  });

  console.log(`🔍 [DEBUG] 数据库查询结果:`);
  console.log(`  - 找到任务数量: ${allTasks.length}`);
  allTasks.forEach((task, index) => {
    console.log(`  - 任务${index + 1}: ID=${task.id}, Status=${task.status}, CreatedAt=${task.createdAt}`);
    console.log(`    - result字段类型: ${typeof task.result}`);
    const resultData = task.result as any;
    const hasTransactions = resultData?.transactions && Array.isArray(resultData.transactions) && resultData.transactions.length > 0;
    console.log(`    - 是否有transactions: ${hasTransactions}`);
    if (hasTransactions) {
      console.log(`    - transactions数量: ${resultData.transactions.length}`);
      resultData.transactions.forEach((tx: any, txIndex: number) => {
        console.log(`      - 交易${txIndex + 1}: ${tx.type} - ${tx.status}`);
      });
    }
    console.log(`    - result字段内容: ${task.result ? JSON.stringify(task.result).substring(0, 200) + '...' : 'null'}`);
  });

  console.log(`📋 找到 ${allTasks.length} 条相关分发任务记录，开始合并所有交易记录...`);

  // 合并所有任务中的交易记录
  const mergedTransactions: { [key: string]: any } = {};
  let latestMetadata: any = null;
  let hasMatchingTasks = false;

  for (let i = 0; i < allTasks.length; i++) {
    const task = allTasks[i];
    console.log(`  处理任务 ${i + 1}/${allTasks.length}: ID=${task.id}, Status=${task.status}, CreatedAt=${task.createdAt}`);

    // 解析任务数据
    let taskData = null;
    if (task.result) {
      try {
        taskData = task.result as any;
        console.log(`     ✅ 成功解析任务数据`);
      } catch (e) {
        console.log(`     ❌ 解析任务数据失败: ${e}`);
        continue;
      }
    } else {
      console.log(`     ⚠️  任务数据为空，跳过`);
      continue;
    }

    // 检查是否匹配当前tokenAddress
    const metadata = taskData.metadata || taskData;
    if (metadata.tokenAddress && metadata.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
      console.log(`     ✅ 任务匹配当前tokenAddress`);
      hasMatchingTasks = true;

      // 保存最新的metadata
      if (!latestMetadata) {
        latestMetadata = metadata;
      }

      // 合并transactions
      if (taskData.transactions && Array.isArray(taskData.transactions)) {
        console.log(`     🔄 合并 ${taskData.transactions.length} 个交易记录`);

        taskData.transactions.forEach((tx: any) => {
          const txType = tx.type;
          console.log(`       - 处理交易: ${txType} - ${tx.status}`);

          // 如果还没有这种类型的交易，或者当前是成功的交易，则更新
          if (!mergedTransactions[txType] || tx.status === 'confirmed') {
            if (mergedTransactions[txType] && tx.status === 'confirmed') {
              console.log(`         ⭐ 用成功交易覆盖之前的记录: ${txType}`);
            } else if (!mergedTransactions[txType]) {
              console.log(`         📝 记录新交易: ${txType} - ${tx.status}`);
            }
            mergedTransactions[txType] = { ...tx };
          } else {
            console.log(`         ⏭️  跳过交易（已有更好的记录）: ${txType}`);
          }
        });
      } else {
        console.log(`     ⚠️  任务无交易记录`);
      }
    } else {
      console.log(`     ❌ 任务不匹配当前tokenAddress`);
    }
  }

  if (!hasMatchingTasks) {
    console.log(`❌ 未找到匹配的分配任务`);
    return [];
  }

  // 获取已完成的步骤列表
  const completedSteps = Object.values(mergedTransactions)
    .filter((tx: any) => tx.status === 'confirmed')
    .map((tx: any) => tx.type);

  console.log(`🎯 合并完成，已完成的步骤:`);
  console.log(`  - 总交易数量: ${Object.keys(mergedTransactions).length}`);
  console.log(`  - 已完成步骤: ${completedSteps.join(', ') || '无'}`);

  Object.values(mergedTransactions).forEach((tx: any, index: number) => {
    console.log(`    ${index + 1}. ${tx.type}: ${tx.status} (${tx.amount}) -> ${tx.toAddress || 'N/A'}`);
  });

  // 返回已完成的步骤列表
  return completedSteps;
}

/**
 * 智能余额检查：只检查未完成步骤所需的余额
 */
async function checkRequiredBalance(
  tokenAddress: string,
  distributions: DistributionAmounts,
  completedSteps: string[],
  includeBurn: boolean,
  burnPercentage: number,
  totalSupply: string
) {
  console.log(`💰 智能余额检查 - 只检查未完成步骤...`);

  const tokenBalance = await checkTokenBalance(tokenAddress);
  let requiredAmount = BigInt(0);
  const pendingSteps: string[] = [];

  // 计算未完成步骤所需的代币数量
  if (!completedSteps.includes('creator')) {
    requiredAmount += parseEther(distributions.creator);
    pendingSteps.push(`创建者 (${distributions.creator})`);
  }

  if (!completedSteps.includes('airdrop')) {
    requiredAmount += parseEther(distributions.airdrop);
    pendingSteps.push(`空投 (${distributions.airdrop})`);
  }

  if (!completedSteps.includes('mining')) {
    requiredAmount += parseEther(distributions.mining);
    pendingSteps.push(`挖矿 (${distributions.mining})`);
  }

  if (includeBurn && !completedSteps.includes('burn')) {
    const burnAmount = calculateBurnAmount(totalSupply, burnPercentage);
    requiredAmount += parseEther(burnAmount);
    pendingSteps.push(`销毁 (${burnAmount})`);
  }

  const requiredFormatted = formatEther(requiredAmount);

  console.log(`💰 余额检查结果:`);
  console.log(`  - 当前余额: ${tokenBalance.formatted}`);
  console.log(`  - 需要余额: ${requiredFormatted}`);
  console.log(`  - 待执行步骤: ${pendingSteps.join(', ')}`);
  console.log(`  - 已完成步骤: ${completedSteps.join(', ') || '无'}`);
  console.log(`  - 余额充足: ${BigInt(tokenBalance.balance) >= requiredAmount ? '✅' : '❌'}`);

  if (BigInt(tokenBalance.balance) < requiredAmount) {
    throw new Error(`Insufficient token balance for pending steps. Required: ${requiredFormatted}, Available: ${tokenBalance.formatted}`);
  }

  console.log(`✅ 余额检查通过，可以执行剩余 ${pendingSteps.length} 个步骤`);
}

/**
 * 执行单笔代币转账
 */
async function executeTransfer(
  tokenAddress: string,
  toAddress: string,
  amount: string,
  type: TransactionResult['type']
): Promise<TransactionResult> {
  const { walletClient, publicClient } = initializeClients();

  try {
    console.log(`🔍 [DEBUG] 📤 开始 ${type} 转账: ${amount} tokens -> ${toAddress}`);

    // ERC20 transfer 函数
    const hash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ],
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, parseEther(amount)],
    });

    console.log(`🔍 [DEBUG] 📤 ${type} 转账已发送: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const status = receipt.status === 'success' ? 'confirmed' as const : 'failed' as const;
    console.log(`🔍 [DEBUG] ${status === 'confirmed' ? '✅' : '❌'} ${type} 转账${status}: ${hash}`);

    const result: TransactionResult = {
      type,
      amount,
      txHash: hash,
      status,
      toAddress,
    };
    console.log(`🔍 [DEBUG] ${type} 转账最终结果:`, result);
    return result;
  } catch (error) {
    console.error(`🔍 [DEBUG] ❌ ${type} 转账失败:`, error);
    const result = {
      type,
      amount,
      txHash: '',
      status: 'failed' as const,
      toAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.log(`🔍 [DEBUG] ${type} 转账失败结果:`, result);
    return result;
  }
}

/**
 * 计算分配数量
 */
function calculateDistributions(totalSupply: string): DistributionAmounts {
  console.log(`📊 开始计算分配数量 - 总供应量: ${totalSupply}`);

  const total = parseEther(totalSupply);
  const hundred = BigInt(100);

  const distributions = {
    creator: formatEther(total * BigInt(Math.floor(DISTRIBUTION_RATIOS.CREATOR * 100)) / hundred),
    iao: formatEther(total * BigInt(Math.floor(DISTRIBUTION_RATIOS.IAO * 100)) / hundred),
    liquidity: formatEther(total * BigInt(Math.floor(DISTRIBUTION_RATIOS.LIQUIDITY * 100)) / hundred),
    airdrop: formatEther(total * BigInt(Math.floor(DISTRIBUTION_RATIOS.AIRDROP * 100)) / hundred),
    mining: formatEther(total * BigInt(Math.floor(DISTRIBUTION_RATIOS.MINING * 100)) / hundred),
  };

  console.log(`📊 分配数量计算完成:`);
  console.log(`  - 创建者 (${DISTRIBUTION_RATIOS.CREATOR * 100}%): ${distributions.creator}`);
  console.log(`  - IAO合约 (${DISTRIBUTION_RATIOS.IAO * 100}%): ${distributions.iao} [已由恒源自动分配]`);
  console.log(`  - 流动性 (${DISTRIBUTION_RATIOS.LIQUIDITY * 100}%): ${distributions.liquidity} [暂时禁用]`);
  console.log(`  - 空投 (${DISTRIBUTION_RATIOS.AIRDROP * 100}%): ${distributions.airdrop}`);
  console.log(`  - AI挖矿 (${DISTRIBUTION_RATIOS.MINING * 100}%): ${distributions.mining}`);

  return distributions;
}

/**
 * 主要的代币分配函数（包含销毁功能）
 */
export async function distributeTokens(
  agentId: string,
  totalSupply: string,
  tokenAddress: string,
  userAddress: string,
  options?: {
    includeBurn?: boolean;
    burnPercentage?: number; // 销毁百分比，默认5%
    skipSuccessful?: boolean; // 是否跳过已成功的步骤
  }
): Promise<DistributionResult> {
  let task: any = null;
  const { includeBurn = false, burnPercentage = 5, skipSuccessful = true } = options || {}; // 默认启用跳过成功步骤

  try {
    console.log('🔍 [DEBUG] 🚀 开始代币分配');
    console.log(`🔍 [DEBUG] Agent: ${agentId}, 总供应量: ${totalSupply}`);
    if (includeBurn) {
      console.log(`🔍 [DEBUG] 🔥 包含销毁步骤 - 销毁比例: ${burnPercentage}%`);
    }
    if (skipSuccessful) {
      console.log('🔍 [DEBUG] ⏭️ 启用容错模式 - 跳过已成功的步骤');
    }

    // 获取 Agent 信息
    console.log('🔍 [DEBUG] 获取 Agent 信息...');
    const agentInfo = await getAgentInfo(agentId);
    console.log('🔍 [DEBUG] Agent 信息:', agentInfo);

    // 验证 Agent 是否有有效的代币地址
    if (!agentInfo.tokenAddress) {
      throw new Error(`Agent ${agentId} does not have a valid token address. Please create the token first.`);
    }

    // 验证提供的 tokenAddress 是否与 Agent 记录匹配
    if (agentInfo.tokenAddress.toLowerCase() !== tokenAddress.toLowerCase()) {
      throw new Error(`Token address mismatch. Agent token: ${agentInfo.tokenAddress}, Provided: ${tokenAddress}`);
    }

    // 验证参数
    const supply = parseEther(totalSupply);
    if (supply <= BigInt(0)) {
      throw new Error('Invalid total supply');
    }

    // 获取已完成的步骤
    let completedSteps: string[] = [];

    console.log(`🔍 开始查找已有任务 - skipSuccessful: ${skipSuccessful}`);

    if (skipSuccessful) {
      completedSteps = await getCompletedStepsFromHistory(agentId, tokenAddress);
      console.log(`📋 从历史记录中获取已完成步骤: ${completedSteps.join(', ') || '无'}`);

      if (completedSteps.length > 0) {
        console.log(`🎯 找到已完成的步骤，将跳过这些步骤继续分发`);
      } else {
        console.log(`📝 没有找到已完成的步骤，将执行完整分发流程`);
      }
    } else {
      console.log(`⏭️ 跳过已有任务检查 (skipSuccessful=false)`);
    }

    // 创建新的分配任务记录
    console.log(`📝 创建新的分配任务记录...`);
    task = await createDistributionTask(agentId, totalSupply, tokenAddress, userAddress);
    console.log(`📝 分配任务创建成功: ${task.id}`);

    // 计算分配数量
    const distributions = calculateDistributions(totalSupply);

    // 智能余额检查：只检查未完成步骤所需的余额
    await checkRequiredBalance(tokenAddress, distributions, completedSteps, includeBurn, burnPercentage, totalSupply);

    // 执行分配
    console.log(`🚀 开始执行代币分配交易...`);

    // 初始化交易记录数组
    let transactions: TransactionResult[] = [];

    // 1. 分配给创建者 (33%)，使用批量transferAndLock锁定50次
    if (!completedSteps.includes('creator')) {
      console.log(`🔍 [DEBUG] 👤 [1/3] 分配给创建者 (${DISTRIBUTION_RATIOS.CREATOR * 100}%): ${distributions.creator} -> ${agentInfo.creator.address}，批量锁定50次`);
      
      try {
        // 计算每次锁定的金额（总金额除以50）
        const totalAmount = parseFloat(distributions.creator);
        const perLockAmount = (totalAmount / 50).toFixed(18); // 保留18位小数
        console.log(`🔍 [DEBUG] 👤 每次锁定金额: ${perLockAmount} (总计: ${distributions.creator})`);
        
        // 使用批量transferAndLock函数，一次性锁定50次，每次都是40天
        const batchResult = await batchTransferAndLock(
          tokenAddress,
          agentInfo.creator.address,
          perLockAmount,
          40 * 24 * 60 * 60, // 锁定40天
          50, // 执行50次
          5, // 并发数参数（已不再使用）
          3  // 最大重试次数参数（已不再使用）
        );
        
        console.log(`🔍 [DEBUG] 👤 批量锁定结果: 成功=${batchResult.completedCount}, 失败=${batchResult.failedCount}`);
        
        // 创建交易结果
        const creatorTx: TransactionResult = {
          type: 'creator',
          amount: distributions.creator,
          txHash: batchResult.transactions.length > 0 ? batchResult.transactions[0].txHash : '',
          status: batchResult.success ? 'confirmed' as const : 'failed' as const,
          toAddress: agentInfo.creator.address,
          error: batchResult.success ? undefined : `Failed to complete all transfers: ${batchResult.failedCount} failed out of 50`,
          batchResult: {
            completedCount: batchResult.completedCount,
            failedCount: batchResult.failedCount,
            transactions: batchResult.transactions.map(tx => ({
              txHash: tx.txHash,
              status: tx.status,
              error: tx.error
            }))
          }
        };
        
        transactions.push(creatorTx);
        console.log(`🔍 [DEBUG] 👤 创建者批量分配结果: ${batchResult.success ? '✅ 全部成功' : '⚠️ 部分失败'}`);
      } catch (error) {
        console.error(`🔍 [DEBUG] ❌ 创建者分配失败(批量transferAndLock):`, error);
        const creatorTx: TransactionResult = {
          type: 'creator',
          amount: distributions.creator,
          txHash: '',
          status: 'failed' as const,
          toAddress: agentInfo.creator.address,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        transactions.push(creatorTx);
      }
    } else {
      console.log(`🔍 [DEBUG] 👤 [1/3] 跳过创建者分配 - 已完成 ✅`);
    }

    // 2. IAO合约分配 (15%) - 已由合约自动完成，无需手动分配。但是要调用一下 setRewardToken
    console.log(`🏦 跳过IAO合约分配 (${DISTRIBUTION_RATIOS.IAO * 100}%) - 恒源已自动完成此分配`);
    if (agentInfo.iaoContractAddress) {
      console.log(`🏦 IAO合约地址: ${agentInfo.iaoContractAddress} (已自动分配)`);
      
      // 调用setRewardToken设置奖励代币
      try {
        console.log(`🔄 调用IAO合约的setRewardToken方法 - 设置奖励代币: ${tokenAddress}`);
        
        // 获取合约ABI
        const { getContractABI } = await import('@/config/contracts');
        const contractABI = getContractABI('UserAgent'); // 非XAA代币使用UserAgent IAO ABI
        
        // 调用setRewardToken方法
        const hash = await walletClient.writeContract({
          address: agentInfo.iaoContractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'setRewardToken',
          args: [tokenAddress as `0x${string}`],
        });
        
        console.log(`✅ setRewardToken交易已提交: ${hash}`);
        
        // 等待交易确认
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
          console.log(`✅ 奖励代币设置成功 - Token: ${tokenAddress}`);
        } else {
          console.warn(`⚠️ 奖励代币设置交易状态异常: ${receipt.status}`);
        }
      } catch (error) {
        console.error('❌ 设置奖励代币失败:', error);
        // 继续执行其他分配步骤，不中断流程
      }
    }

    // 3. 分配给空投钱包 (2%)
    if (!completedSteps.includes('airdrop')) {
      console.log(`🔍 [DEBUG] 🎁 [2/${includeBurn ? '5' : '4'}] 分配给空投钱包 (${DISTRIBUTION_RATIOS.AIRDROP * 100}%): ${distributions.airdrop} -> ${DISTRIBUTION_ADDRESSES.AIRDROP}`);
      const airdropTx = await executeTransfer(
        tokenAddress,
        DISTRIBUTION_ADDRESSES.AIRDROP,
        distributions.airdrop,
        'airdrop'
      );
      transactions.push(airdropTx);
      console.log(`🔍 [DEBUG] 🎁 空投钱包分配结果: ${airdropTx.status === 'confirmed' ? '✅ 成功' : airdropTx.status === 'failed' ? '❌ 失败' : '⏳ 待确认'} - Hash: ${airdropTx.txHash || 'N/A'}`);
    } else {
      console.log(`🔍 [DEBUG] 🎁 [2/${includeBurn ? '5' : '4'}] 跳过空投钱包分配 - 已完成 ✅`);
    }

    // 4. 分配给AI挖矿合约 (40%)
    if (!completedSteps.includes('mining')) {
      console.log(`⛏️ [3/${includeBurn ? '5' : '4'}] 分配给AI挖矿合约 (${DISTRIBUTION_RATIOS.MINING * 100}%): ${distributions.mining} -> ${getMiningContractAddress()}`);
      const miningTx = await executeTransfer(
        tokenAddress,
        getMiningContractAddress(),
        distributions.mining,
        'mining'
      );
      transactions.push(miningTx);
      console.log(`⛏️ AI挖矿合约分配结果: ${miningTx.status === 'confirmed' ? '✅ 成功' : miningTx.status === 'failed' ? '❌ 失败' : '⏳ 待确认'} - Hash: ${miningTx.txHash || 'N/A'}`);
    } else {
      console.log(`⛏️ [3/${includeBurn ? '5' : '4'}] 跳过AI挖矿合约分配 - 已完成 ✅`);
    }

    // 5. 添加DBCSwap流动性 (10%) - 在其他分发完成后执行
    if (!completedSteps.includes('liquidity')) {
      console.log(`💧 [4/${includeBurn ? '5' : '4'}] 添加DBCSwap流动性 (${DISTRIBUTION_RATIOS.LIQUIDITY * 100}%): ${distributions.liquidity} 代币`);

      try {
        const liquidityResult = await addLiquidityToPool(
          tokenAddress,
          distributions.liquidity,
          agentId
        );

        const liquidityTx: TransactionResult = {
          type: 'liquidity',
          amount: distributions.liquidity,
          txHash: liquidityResult.txHash || 'N/A',
          status: liquidityResult.success ? 'confirmed' : 'failed',
          toAddress: liquidityResult.poolAddress || null, // 使用 null 表示池子地址未知
          error: liquidityResult.error,
          nftTokenId: liquidityResult.nftTokenId
        };

        transactions.push(liquidityTx);
        console.log(`💧 流动性添加结果: ${liquidityTx.status === 'confirmed' ? '✅ 成功' : '❌ 失败'} - Hash: ${liquidityTx.txHash || 'N/A'}`);

        if (liquidityResult.success && liquidityResult.poolAddress) {
          console.log(`🏊 池子地址: ${liquidityResult.poolAddress}`);
        }

      } catch (error) {
        console.error('❌ 流动性添加失败:', error);

        // 尝试从数据库获取池子地址用于记录
        let poolAddress: string | null = null;
        try {
          const agent = await prisma.agent.findUnique({
            where: { id: agentId },
            select: { poolAddress: true }
          });
          poolAddress = agent?.poolAddress || null; // 如果没有池子地址，使用 null
        } catch (dbError) {
          console.warn('获取池子地址失败:', dbError);
        }

        const liquidityTx: TransactionResult = {
          type: 'liquidity',
          amount: distributions.liquidity,
          txHash: 'N/A',
          status: 'failed',
          toAddress: poolAddress, // 可能是 null，表示池子地址未知
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        transactions.push(liquidityTx);
      }
    } else {
      console.log(`💧 [4/${includeBurn ? '5' : '4'}] 跳过流动性添加 - 已完成 ✅`);
    }

    // 6. 销毁代币 (可选) - 最后执行
    if (includeBurn && !completedSteps.includes('burn')) {
      console.log(`🔥 [5/5] 销毁代币 (${burnPercentage}%) - 最后步骤`);
      const burnAmount = calculateBurnAmount(totalSupply, burnPercentage);
      console.log(`🔥 计算销毁数量: ${burnAmount} 代币`);

      const burnResult = await burnTokens(tokenAddress as `0x${string}`, burnAmount);
      const burnTx: TransactionResult = {
        type: 'burn',
        amount: burnAmount,
        txHash: burnResult.txHash,
        status: burnResult.status,
        toAddress: burnResult.toAddress,
        error: burnResult.error
      };
      transactions.push(burnTx);
      console.log(`🔥 代币销毁结果: ${burnTx.status === 'confirmed' ? '✅ 成功' : burnTx.status === 'failed' ? '❌ 失败' : '⏳ 待确认'} - Hash: ${burnTx.txHash || 'N/A'}`);
    } else if (includeBurn && completedSteps.includes('burn')) {
      console.log(`🔥 [5/5] 跳过代币销毁 - 已完成 ✅`);
    }

    console.log(`📊 所有${includeBurn ? '分配和销毁' : '分配'}交易执行完成，共 ${transactions.length} 笔交易`);

    // 检查是否有失败的交易
    console.log('🔍 [DEBUG] 检查交易结果...');
    const failedTxs = transactions.filter(tx => tx.status === 'failed');
    const confirmedTxs = transactions.filter(tx => tx.status === 'confirmed');
    const pendingTxs = transactions.filter(tx => tx.status === 'pending');
    const status = failedTxs.length === 0 ? 'COMPLETED' : 'PARTIAL_FAILED';

    console.log('🔍 [DEBUG] 📊 分配结果汇总:');
    console.log(`🔍 [DEBUG]   - 总交易数: ${transactions.length}`);
    console.log(`🔍 [DEBUG]   - 成功交易: ${confirmedTxs.length} ✅`);
    console.log(`🔍 [DEBUG]   - 待确认交易: ${pendingTxs.length} ⏳`);
    console.log(`🔍 [DEBUG]   - 失败交易: ${failedTxs.length} ❌`);
    console.log(`🔍 [DEBUG]   - 最终状态: ${status}`);

    console.log('🔍 [DEBUG] 所有交易详情:');
    transactions.forEach((tx, index) => {
      console.log(`🔍 [DEBUG]   ${index + 1}. ${tx.type} - ${tx.status} - ${tx.amount} -> ${tx.toAddress}`);
      if (tx.txHash) console.log(`🔍 [DEBUG]      Hash: ${tx.txHash}`);
      if (tx.error) console.log(`🔍 [DEBUG]      错误: ${tx.error}`);
    });

    if (failedTxs.length > 0) {
      // console.log('🔍 [DEBUG] ❌ 失败交易详情:');
      failedTxs.forEach((tx, index) => {
        console.log(`🔍 [DEBUG]   ${index + 1}. ${tx.type} - ${tx.amount} -> ${tx.toAddress}`);
        console.log(`🔍 [DEBUG]      错误: ${tx.error || '未知错误'}`);
      });
    }

    // 更新数据库状态
    console.log(`🔍 [DEBUG] 💾 更新数据库任务状态: ${status}`);
    await updateDistributionTask(task.id, status, transactions);

    console.log(`🔍 [DEBUG] ${status === 'COMPLETED' ? '✅' : '⚠️'} 代币分配${status === 'COMPLETED' ? '完成' : '部分失败'} - 共执行 ${transactions.length} 笔交易，${failedTxs.length} 笔失败`);

    const result = {
      success: status === 'COMPLETED',
      taskId: task.id,
      data: {
        transactions,
        totalDistributed: totalSupply,
      },
      error: failedTxs.length > 0 ? `${failedTxs.length} transactions failed` : undefined,
    };
    console.log('🔍 [DEBUG] 最终返回结果:', result);
    return result;
  } catch (error) {
    console.error('❌ 代币分配失败:', error);

    // 更新任务状态为失败
    if (task) {
      await updateDistributionTask(task.id, 'FAILED', []);
    }

    return {
      success: false,
      taskId: task?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 重试批量transferAndLock操作
 * 专门用于重试creator类型交易中的批量transferAndLock操作
 */
async function retryCreatorBatchTransferAndLock(
  tokenAddress: string,
  recipientAddress: string,
  totalAmount: string,
  failedCount: number
): Promise<TransactionResult> {
  console.log(`🔄 开始重试creator的批量transferAndLock操作 - 总金额: ${totalAmount}, 预计失败数: ${failedCount}`);
  
  try {
    // 计算每次锁定的金额（总金额除以50）
    const amount = parseFloat(totalAmount);
    const perLockAmount = (amount / 50).toFixed(18); // 保留18位小数
    console.log(`🔍 [DEBUG] 👤 每次锁定金额: ${perLockAmount} (总计: ${totalAmount})`);
    
    // 使用新的批量transferAndLock方法，固定40天锁定时间
    const batchResult = await batchTransferAndLock(
      tokenAddress,
      recipientAddress,
      perLockAmount,
      40 * 24 * 60 * 60, // 锁定40天
      failedCount, // 只执行之前失败的次数
      5, // 并发数参数（已不再使用）
      3  // 最大重试次数参数（已不再使用）
    );
    
    console.log(`🔍 [DEBUG] 👤 批量锁定重试结果: 成功=${batchResult.completedCount}, 失败=${batchResult.failedCount}`);
    
    // 创建交易结果
    return {
      type: 'creator',
      amount: totalAmount,
      txHash: batchResult.transactions.length > 0 ? batchResult.transactions[0].txHash : '',
      status: batchResult.failedCount === 0 ? 'confirmed' as const : 'failed' as const,
      toAddress: recipientAddress,
      error: batchResult.failedCount > 0 ? `Failed to complete all transfers: ${batchResult.failedCount} failed out of ${failedCount}` : undefined,
      batchResult: {
        completedCount: batchResult.completedCount,
        failedCount: batchResult.failedCount,
        transactions: batchResult.transactions.map(tx => ({
          txHash: tx.txHash,
          status: tx.status,
          error: tx.error
        }))
      }
    };
  } catch (error) {
    console.error('❌ 重试批量transferAndLock失败:', error);
    return {
      type: 'creator',
      amount: totalAmount,
      txHash: '',
      status: 'failed' as const,
      toAddress: recipientAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 重试失败的交易（智能跳过已成功的步骤）
 */
export async function retryFailedTransactions(taskId: string): Promise<DistributionResult> {
  try {
    console.log(`🔄 开始重试任务: ${taskId}`);

    // 获取任务信息 - 从 Task 表查找
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      console.log(`❌ 任务未找到 - Task ID: ${taskId}`);
      throw new Error('Task not found');
    }

    console.log(`✅ 找到任务:`, {
      id: task.id,
      type: task.type,
      status: task.status,
      agentId: task.agentId
    });

    // 获取Agent信息和代币地址
    const agent = await prisma.agent.findUnique({
      where: { id: task.agentId },
      select: { tokenAddress: true }
    });

    const tokenAddress = agent?.tokenAddress;
    console.log(`🪙 从 Agent 表获取代币地址: ${tokenAddress}`);

    if (!tokenAddress) {
      throw new Error(`Agent ${task.agentId} 没有代币地址`);
    }

    // 使用统一的合并逻辑获取完整交易历史
    console.log(`🔄 应用合并逻辑获取完整交易历史...`);
    const { getMergedDistributionTasksFromDB } = await import('@/lib/task-utils');
    const mergedResult = await getMergedDistributionTasksFromDB(task.agentId);

    if (!mergedResult || mergedResult.transactions.length === 0) {
      console.log(`⚠️ 没有找到任何交易记录`);
      throw new Error('No transaction records found for retry');
    }

    const transactions = mergedResult.transactions;
    console.log(`📋 合并后获得 ${transactions.length} 个交易记录`);
    console.log(`🪙 任务代币地址: ${tokenAddress}`);
    console.log(`📋 交易详情:`, transactions.map((tx: any) => ({
      type: tx.type,
      status: tx.status,
      amount: tx.amount
    })));

    // 获取失败的交易
    const failedTransactions = transactions.filter((tx: any) => tx.status === 'failed');

    if (failedTransactions.length === 0) {
      return {
        success: true,
        taskId,
        data: {
          transactions: transactions as any,
          totalDistributed: mergedResult.task.result?.metadata?.totalSupply || '0',
        },
      };
    }

    console.log(`🔄 智能重试 ${failedTransactions.length} 笔失败的交易`);
    console.log(`✅ 跳过 ${transactions.length - failedTransactions.length} 笔已成功的交易`);

    // 重试失败的交易
    const retryResults: TransactionResult[] = [];
    for (const failedTx of failedTransactions) {
      console.log(`🔄 重试 ${failedTx.type} 交易: ${failedTx.amount} -> ${failedTx.toAddress}`);

      let result: TransactionResult;

      // 根据交易类型选择重试方法
      if (failedTx.type === 'burn' || (failedTx.toAddress === '0x0000000000000000000000000000000000000000' || failedTx.toAddress === '0x000000000000000000000000000000000000dEaD')) {
        // 销毁交易重试
        const burnResult = await burnTokens(tokenAddress as `0x${string}`, failedTx.amount);
        result = {
          type: failedTx.type,
          amount: failedTx.amount,
          txHash: burnResult.txHash,
          status: burnResult.status,
          toAddress: burnResult.toAddress,
          error: burnResult.error
        };
      } else if (failedTx.type === 'liquidity' || failedTx.toAddress === null) {
        // 流动性添加重试 - 使用专门的流动性添加函数
        console.log(`🔄 重试流动性添加: ${failedTx.amount} 代币`);
        try {
          // 先从数据库获取池子地址
          const agent = await prisma.agent.findUnique({
            where: { id: task.agentId },
            select: { poolAddress: true }
          });

          const liquidityResult = await addLiquidityToPool(
            tokenAddress,
            failedTx.amount,
            task.agentId
          );

          result = {
            type: 'liquidity',
            amount: failedTx.amount,
            txHash: liquidityResult.txHash || 'N/A',
            status: liquidityResult.success ? 'confirmed' : 'failed',
            toAddress: liquidityResult.poolAddress || agent?.poolAddress || null, // 使用 null 表示池子地址未知
            error: liquidityResult.error
          };
        } catch (error) {
          // 如果重试失败，也尝试从数据库获取池子地址用于记录
          let poolAddress: string | null = null;
          try {
            const agent = await prisma.agent.findUnique({
              where: { id: task.agentId },
              select: { poolAddress: true }
            });
            poolAddress = agent?.poolAddress || null; // 如果没有池子地址，使用 null
          } catch (dbError) {
            console.warn('获取池子地址失败:', dbError);
          }

          result = {
            type: 'liquidity',
            amount: failedTx.amount,
            txHash: 'N/A',
            status: 'failed',
            toAddress: poolAddress, // 可能是 null，表示池子地址未知
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      } else if (failedTx.type === 'creator') {
        // 检查交易对象中是否直接包含batchResult
        let failedBatchCount = 0;
        
        // 首先检查交易对象本身
        if (failedTx.batchResult && typeof failedTx.batchResult === 'object') {
          console.log(`🔍 在交易对象中找到批量操作信息: 失败=${failedTx.batchResult.failedCount}次`);
          failedBatchCount = failedTx.batchResult.failedCount || 0;
        } else {
          // 如果交易对象中没有，尝试从数据库获取
          console.log(`🔍 交易对象中没有批量操作信息，尝试从数据库获取`);
          const taskDetail = await prisma.task.findUnique({
            where: { id: taskId }
          });
          
          // 尝试从任务结果中获取批量操作信息
          if (taskDetail?.result) {
            try {
              const resultData = typeof taskDetail.result === 'string' 
                ? JSON.parse(taskDetail.result) 
                : taskDetail.result;
                
              // 查找creator交易的批量结果
              if (resultData.transactions) {
                const creatorTx = resultData.transactions.find((tx: any) => tx.type === 'creator');
                if (creatorTx?.batchResult) {
                  console.log(`🔍 在数据库中找到批量操作信息: 失败=${creatorTx.batchResult.failedCount}次`);
                  failedBatchCount = creatorTx.batchResult.failedCount || 0;
                }
              }
            } catch (e) {
              console.error('解析任务结果失败:', e);
            }
          }
        }
        
        if (failedBatchCount > 0) {
          // 使用批量transferAndLock重试
          console.log(`🔄 发现creator批量操作失败记录: ${failedBatchCount}次，使用批量重试`);
          result = await retryCreatorBatchTransferAndLock(
            tokenAddress,
            failedTx.toAddress,
            failedTx.amount,
            failedBatchCount
          );
        } else {
          // 如果没有找到失败记录但状态是失败，假设全部失败
          if (failedTx.status === 'failed') {
            console.log(`⚠️ 未找到具体失败记录，但状态为失败，假设需要全部重试`);
            // 使用批量transferAndLock重试，但只执行2次（保守估计）
            result = await retryCreatorBatchTransferAndLock(
              tokenAddress,
              failedTx.toAddress,
              failedTx.amount,
              2 // 保守估计失败次数为2
            );
          } else {
            // 使用普通转账方式重试
            console.log(`🔄 未找到批量操作失败记录，使用普通转账重试`);
            result = await executeTransfer(
              tokenAddress,
              failedTx.toAddress,
              failedTx.amount,
              failedTx.type
            );
            console.log(`⚠️ 注意: 使用单笔转账替代批量transferAndLock进行重试，无法保证锁定功能`);
          }
        }
      } else {
        // 普通转账交易重试
        result = await executeTransfer(
          tokenAddress,
          failedTx.toAddress,
          failedTx.amount,
          failedTx.type
        );
      }

      retryResults.push(result);
      console.log(`${result.status === 'confirmed' ? '✅' : '❌'} ${failedTx.type} 重试结果: ${result.status}`);
    }

    // 合并所有交易结果
    const allTransactions = [
      ...transactions.filter((tx: any) => tx.status !== 'failed'),
      ...retryResults,
    ];

    // 检查重试后的状态
    const stillFailed = retryResults.filter(tx => tx.status === 'failed');
    const newStatus = stillFailed.length === 0 ? 'COMPLETED' : 'PARTIAL_FAILED';

    console.log(`📊 重试结果汇总:`);
    console.log(`  - 重试交易: ${retryResults.length}`);
    console.log(`  - 重试成功: ${retryResults.length - stillFailed.length}`);
    console.log(`  - 仍然失败: ${stillFailed.length}`);

    // 更新数据库
    await updateDistributionTask(taskId, newStatus, allTransactions);

    // 如果重试后任务完成，更新Agent的tokensDistributed状态
    if (newStatus === 'COMPLETED') {
      await prisma.agent.update({
        where: { id: task.agentId },
        data: { tokensDistributed: true } as any
      });
    }

    return {
      success: newStatus === 'COMPLETED',
      taskId,
      data: {
        transactions: allTransactions,
        totalDistributed: mergedResult.task.result?.metadata?.totalSupply || '0',
      },
      error: stillFailed.length > 0 ? `${stillFailed.length} transactions still failed after retry` : undefined,
    };
  } catch (error) {
    console.error('❌ 重试失败:', error);
    return {
      success: false,
      taskId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 管理员提取用户投入到IPO中的代币
 * @param agentId Agent ID
 * @returns 提取结果
 */
export async function claimDepositedTokenFromIAO(agentId: string): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    console.log(`🏦 开始提取IPO中的代币 - Agent ID: ${agentId}`);

    // 检查是否已经执行过 claimDepositedToken
    // 通过查找相关的分发任务来判断是否已经执行过
    const existingDistributionTask = await prisma.task.findFirst({
      where: {
        agentId,
        type: 'DISTRIBUTE_TOKENS',
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (existingDistributionTask && existingDistributionTask.result) {
      try {
        const taskData = JSON.parse(existingDistributionTask.result);
        const claimTransaction = taskData.transactions?.find((tx: any) => tx.type === 'claim');

        if (claimTransaction && claimTransaction.status === 'confirmed') {
          console.log('✅ claimDepositedToken 已经成功执行过，跳过重复执行');
          return {
            success: true,
            txHash: claimTransaction.txHash || 'already_executed',
            error: 'Already executed successfully'
          };
        }
      } catch (e) {
        console.warn('解析任务数据失败:', e);
      }
    }

    // 获取Agent信息
    const agentInfo = await getAgentInfo(agentId);

    if (!agentInfo.iaoContractAddress) {
      console.log('⚠️ 未找到IAO合约地址，跳过提取');
      return {
        success: false,
        error: 'IAO合约地址未设置'
      };
    }

    console.log(`🏦 IAO合约地址: ${agentInfo.iaoContractAddress}`);

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = initializeClients();

    // 导入合约ABI
    const { getContractABI } = await import('@/config/contracts');

    // 获取合约ABI（根据代币类型选择）
    const contractABI = getContractABI('UserAgent'); // 非XAA代币使用UserAgent IAO ABI

    console.log(`📝 执行claimDepositedToken - 合约: ${agentInfo.iaoContractAddress}`);

    // 先检查权限和合约状态
    try {
      console.log(`🔍 开始权限检查...`);

      // 检查是否是管理员
      const isAdmin = await publicClient.readContract({
        address: agentInfo.iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'admins',
        args: [serverAccount.address],
      });
      console.log(`🔍 服务端钱包是否为管理员: ${isAdmin}`);

      // 检查合约所有者
      const owner = await publicClient.readContract({
        address: agentInfo.iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'owner',
      });
      console.log(`🔍 合约所有者: ${owner}`);
      console.log(`🔍 服务端钱包: ${serverAccount.address}`);
      console.log(`🔍 是否为所有者: ${owner.toLowerCase() === serverAccount.address.toLowerCase()}`);

      // 检查IAO是否成功
      const isSuccess = await publicClient.readContract({
        address: agentInfo.iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'isSuccess',
      });
      console.log(`🔍 IAO是否成功: ${isSuccess}`);

      // 检查总投入金额
      const totalDeposited = await publicClient.readContract({
        address: agentInfo.iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'totalDepositedTokenIn',
      });
      console.log(`🔍 总投入金额: ${totalDeposited}`);

      // 检查oracle设置
      const oracle = await publicClient.readContract({
        address: agentInfo.iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'oracle',
      });
      console.log(`🔍 Oracle地址: ${oracle}`);
      console.log(`🔍 Oracle是否为服务端钱包: ${oracle.toLowerCase() === serverAccount.address.toLowerCase()}`);

      if (!isAdmin && owner.toLowerCase() !== serverAccount.address.toLowerCase()) {
        console.log('⚠️ 服务端钱包既不是管理员也不是所有者，可能无法调用claimDepositedToken');
      }

      // 如果不是管理员但是所有者，尝试设置为管理员
      if (!isAdmin && owner.toLowerCase() === serverAccount.address.toLowerCase()) {
        console.log('🔧 尝试设置服务端钱包为管理员...');
        try {
          const setAdminHash = await walletClient.writeContract({
            address: agentInfo.iaoContractAddress as `0x${string}`,
            abi: contractABI,
            functionName: 'setAdmin',
            args: [serverAccount.address, true],
            account: serverAccount.address,
          });

          console.log(`✅ setAdmin交易已提交: ${setAdminHash}`);

          // 等待交易确认
          await publicClient.waitForTransactionReceipt({
            hash: setAdminHash,
            timeout: 30000,
          });

          console.log('✅ 服务端钱包已设置为管理员');
        } catch (setAdminError) {
          console.log('⚠️ 设置管理员失败:', (setAdminError as any)?.message || (setAdminError as any)?.shortMessage || 'Unknown error');
        }
      }

      if (!isSuccess) {
        console.log('⚠️ IAO尚未成功，可能无法提取代币');
      }

      if (totalDeposited === BigInt(0)) {
        console.log('⚠️ 没有用户投入代币，无需提取');
        return {
          success: false,
          error: '没有用户投入代币，无需提取'
        };
      }

      // 检查合约中是否有可提取的余额
      try {
        const tokenBalance = await publicClient.readContract({
          address: agentInfo.tokenAddress as `0x${string}`,
          abi: [
            {
              "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
              "name": "balanceOf",
              "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
              "stateMutability": "view",
              "type": "function"
            }
          ],
          functionName: 'balanceOf',
          args: [agentInfo.iaoContractAddress],
        });

        console.log(`🔍 IAO合约中的代币余额: ${tokenBalance}`);

        if (tokenBalance === BigInt(0)) {
          console.log('⚠️ IAO合约中没有代币余额，无需提取');
          return {
            success: false,
            error: 'IAO合约中没有代币余额，无需提取'
          };
        }
      } catch (balanceError) {
        console.log('⚠️ 检查代币余额失败:', balanceError);
      }

    } catch (error) {
      console.log('⚠️ 权限检查失败:', error);
    }

    // 直接调用claimDepositedToken
    console.log(`� 直接执行claimDepositedToken...`);
    const hash = await walletClient.writeContract({
      address: agentInfo.iaoContractAddress as `0x${string}`,
      abi: contractABI,
      functionName: 'claimDepositedToken',
    });

    console.log(`✅ claimDepositedToken交易已提交: ${hash}`);
    console.log('⏳ 等待交易确认...');

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 60000, // 60秒超时
    });

    if (receipt.status === 'success') {
      console.log(`✅ claimDepositedToken执行成功 - Gas Used: ${receipt.gasUsed}`);
      return {
        success: true,
        txHash: hash
      };
    } else {
      console.log(`❌ claimDepositedToken执行失败 - Receipt Status: ${receipt.status}`);
      return {
        success: false,
        error: 'Transaction failed'
      };
    }

  } catch (error: any) {
    console.error('❌ claimDepositedToken执行失败:', error?.message || error?.shortMessage || 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 带选项的代币分配函数（支持销毁和容错）
 */
export async function distributeTokensWithOptions(
  agentId: string,
  totalSupply: string,
  tokenAddress: string,
  userAddress: string,
  options: {
    includeBurn?: boolean;
    burnPercentage?: number;
    retryTaskId?: string; // 如果提供，则重试指定任务的失败步骤
  }
): Promise<DistributionResult> {
  console.log('🔍 [DEBUG] distributeTokensWithOptions 开始执行');
  console.log('🔍 [DEBUG] 参数:', {
    agentId,
    totalSupply,
    tokenAddress,
    userAddress,
    options
  });

  // 如果是重试模式
  if (options.retryTaskId) {
    console.log(`🔍 [DEBUG] 🔄 重试模式 - 任务ID: ${options.retryTaskId}`);
    return await retryFailedTransactions(options.retryTaskId);
  }

  // 在分发之前，先执行管理员提取IPO中的代币
  console.log('🔍 [DEBUG] 🏦 分发前预处理 - 提取IPO中的代币');
  const claimResult = await claimDepositedTokenFromIAO(agentId);

  if (claimResult.success) {
    console.log(`🔍 [DEBUG] ✅ IPO代币提取成功 - TxHash: ${claimResult.txHash}`);
  } else {
    console.log(`🔍 [DEBUG] ⚠️ IPO代币提取失败或跳过: ${claimResult.error}`);
    // 注意：这里不中断分发流程，因为可能IAO合约没有代币需要提取
  }

  // 正常分配模式（默认启用智能跳过）
  console.log('🔍 [DEBUG] 调用 distributeTokens...');
  const result = await distributeTokens(agentId, totalSupply, tokenAddress, userAddress, {
    includeBurn: options.includeBurn,
    burnPercentage: options.burnPercentage,
    skipSuccessful: true // 默认启用智能跳过已成功的步骤
  });
  console.log('🔍 [DEBUG] distributeTokens 返回结果:', result);
  return result;
}
