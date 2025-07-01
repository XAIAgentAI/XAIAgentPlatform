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
      console.log(`✅ 流动性添加成功 - 池子: ${result.poolAddress}, 交易: ${result.txHash}`);
      return {
        success: true,
        txHash: result.txHash,
        poolAddress: result.poolAddress
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
 * 创建分配任务记录（使用现有的history表）
 */
async function createDistributionTask(agentId: string, totalSupply: string, tokenAddress: string, userAddress: string) {
  return await prisma.history.create({
    data: {
      action: 'token_distribution_start',
      result: 'pending',
      agentId,
      error: JSON.stringify({
        totalSupply,
        tokenAddress,
        createdBy: userAddress,
        status: 'PENDING',
      }),
    },
  });
}

/**
 * 更新分配任务状态（使用现有的history表）
 */
async function updateDistributionTask(taskId: string, status: string, transactions: TransactionResult[]) {
  await prisma.history.update({
    where: { id: taskId },
    data: {
      result: status.toLowerCase(),
      error: JSON.stringify({
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
      }),
    },
  });
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
 * 查找已有的分配任务（多层智能匹配策略）
 */
async function findExistingDistributionTask(agentId: string, tokenAddress: string) {
  console.log(`🔍 查找已有分配任务 - agentId: ${agentId}, tokenAddress: ${tokenAddress}`);

  // 查询所有相关的任务记录
  const allTasks = await prisma.history.findMany({
    where: {
      agentId,
      action: 'token_distribution_start'
    },
    orderBy: { timestamp: 'desc' }, // 按时间倒序，最新的在前面
  });

  console.log(`📋 找到 ${allTasks.length} 条相关任务记录，开始多层智能匹配...`);

  // 获取 agent 信息用于验证
  let agentInfo = null;
  try {
    agentInfo = await getAgentInfo(agentId);
    console.log(`📋 Agent 信息获取成功: creator=${agentInfo.creator.address}`);
  } catch (error) {
    console.log(`⚠️  获取 Agent 信息失败: ${error}`);
  }

  // 遍历所有任务，使用多层匹配策略
  for (let i = 0; i < allTasks.length; i++) {
    const task = allTasks[i];
    console.log(`  检查任务 ${i + 1}/${allTasks.length}: ID=${task.id}, Result=${task.result}, Timestamp=${task.timestamp}`);

    // 解析任务数据
    let taskData = null;
    if (task.error) {
      try {
        taskData = JSON.parse(task.error);
        console.log(`     ✅ 成功解析任务数据`);
      } catch (e) {
        console.log(`     ❌ 解析任务数据失败: ${e}`);
        continue;
      }
    } else {
      console.log(`     ⚠️  任务数据为空，跳过`);
      continue;
    }

    // 第一层：直接 tokenAddress 匹配（新数据格式）
    if (taskData.tokenAddress) {
      console.log(`     🎯 第一层匹配：直接 tokenAddress 比较`);
      console.log(`       - 任务中的 tokenAddress: ${taskData.tokenAddress}`);
      console.log(`       - 查找的 tokenAddress: ${tokenAddress}`);

      if (taskData.tokenAddress === tokenAddress) {
        console.log(`     ✅ 第一层匹配成功 - 直接 tokenAddress 匹配`);
        return task;
      } else {
        console.log(`     ❌ 第一层匹配失败 - tokenAddress 不匹配`);
        continue;
      }
    }

    // 第二层：通过交易记录推断匹配（历史数据兼容）
    console.log(`     🎯 第二层匹配：通过交易记录推断`);
    if (taskData.transactions && agentInfo) {
      const isVerified = await verifyTaskByTransactions(taskData, agentInfo, tokenAddress);
      if (isVerified) {
        console.log(`     ✅ 第二层匹配成功 - 交易记录验证通过`);
        console.log(`🔍 匹配任务详情:`);
        console.log(`  - 任务ID: ${task.id}`);
        console.log(`  - 任务状态: ${taskData.status}`);
        console.log(`  - 创建时间: ${task.timestamp}`);
        console.log(`  - 交易数量: ${taskData.transactions?.length || 0}`);
        console.log(`  - 匹配方式: 交易记录验证`);

        // 显示交易详情
        if (taskData.transactions && taskData.transactions.length > 0) {
          console.log(`  - 交易详情:`);
          taskData.transactions.forEach((tx: any, txIndex: number) => {
            console.log(`    ${txIndex + 1}. ${tx.type}: ${tx.status} (${tx.amount}) -> ${tx.toAddress}`);
          });
        }

        return task;
      } else {
        console.log(`     ❌ 第二层匹配失败 - 交易记录验证不通过`);
      }
    } else {
      console.log(`     ⚠️  第二层匹配跳过 - 缺少交易记录或 agent 信息`);
    }
  }

  console.log(`❌ 所有匹配层级都失败，未找到匹配的分配任务`);
  return null;
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
    console.log(`📤 开始 ${type} 转账: ${amount} tokens -> ${toAddress}`);

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

    console.log(`📤 ${type} 转账已发送: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const status = receipt.status === 'success' ? 'confirmed' : 'failed';
    console.log(`${status === 'confirmed' ? '✅' : '❌'} ${type} 转账${status}: ${hash}`);

    return {
      type,
      amount,
      txHash: hash,
      status,
      toAddress,
    };
  } catch (error) {
    console.error(`❌ ${type} 转账失败:`, error);
    return {
      type,
      amount,
      txHash: '',
      status: 'failed',
      toAddress,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
    console.log(`🚀 开始代币分配 - Agent: ${agentId}, 总供应量: ${totalSupply}`);
    if (includeBurn) {
      console.log(`🔥 包含销毁步骤 - 销毁比例: ${burnPercentage}%`);
    }
    if (skipSuccessful) {
      console.log(`⏭️ 启用容错模式 - 跳过已成功的步骤`);
    }

    // 获取 Agent 信息
    const agentInfo = await getAgentInfo(agentId);

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

    // 检查是否有未完成的分配任务
    let existingTask = null;
    let completedSteps: string[] = [];

    console.log(`🔍 开始查找已有任务 - skipSuccessful: ${skipSuccessful}`);

    if (skipSuccessful) {
      existingTask = await findExistingDistributionTask(agentId, tokenAddress);
      if (existingTask) {
        console.log(`📋 发现已有分配任务: ${existingTask.id}`);
        console.log(`📋 任务详情:`);
        console.log(`  - ID: ${existingTask.id}`);
        console.log(`  - Result: ${existingTask.result}`);
        console.log(`  - Timestamp: ${existingTask.timestamp}`);

        const taskData = JSON.parse(existingTask.error || '{}');
        const transactions = taskData.transactions || [];

        console.log(`📋 任务数据解析:`);
        console.log(`  - 状态: ${taskData.status}`);
        console.log(`  - 交易总数: ${transactions.length}`);

        // 详细显示每个交易的状态
        transactions.forEach((tx: any, index: number) => {
          console.log(`  - 交易 ${index + 1}: ${tx.type} - ${tx.status} (${tx.amount})`);
        });

        // 获取已成功的步骤
        completedSteps = transactions
          .filter((tx: any) => tx.status === 'confirmed')
          .map((tx: any) => tx.type);

        console.log(`✅ 已完成步骤: ${completedSteps.join(', ') || '无'}`);
        console.log(`🔄 将跳过已成功的步骤，继续执行剩余步骤`);
        task = existingTask;
      } else {
        console.log(`❌ 未找到已有分配任务，将创建新任务`);
      }
    } else {
      console.log(`⏭️ 跳过已有任务检查 (skipSuccessful=false)`);
    }

    // 如果没有已有任务，创建新的分配任务记录
    if (!existingTask) {
      console.log(`📝 创建新的分配任务记录...`);
      task = await createDistributionTask(agentId, totalSupply, tokenAddress, userAddress);
      console.log(`📝 分配任务创建成功: ${task.id}`);
    }

    // 计算分配数量
    const distributions = calculateDistributions(totalSupply);

    // 智能余额检查：只检查未完成步骤所需的余额
    await checkRequiredBalance(tokenAddress, distributions, completedSteps, includeBurn, burnPercentage, totalSupply);

    // 执行分配
    console.log(`🚀 开始执行代币分配交易...`);

    // 如果是继续已有任务，先加载已有的交易记录
    let transactions: TransactionResult[] = [];
    if (existingTask && existingTask.error) {
      try {
        const taskData = JSON.parse(existingTask.error);
        transactions = taskData.transactions || [];
        console.log(`📋 加载已有交易记录: ${transactions.length} 笔`);
      } catch (error) {
        console.warn('解析已有交易记录失败:', error);
      }
    }

    // 1. 分配给创建者 (33%)
    if (!completedSteps.includes('creator')) {
      console.log(`👤 [1/3] 分配给创建者 (${DISTRIBUTION_RATIOS.CREATOR * 100}%): ${distributions.creator} -> ${agentInfo.creator.address}`);
      const creatorTx = await executeTransfer(
        tokenAddress,
        agentInfo.creator.address,
        distributions.creator,
        'creator'
      );
      transactions.push(creatorTx);
      console.log(`👤 创建者分配结果: ${creatorTx.status === 'confirmed' ? '✅ 成功' : creatorTx.status === 'failed' ? '❌ 失败' : '⏳ 待确认'} - Hash: ${creatorTx.txHash || 'N/A'}`);
    } else {
      console.log(`👤 [1/3] 跳过创建者分配 - 已完成 ✅`);
    }

    // 2. IAO合约分配 (15%) - 已由恒源自动完成，无需手动分配
    console.log(`🏦 跳过IAO合约分配 (${DISTRIBUTION_RATIOS.IAO * 100}%) - 恒源已自动完成此分配`);
    if (agentInfo.iaoContractAddress) {
      console.log(`🏦 IAO合约地址: ${agentInfo.iaoContractAddress} (已自动分配)`);
    }

    // 3. 分配给空投钱包 (2%)
    if (!completedSteps.includes('airdrop')) {
      console.log(`🎁 [2/${includeBurn ? '5' : '4'}] 分配给空投钱包 (${DISTRIBUTION_RATIOS.AIRDROP * 100}%): ${distributions.airdrop} -> ${DISTRIBUTION_ADDRESSES.AIRDROP}`);
      const airdropTx = await executeTransfer(
        tokenAddress,
        DISTRIBUTION_ADDRESSES.AIRDROP,
        distributions.airdrop,
        'airdrop'
      );
      transactions.push(airdropTx);
      console.log(`🎁 空投钱包分配结果: ${airdropTx.status === 'confirmed' ? '✅ 成功' : airdropTx.status === 'failed' ? '❌ 失败' : '⏳ 待确认'} - Hash: ${airdropTx.txHash || 'N/A'}`);
    } else {
      console.log(`🎁 [2/${includeBurn ? '5' : '4'}] 跳过空投钱包分配 - 已完成 ✅`);
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
          toAddress: liquidityResult.poolAddress || 'DBCSwap Pool',
          error: liquidityResult.error
        };

        transactions.push(liquidityTx);
        console.log(`💧 流动性添加结果: ${liquidityTx.status === 'confirmed' ? '✅ 成功' : '❌ 失败'} - Hash: ${liquidityTx.txHash || 'N/A'}`);

        if (liquidityResult.success && liquidityResult.poolAddress) {
          console.log(`🏊 池子地址: ${liquidityResult.poolAddress}`);
        }

      } catch (error) {
        console.error('❌ 流动性添加失败:', error);
        const liquidityTx: TransactionResult = {
          type: 'liquidity',
          amount: distributions.liquidity,
          txHash: 'N/A',
          status: 'failed',
          toAddress: 'DBCSwap Pool',
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
    const failedTxs = transactions.filter(tx => tx.status === 'failed');
    const confirmedTxs = transactions.filter(tx => tx.status === 'confirmed');
    const pendingTxs = transactions.filter(tx => tx.status === 'pending');
    const status = failedTxs.length === 0 ? 'COMPLETED' : 'PARTIAL_FAILED';

    console.log(`📊 分配结果汇总:`);
    console.log(`  - 总交易数: ${transactions.length}`);
    console.log(`  - 成功交易: ${confirmedTxs.length} ✅`);
    console.log(`  - 待确认交易: ${pendingTxs.length} ⏳`);
    console.log(`  - 失败交易: ${failedTxs.length} ❌`);

    if (failedTxs.length > 0) {
      console.log(`❌ 失败交易详情:`);
      failedTxs.forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx.type} - ${tx.amount} -> ${tx.toAddress}`);
        console.log(`     错误: ${tx.error || '未知错误'}`);
      });
    }

    // 更新数据库状态
    console.log(`💾 更新数据库任务状态: ${status}`);
    await updateDistributionTask(task.id, status, transactions);

    console.log(`${status === 'COMPLETED' ? '✅' : '⚠️'} 代币分配${status === 'COMPLETED' ? '完成' : '部分失败'} - 共执行 ${transactions.length} 笔交易，${failedTxs.length} 笔失败`);

    return {
      success: status === 'COMPLETED',
      taskId: task.id,
      data: {
        transactions,
        totalDistributed: totalSupply,
      },
      error: failedTxs.length > 0 ? `${failedTxs.length} transactions failed` : undefined,
    };
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
 * 重试失败的交易（智能跳过已成功的步骤）
 */
