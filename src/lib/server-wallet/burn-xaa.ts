/**
 * 服务端钱包XAA销毁功能
 * 销毁IAO中XAA数量的5%
 */

import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { currentChain } from '@/config/wagmi';
import { getServerWalletPrivateKey } from './config';
import { CONTRACTS, getContractABI } from '@/config/contracts';
import XAA_ABI from '@/config/xaa-abi.json';

// XAA销毁结果类型
export interface XAABurnResult {
  success: boolean;
  txHash?: string;
  burnAmount?: string;
  iaoXAAAmount?: string;
  error?: string;
}

/**
 * 获取服务端钱包客户端
 */
async function getServerWalletClients() {
  const privateKey = getServerWalletPrivateKey();
  const serverAccount = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    chain: currentChain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    chain: currentChain,
    transport: http(),
    account: serverAccount,
  });

  return { walletClient, publicClient, serverAccount };
}

/**
 * 获取IAO合约中的XAA总量
 */
async function getIAOXAAAmount(iaoContractAddress: `0x${string}`): Promise<string> {
  try {
    const { publicClient } = await getServerWalletClients();
    
    // 获取合约ABI
    const contractABI = getContractABI('UserAgent');

    console.log(`🔍 查询IAO合约 ${iaoContractAddress} 中的XAA总量...`);

    // 查询总投入金额 (totalDepositedTokenIn)
    const totalDeposited = await publicClient.readContract({
      address: iaoContractAddress,
      abi: contractABI,
      functionName: 'totalDepositedTokenIn',
    });

    // 将BigInt转换为字符串，并从wei转换为ether
    const totalDepositedStr = totalDeposited.toString();
    const totalDepositedEther = parseFloat(totalDepositedStr) / Math.pow(10, 18);

    console.log(`✅ 查询到IAO中XAA总量: ${totalDepositedEther} XAA (${totalDepositedStr} wei)`);

    return totalDepositedEther.toString();

  } catch (error) {
    console.error('❌ 查询IAO合约XAA总量失败:', error);
    throw new Error(`查询IAO合约XAA总量失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 检查服务端钱包XAA余额
 */
async function checkServerWalletXAABalance(): Promise<string> {
  try {
    const { publicClient, serverAccount } = await getServerWalletClients();

    // ERC20 balanceOf ABI
    const ERC20_ABI = [
      {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      }
    ] as const;

    console.log(`🔍 检查服务端钱包 ${serverAccount.address} 的XAA余额...`);

    const balance = await publicClient.readContract({
      address: CONTRACTS.XAA_TOKEN as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [serverAccount.address]
    });

    const balanceEther = formatEther(balance);
    console.log(`💰 服务端钱包XAA余额: ${balanceEther} XAA`);

    return balanceEther;

  } catch (error) {
    console.error('❌ 检查服务端钱包XAA余额失败:', error);
    throw new Error(`检查服务端钱包XAA余额失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 执行XAA销毁
 * 直接使用XAA合约的burn方法
 */
async function executeXAABurn(burnAmount: string): Promise<{ txHash: string }> {
  try {
    console.log(`🔥 执行XAA销毁 - 数量: ${burnAmount} XAA`);
    console.log(`📊 销毁数量详情: ${burnAmount} XAA`);
    console.log(`💰 销毁数量 (wei): ${parseEther(burnAmount).toString()}`);
    console.log(`🏦 XAA代币合约地址: ${CONTRACTS.XAA_TOKEN}`);

    const { walletClient, publicClient } = await getServerWalletClients();
    const burnAmountWei = parseEther(burnAmount);

    console.log(`🔥 调用XAA合约burn方法 - 销毁 ${burnAmount} XAA`);

    // 直接使用XAA合约的burn方法
    const hash = await walletClient.writeContract({
      address: CONTRACTS.XAA_TOKEN as `0x${string}`,
      abi: XAA_ABI,
      functionName: 'burn',
      args: [burnAmountWei],
    });

    console.log(`📝 XAA burn交易已提交 - Hash: ${hash}`);

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ XAA销毁成功 - 已销毁 ${burnAmount} XAA`);
      return { txHash: hash };
    } else {
      throw new Error('XAA销毁交易失败');
    }

  } catch (error) {
    console.error('❌ 执行XAA销毁失败:', error);
    throw new Error(`执行XAA销毁失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 主要的XAA销毁函数
 * 销毁IAO中XAA数量的5%
 */
export async function burnXAAFromServerWallet(
  iaoContractAddress: `0x${string}`
): Promise<XAABurnResult> {
  try {
    console.log('🔥 开始XAA销毁流程...');
    console.log(`📍 IAO合约地址: ${iaoContractAddress}`);

    // 1. 获取IAO中的XAA总量
    const iaoXAAAmount = await getIAOXAAAmount(iaoContractAddress);
    const iaoXAANumber = parseFloat(iaoXAAAmount);

    if (iaoXAANumber <= 0) {
      return {
        success: false,
        error: 'IAO中没有XAA可供销毁'
      };
    }

    // 2. 计算销毁数量（5%）
    const burnPercentage = 0.05; // 5%
    const burnAmount = (iaoXAANumber * burnPercentage).toString();

    console.log(`📊 IAO中XAA总量: ${iaoXAAAmount} XAA`);
    console.log(`🔥 计算销毁数量: ${burnAmount} XAA (${burnPercentage * 100}%)`);

    // 3. 检查服务端钱包余额
    const serverBalance = await checkServerWalletXAABalance();
    const serverBalanceNumber = parseFloat(serverBalance);

    if (serverBalanceNumber < parseFloat(burnAmount)) {
      return {
        success: false,
        error: `服务端钱包XAA余额不足，需要 ${burnAmount} XAA，当前余额 ${serverBalance} XAA`
      };
    }

    // 4. 执行销毁
    const { txHash } = await executeXAABurn(burnAmount);

    console.log('✅ XAA销毁完成');
    console.log(`🔥 销毁数量: ${burnAmount} XAA`);
    console.log(`📊 IAO总XAA: ${iaoXAAAmount} XAA`);
    console.log(`📝 交易哈希: ${txHash}`);

    return {
      success: true,
      txHash,
      burnAmount,
      iaoXAAAmount
    };

  } catch (error) {
    console.error('❌ XAA销毁失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
