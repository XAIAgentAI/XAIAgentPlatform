/**
 * 代币销毁功能
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { currentChain } from '@/config/networks';
import { getServerWalletClients } from './index';
import type { TransactionResult } from './types';

// ERC20 Transfer事件的ABI（用于销毁到黑洞地址）
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD' as const;

/**
 * 销毁代币（优先使用合约burn方法，否则转移到黑洞地址）
 * @param tokenAddress 代币地址
 * @param burnAmount 销毁数量
 * @returns 交易结果
 */
export async function burnTokens(
  tokenAddress: `0x${string}`,
  burnAmount: string
): Promise<TransactionResult> {
  try {
    console.log(`🔥 开始销毁代币 - Token: ${tokenAddress}, 数量: ${burnAmount}`);

    // 验证参数
    const burnAmountWei = parseEther(burnAmount);
    if (burnAmountWei <= BigInt(0)) {
      throw new Error('Invalid burn amount');
    }

    // 检查服务端钱包的代币余额
    const balance = await checkTokenBalance(tokenAddress);
    if (BigInt(balance.balance) < burnAmountWei) {
      throw new Error(`Insufficient token balance. Required: ${burnAmount}, Available: ${balance.formatted}`);
    }

    // 只尝试使用合约的burn方法，如果失败则直接报错
    const burnResult = await tryContractBurn(tokenAddress, burnAmountWei);
    if (burnResult) {
      return burnResult;
    }

    // 如果合约没有burn方法，直接报错
    throw new Error('合约没有burn方法，无法执行销毁操作');

  } catch (error) {
    console.error('❌ 代币销毁失败:', error);
    return {
      type: 'creator',
      amount: burnAmount,
      txHash: '',
      status: 'failed',
      toAddress: BURN_ADDRESS,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 尝试使用合约的burn方法销毁代币
 */
async function tryContractBurn(
  tokenAddress: `0x${string}`,
  burnAmountWei: bigint
): Promise<TransactionResult | null> {
  try {
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 首先尝试 burn(amount) 方法
    const burnResult = await tryBurnMethod(tokenAddress, burnAmountWei, walletClient, publicClient, serverAccount);
    if (burnResult) {
      return burnResult;
    }

    // 如果 burn 方法失败，尝试 burnFrom(from, amount) 方法
    const burnFromResult = await tryBurnFromMethod(tokenAddress, burnAmountWei, walletClient, publicClient, serverAccount);
    if (burnFromResult) {
      return burnFromResult;
    }

    return null; // 所有合约方法都失败

  } catch (error) {
    console.log(`⚠️ 合约burn方法调用失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null; // 返回null表示需要使用备用方法
  }
}

/**
 * 尝试使用 burn(amount) 方法
 */
async function tryBurnMethod(
  tokenAddress: `0x${string}`,
  burnAmountWei: bigint,
  walletClient: any,
  publicClient: any,
  serverAccount: any
): Promise<TransactionResult | null> {
  try {
    // ERC20 burn方法的ABI
    const erc20BurnABI = [
      {
        name: 'burn',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'amount', type: 'uint256' }
        ],
        outputs: []
      }
    ] as const;

    console.log(`🔥 尝试使用burn(amount)方法 - 销毁 ${formatEther(burnAmountWei)} 代币`);

    // 执行合约burn方法
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20BurnABI,
      functionName: 'burn',
      args: [burnAmountWei],
      account: serverAccount.address,
    });

    console.log(`📝 burn(amount)交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ burn(amount)成功 - 已销毁 ${formatEther(burnAmountWei)} 代币`);
      return {
        type: 'creator',
        amount: formatEther(burnAmountWei),
        txHash: hash,
        status: 'confirmed',
        toAddress: '0x0000000000000000000000000000000000000000' // burn方法直接销毁，没有接收地址
      };
    } else {
      throw new Error('burn(amount) transaction failed');
    }

  } catch (error) {
    console.log(`⚠️ burn(amount)方法失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * 尝试使用 burnFrom(from, amount) 方法
 */
async function tryBurnFromMethod(
  tokenAddress: `0x${string}`,
  burnAmountWei: bigint,
  walletClient: any,
  publicClient: any,
  serverAccount: any
): Promise<TransactionResult | null> {
  try {
    // ERC20 burnFrom方法的ABI
    const erc20BurnFromABI = [
      {
        name: 'burnFrom',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'from', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: []
      }
    ] as const;

    console.log(`🔥 尝试使用burnFrom(from, amount)方法 - 销毁 ${formatEther(burnAmountWei)} 代币`);

    // 执行合约burnFrom方法
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20BurnFromABI,
      functionName: 'burnFrom',
      args: [serverAccount.address, burnAmountWei],
      account: serverAccount.address,
    });

    console.log(`📝 burnFrom(from, amount)交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ burnFrom(from, amount)成功 - 已销毁 ${formatEther(burnAmountWei)} 代币`);
      return {
        type: 'creator',
        amount: formatEther(burnAmountWei),
        txHash: hash,
        status: 'confirmed',
        toAddress: '0x0000000000000000000000000000000000000000' // burnFrom方法直接销毁，没有接收地址
      };
    } else {
      throw new Error('burnFrom(from, amount) transaction failed');
    }

  } catch (error) {
    console.log(`⚠️ burnFrom(from, amount)方法失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}



/**
 * 检查代币余额
 * @param tokenAddress 代币地址
 * @returns 余额信息
 */
async function checkTokenBalance(tokenAddress: `0x${string}`) {
  const { publicClient, serverAccount } = await getServerWalletClients();

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
    args: [serverAccount.address],
  });

  return {
    balance: balance.toString(),
    formatted: formatEther(balance)
  };
}

/**
 * 计算需要销毁的代币数量
 * @param totalAmount 总代币数量
 * @param percentage 销毁百分比，默认5%
 * @returns 需要销毁的数量
 */
export function calculateBurnAmount(totalAmount: string, percentage: number = 5): string {
  const total = parseEther(totalAmount);
  const burnAmount = total * BigInt(Math.floor(percentage * 100)) / BigInt(10000); // 支持小数百分比
  return formatEther(burnAmount);
}

/**
 * 检查代币销毁情况（支持多种验证方式）
 * @param tokenAddress 代币地址
 * @returns 销毁验证结果
 */
export async function checkBurnedTokens(tokenAddress: `0x${string}`) {
  try {
    const { publicClient } = await getServerWalletClients();

    // ERC20 相关方法的ABI
    const erc20ABI = [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
      },
      {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }]
      }
    ] as const;

    // 检查黑洞地址余额（转移销毁方式）
    const burnedBalance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20ABI,
      functionName: 'balanceOf',
      args: [BURN_ADDRESS],
    });

    // 检查总供应量（合约burn方法会减少总供应量）
    let totalSupply: bigint;
    try {
      totalSupply = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'totalSupply',
        args: [],
      });
    } catch (error) {
      console.warn('⚠️ 无法获取totalSupply，可能合约不支持此方法');
      totalSupply = BigInt(0);
    }

    return {
      // 黑洞地址余额（转移销毁）
      burnedByTransfer: {
        amount: burnedBalance.toString(),
        formatted: formatEther(burnedBalance)
      },
      // 总供应量信息
      totalSupply: {
        amount: totalSupply.toString(),
        formatted: formatEther(totalSupply)
      },
      // 总销毁量（黑洞地址余额，实际销毁需要通过事件或其他方式计算）
      totalBurned: {
        amount: burnedBalance.toString(),
        formatted: formatEther(burnedBalance)
      }
    };

  } catch (error) {
    console.error('❌ 检查销毁代币失败:', error);
    throw error;
  }
}

/**
 * 批量销毁多种代币
 * @param burnOperations 销毁操作数组
 * @returns 批量销毁结果
 */
export async function batchBurnTokens(
  burnOperations: Array<{ tokenAddress: `0x${string}`; amount: string }>
): Promise<TransactionResult[]> {
  const results: TransactionResult[] = [];

  for (const operation of burnOperations) {
    const result = await burnTokens(operation.tokenAddress, operation.amount);
    results.push(result);

    // 如果某个销毁失败，记录但继续执行其他销毁操作
    if (result.status === 'failed') {
      console.warn(`⚠️ 代币销毁失败: ${operation.tokenAddress} - ${result.error}`);
    }
  }

  return results;
}