export async function retryFailedTransactions(taskId: string): Promise<DistributionResult> {
  try {
    // 获取任务信息
    const task = await prisma.history.findUnique({
      where: { id: taskId },
    });

    if (!task || !task.error) {
      throw new Error('Task not found');
    }

    const taskData = JSON.parse(task.error);
    const transactions = taskData.transactions || [];

    // 获取失败的交易
    const failedTransactions = transactions.filter((tx: any) => tx.status === 'failed');

    if (failedTransactions.length === 0) {
      return {
        success: true,
        taskId,
        data: {
          transactions,
          totalDistributed: taskData.totalSupply,
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
        const burnResult = await burnTokens(taskData.tokenAddress as `0x${string}`, failedTx.amount);
        result = {
          type: failedTx.type,
          amount: failedTx.amount,
          txHash: burnResult.txHash,
          status: burnResult.status,
          toAddress: burnResult.toAddress,
          error: burnResult.error
        };
      } else {
        // 普通转账交易重试
        result = await executeTransfer(
          taskData.tokenAddress,
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

    return {
      success: newStatus === 'COMPLETED',
      taskId,
      data: {
        transactions: allTransactions,
        totalDistributed: taskData.totalSupply,
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
          console.log('⚠️ 设置管理员失败:', setAdminError);
        }
      }

      if (!isSuccess) {
        console.log('⚠️ IAO尚未成功，可能无法提取代币');
      }

      if (totalDeposited === 0n) {
        console.log('⚠️ 没有用户投入代币，无需提取');
        return {
          success: false,
          error: '没有用户投入代币，无需提取'
        };
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
    console.error('❌ claimDepositedToken执行失败:', error);
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
  // 如果是重试模式
  if (options.retryTaskId) {
    console.log(`🔄 重试模式 - 任务ID: ${options.retryTaskId}`);
    return await retryFailedTransactions(options.retryTaskId);
  }

  // 在分发之前，先执行管理员提取IPO中的代币
  console.log(`🏦 分发前预处理 - 提取IPO中的代币`);
  const claimResult = await claimDepositedTokenFromIAO(agentId);

  if (claimResult.success) {
    console.log(`✅ IPO代币提取成功 - TxHash: ${claimResult.txHash}`);
  } else {
    console.log(`⚠️ IPO代币提取失败或跳过: ${claimResult.error}`);
    // 注意：这里不中断分发流程，因为可能IAO合约没有代币需要提取
  }

  // 正常分配模式（默认启用智能跳过）
  return await distributeTokens(agentId, totalSupply, tokenAddress, userAddress, {
    includeBurn: options.includeBurn,
    burnPercentage: options.burnPercentage,
    skipSuccessful: true // 默认启用智能跳过已成功的步骤
  });
}
