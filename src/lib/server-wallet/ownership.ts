/**
 * Owner转移功能
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { currentChain } from '@/config/chain';
import { getServerWalletClients } from './index';
import { getMiningContractAddress } from './config';
import type { TransactionResult } from './types';

/**
 * 转移代币合约的owner
 * @param tokenAddress 代币合约地址
 * @param newOwner 新的owner地址
 * @returns 交易结果
 */
export async function transferTokenOwnership(
  tokenAddress: `0x${string}`,
  newOwner: `0x${string}`
): Promise<TransactionResult> {
  try {
    console.log(`🔄 开始转移代币Owner - Token: ${tokenAddress}, 新Owner: ${newOwner}`);

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 验证新owner地址
    if (!newOwner || newOwner === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid new owner address');
    }

    // 检查当前owner是否为服务端钱包
    const currentOwner = await getCurrentTokenOwner(tokenAddress);
    if (currentOwner.toLowerCase() !== serverAccount.address.toLowerCase()) {
      throw new Error(`Current owner mismatch. Expected: ${serverAccount.address}, Actual: ${currentOwner}`);
    }

    // Ownable合约的transferOwnership方法ABI
    const ownableTransferABI = [
      {
        name: 'transferOwnership',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'newOwner', type: 'address' }],
        outputs: []
      }
    ] as const;

    console.log(`📝 执行代币Owner转移 - 从 ${serverAccount.address} 转移到 ${newOwner}`);

    // 执行owner转移
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ownableTransferABI,
      functionName: 'transferOwnership',
      args: [newOwner],
      account: serverAccount.address,
    });

    console.log(`📝 Owner转移交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      // 验证owner转移是否成功
      const verifyOwner = await getCurrentTokenOwner(tokenAddress);
      if (verifyOwner.toLowerCase() === newOwner.toLowerCase()) {
        console.log(`✅ 代币Owner转移成功 - 新Owner: ${newOwner}`);
        return {
          success: true,
          hash,
          message: `代币Owner已成功转移到 ${newOwner}`
        };
      } else {
        throw new Error(`Owner transfer verification failed. Expected: ${newOwner}, Actual: ${verifyOwner}`);
      }
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ 代币Owner转移失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '代币Owner转移失败'
    };
  }
}

/**
 * 转移挖矿合约的owner
 * @param newOwner 新的owner地址
 * @returns 交易结果
 */
export async function transferMiningOwnership(
  newOwner: `0x${string}`
): Promise<TransactionResult> {
  try {
    const miningContractAddress = getMiningContractAddress();
    console.log(`🔄 开始转移挖矿合约Owner - Contract: ${miningContractAddress}, 新Owner: ${newOwner}`);

    // 获取服务端钱包客户端
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();

    // 验证新owner地址
    if (!newOwner || newOwner === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid new owner address');
    }

    // 检查当前owner是否为服务端钱包
    const currentOwner = await getCurrentMiningOwner();
    if (currentOwner.toLowerCase() !== serverAccount.address.toLowerCase()) {
      throw new Error(`Current mining owner mismatch. Expected: ${serverAccount.address}, Actual: ${currentOwner}`);
    }

    // Ownable合约的transferOwnership方法ABI
    const ownableTransferABI = [
      {
        name: 'transferOwnership',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'newOwner', type: 'address' }],
        outputs: []
      }
    ] as const;

    console.log(`📝 执行挖矿合约Owner转移 - 从 ${serverAccount.address} 转移到 ${newOwner}`);

    // 执行owner转移
    const hash = await walletClient.writeContract({
      address: miningContractAddress,
      abi: ownableTransferABI,
      functionName: 'transferOwnership',
      args: [newOwner],
      account: serverAccount.address,
    });

    console.log(`📝 挖矿合约Owner转移交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      // 验证owner转移是否成功
      const verifyOwner = await getCurrentMiningOwner();
      if (verifyOwner.toLowerCase() === newOwner.toLowerCase()) {
        console.log(`✅ 挖矿合约Owner转移成功 - 新Owner: ${newOwner}`);
        return {
          success: true,
          hash,
          message: `挖矿合约Owner已成功转移到 ${newOwner}`
        };
      } else {
        throw new Error(`Mining owner transfer verification failed. Expected: ${newOwner}, Actual: ${verifyOwner}`);
      }
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error('❌ 挖矿合约Owner转移失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '挖矿合约Owner转移失败'
    };
  }
}

/**
 * 获取代币合约的当前owner
 * @param tokenAddress 代币合约地址
 * @returns 当前owner地址
 */
async function getCurrentTokenOwner(tokenAddress: `0x${string}`): Promise<string> {
  const { publicClient } = await getServerWalletClients();

  // Ownable合约的owner方法ABI
  const ownableOwnerABI = [
    {
      name: 'owner',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'address' }]
    }
  ] as const;

  const owner = await publicClient.readContract({
    address: tokenAddress,
    abi: ownableOwnerABI,
    functionName: 'owner',
  });

  return owner;
}

/**
 * 获取挖矿合约的当前owner
 * @returns 当前owner地址
 */
async function getCurrentMiningOwner(): Promise<string> {
  const { publicClient } = await getServerWalletClients();
  const miningContractAddress = getMiningContractAddress();

  // Ownable合约的owner方法ABI
  const ownableOwnerABI = [
    {
      name: 'owner',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'address' }]
    }
  ] as const;

  const owner = await publicClient.readContract({
    address: miningContractAddress,
    abi: ownableOwnerABI,
    functionName: 'owner',
  });

  return owner;
}

/**
 * 批量转移owner（代币和挖矿合约）
 * @param tokenAddress 代币合约地址
 * @param newOwner 新的owner地址
 * @returns 批量转移结果
 */
export async function batchTransferOwnership(
  tokenAddress: `0x${string}`,
  newOwner: `0x${string}`
): Promise<{ tokenResult: TransactionResult; miningResult: TransactionResult }> {
  console.log(`🔄 开始批量Owner转移 - Token: ${tokenAddress}, Mining Contract, 新Owner: ${newOwner}`);

  // 并行执行两个转移操作
  const [tokenResult, miningResult] = await Promise.all([
    transferTokenOwnership(tokenAddress, newOwner),
    transferMiningOwnership(newOwner)
  ]);

  return {
    tokenResult,
    miningResult
  };
}

/**
 * 检查owner转移状态
 * @param tokenAddress 代币合约地址
 * @param expectedOwner 期望的owner地址
 * @returns 转移状态检查结果
 */
export async function checkOwnershipStatus(
  tokenAddress: `0x${string}`,
  expectedOwner: `0x${string}`
) {
  try {
    const [tokenOwner, miningOwner] = await Promise.all([
      getCurrentTokenOwner(tokenAddress),
      getCurrentMiningOwner()
    ]);

    return {
      tokenOwnerTransferred: tokenOwner.toLowerCase() === expectedOwner.toLowerCase(),
      miningOwnerTransferred: miningOwner.toLowerCase() === expectedOwner.toLowerCase(),
      currentTokenOwner: tokenOwner,
      currentMiningOwner: miningOwner
    };

  } catch (error) {
    console.error('❌ 检查Owner状态失败:', error);
    throw error;
  }
}
