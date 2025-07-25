import { ethers } from 'ethers';
import { getServerWalletPrivateKey } from './config';

export interface BurnNFCResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * 将NFC代币转移到死亡地址进行销毁
 * @param nfcTokenAddress NFC代币合约地址
 * @param amount 要销毁的数量
 * @param deadAddress 死亡地址
 */
export async function transferNFCToDeadAddress(
  nfcTokenAddress: `0x${string}`,
  amount: string,
  deadAddress: `0x${string}`
): Promise<BurnNFCResult> {
  try {
    console.log('开始执行NFC代币销毁...');
    console.log(`NFC代币地址: ${nfcTokenAddress}`);
    console.log(`销毁数量: ${amount}`);
    console.log(`死亡地址: ${deadAddress}`);

    // 获取服务端钱包私钥并创建钱包实例
    const privateKey = getServerWalletPrivateKey();
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // 直接在方法内定义ERC20_ABI
    const ERC20_ABI = [
      {
        constant: false,
        inputs: [
          { name: '_to', type: 'address' },
          { name: '_value', type: 'uint256' }
        ],
        name: 'transfer',
        outputs: [
          { name: '', type: 'bool' }
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ];

    // 创建NFC代币合约实例
    const nfcContract = new ethers.Contract(
      nfcTokenAddress,
      ERC20_ABI,
      wallet
    );

    // 发送转账交易
    const tx = await nfcContract.transfer(deadAddress, amount);
    console.log('NFC销毁交易已发送，等待确认...');
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log('NFC销毁交易已确认');

    return {
      success: true,
      txHash: receipt.hash,
    };

  } catch (error) {
    console.error('NFC代币销毁失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
} 