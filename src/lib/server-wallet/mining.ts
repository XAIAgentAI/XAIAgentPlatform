/**
 * 挖矿合约管理功能
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { currentChain } from '@/config/networks';
import { getServerWalletClients } from './index';
import { getMiningContractAddress } from './config';
import type { TransactionResult } from './types';

// 挖矿合约部署参数类型
export interface MiningDeploymentParams {
  nft: `0x${string}`;
  owner: `0x${string}`;
  project_name: string;
  reward_amount_per_year: string;
  reward_token: `0x${string}`;
}

// 挖矿合约注册参数类型
export interface MiningRegistrationParams {
  projectName: string;
  stakingType: number;
  contractAddress: `0x${string}`;
}

/**
 * 部署挖矿合约
 * @param params 部署参数
 * @returns 部署结果
 */
export async function deployMiningContract(params: MiningDeploymentParams): Promise<{
  success: boolean;
  data?: { proxy_address: string };
  error?: string;
}> {
  try {
    console.log('🔄 开始部署挖矿合约:', params);

    const response = await fetch('http://54.179.233.88:8070/deploy/staking', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': 'Basic YWRtaW46MTIz',
        'content-type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('📥 部署API原始响应:', responseText);
    
    const result = JSON.parse(responseText);
    
    if (result.code === 200) {
      console.log('✅ 挖矿合约部署成功:', result.data.proxy_address);
      return {
        success: true,
        data: result.data
      };
    } else {
      console.error('❌ 部署API返回错误:', result);
      throw new Error(result.message || 'Deployment failed');
    }

  } catch (error) {
    console.error('❌ 挖矿合约部署失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 注册挖矿合约到主合约
 * @param params 注册参数
 * @returns 交易结果
 */
export async function registerMiningContract(params: MiningRegistrationParams): Promise<TransactionResult> {
  try {
    console.log('🔄 注册挖矿合约:', params);

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 注册合约地址（从用户提供的信息获取）
    const registryContractAddress = '0xa7B9f404653841227AF204a561455113F36d8EC8' as const;

    // 动态导入mining.json ABI
    const miningABI = await import('@/config/abis/mining.json');

    console.log('📝 执行合约注册');

    // 调用 registerProjectStakingContract 函数
    const hash = await walletClient.writeContract({
      address: registryContractAddress,
      abi: miningABI.default,
      functionName: 'registerProjectStakingContract',
      args: [
        params.projectName,        // 项目名称
        params.stakingType,        // 质押类型 (2)
        params.contractAddress,    // 部署的合约地址
        params.contractAddress     // 相同的合约地址
      ],
    });

    console.log(`📝 注册交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log('✅ 挖矿合约注册成功');
      return {
        type: 'mining',
        amount: '0',
        txHash: hash,
        status: 'confirmed',
        toAddress: params.contractAddress
      };
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ 挖矿合约注册失败:', error);
    return {
      type: 'mining',
      amount: '0',
      txHash: '',
      status: 'failed',
      toAddress: params.contractAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 向挖矿合约分配代币
 * @param tokenAddress 代币地址
 * @param amount 分配数量（40%的总供应量）
 * @returns 交易结果
 */
export async function allocateTokensToMining(
  tokenAddress: `0x${string}`,
  amount: string
): Promise<TransactionResult> {
  try {
    const miningContractAddress = getMiningContractAddress();
    console.log(`🔄 开始向挖矿合约分配代币 - Token: ${tokenAddress}, 数量: ${amount}`);

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 验证参数
    const amountWei = parseEther(amount);
    if (amountWei <= BigInt(0)) {
      throw new Error('Invalid allocation amount');
    }

    // ERC20 transfer方法的ABI
    const erc20TransferABI = [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
      }
    ] as const;

    console.log(`💰 执行代币分配 - 转移 ${formatEther(amountWei)} 代币到挖矿合约`);

    // 执行代币转移到挖矿合约
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20TransferABI,
      functionName: 'transfer',
      args: [miningContractAddress, amountWei],
      account: serverAccount.address,
    });

    console.log(`📝 分配交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ 代币分配成功 - 已分配 ${formatEther(amountWei)} 代币到挖矿合约`);
      return {
        type: 'mining',
        amount: formatEther(amountWei),
        txHash: hash,
        status: 'confirmed',
        toAddress: miningContractAddress
      };
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ 代币分配失败:', error);
    return {
      type: 'mining',
      amount: '0',
      txHash: '',
      status: 'failed',
      toAddress: getMiningContractAddress(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 检查挖矿合约的代币余额
 * @param tokenAddress 代币地址
 * @returns 挖矿合约的代币余额
 */
export async function checkMiningContractBalance(tokenAddress: `0x${string}`) {
  try {
    const miningContractAddress = getMiningContractAddress();
    const { publicClient } = await getServerWalletClients();

    // ERC20 balanceOf方法的ABI
    const erc20BalanceABI = [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const;

    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20BalanceABI,
      functionName: 'balanceOf',
      args: [miningContractAddress],
    });

    return {
      balance: balance.toString(),
      formatted: formatEther(balance),
      contractAddress: miningContractAddress
    };

  } catch (error) {
    console.error('❌ 检查挖矿合约余额失败:', error);
    throw error;
  }
}

/**
 * 设置挖矿合约的奖励代币
 * @param rewardTokenAddress 奖励代币地址
 * @returns 交易结果
 */
export async function setMiningRewardToken(
  rewardTokenAddress: `0x${string}`
): Promise<TransactionResult> {
  try {
    const miningContractAddress = getMiningContractAddress();
    console.log(`🔄 设置挖矿奖励代币 - Contract: ${miningContractAddress}, Token: ${rewardTokenAddress}`);

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 挖矿合约的setRewardToken方法ABI（假设存在此方法）
    const setRewardTokenABI = [
      {
        name: 'setRewardToken',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'token', type: 'address' }],
        outputs: []
      }
    ] as const;

    console.log(`📝 执行设置奖励代币 - Token: ${rewardTokenAddress}`);

    // 执行设置奖励代币
    const hash = await walletClient.writeContract({
      address: miningContractAddress,
      abi: setRewardTokenABI,
      functionName: 'setRewardToken',
      args: [rewardTokenAddress],
      account: serverAccount.address,
    });

    console.log(`📝 设置奖励代币交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ 奖励代币设置成功 - Token: ${rewardTokenAddress}`);
      return {
        type: 'mining',
        amount: '0',
        txHash: hash,
        status: 'confirmed',
        toAddress: rewardTokenAddress
      };
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ 设置奖励代币失败:', error);
    return {
      type: 'mining',
      amount: '0',
      txHash: '',
      status: 'failed',
      toAddress: rewardTokenAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 获取挖矿合约信息
 * @returns 挖矿合约信息
 */
export async function getMiningContractInfo() {
  try {
    const miningContractAddress = getMiningContractAddress();
    const { publicClient } = await getServerWalletClients();

    // 挖矿合约的基本信息查询ABI
    const miningInfoABI = [
      {
        name: 'owner',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }]
      },
      {
        name: 'totalReward',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const;

    // 并行查询合约信息
    const [owner, totalReward] = await Promise.all([
      publicClient.readContract({
        address: miningContractAddress,
        abi: miningInfoABI,
        functionName: 'owner',
      }).catch(() => '0x0000000000000000000000000000000000000000'),
      publicClient.readContract({
        address: miningContractAddress,
        abi: miningInfoABI,
        functionName: 'totalReward',
      }).catch(() => BigInt(0))
    ]);

    return {
      contractAddress: miningContractAddress,
      owner,
      totalReward: totalReward.toString(),
      totalRewardFormatted: formatEther(totalReward)
    };

  } catch (error) {
    console.error('❌ 获取挖矿合约信息失败:', error);
    throw error;
  }
}

/**
 * 计算挖矿分配数量（40%）
 * @param totalSupply 总供应量
 * @returns 挖矿分配数量
 */
export function calculateMiningAllocation(totalSupply: string): string {
  const total = parseEther(totalSupply);
  const miningAmount = total * BigInt(40) / BigInt(100); // 40%
  return formatEther(miningAmount);
}

/**
 * 启动挖矿（如果合约支持）
 * @returns 交易结果
 */
export async function startMining(): Promise<TransactionResult> {
  try {
    const miningContractAddress = getMiningContractAddress();
    console.log(`🔄 启动挖矿 - Contract: ${miningContractAddress}`);

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 挖矿合约的start方法ABI（假设存在此方法）
    const startMiningABI = [
      {
        name: 'start',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: []
      }
    ] as const;

    console.log(`📝 执行启动挖矿`);

    // 执行启动挖矿
    const hash = await walletClient.writeContract({
      address: miningContractAddress,
      abi: startMiningABI,
      functionName: 'start',
      account: serverAccount.address,
    });

    console.log(`📝 启动挖矿交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ 挖矿启动成功`);
      return {
        type: 'mining',
        amount: '0',
        txHash: hash,
        status: 'confirmed',
        toAddress: getMiningContractAddress()
      };
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ 启动挖矿失败:', error);
    return {
      type: 'mining',
      amount: '0',
      txHash: '',
      status: 'failed',
      toAddress: getMiningContractAddress(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
