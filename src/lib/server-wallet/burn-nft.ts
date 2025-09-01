import { ethers } from 'ethers';
import { getServerWalletPrivateKey } from './config';
import { getServerWalletClients } from './index';

export interface BurnNFCResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * 将NFT转移到黑洞地址进行销毁（ERC721 transferFrom）
 * @param nftTokenAddress NFT合约地址
 * @param tokenId NFT的tokenId
 * @param deadAddress 黑洞地址
 */
export async function transferNFTToDeadAddress(
  nftTokenAddress: `0x${string}`,
  tokenId: string,
  deadAddress: `0x${string}`
): Promise<BurnNFCResult> {
  try {
    console.log('开始执行NFT销毁...');
    console.log(`NFT合约地址: ${nftTokenAddress}`);
    console.log(`tokenId: ${tokenId}`);
    console.log(`黑洞地址: ${deadAddress}`);

    // 统一获取服务端钱包client
    const { walletClient, publicClient, serverAccount } = await getServerWalletClients();
    const fromAddress = serverAccount.address;

    // ERC721 ABI
    const ERC721_ABI = [
      {
        constant: false,
        inputs: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'tokenId', type: 'uint256' }
        ],
        name: 'transferFrom',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ];

    // 发送transferFrom交易
    const hash = await walletClient.writeContract({
      address: nftTokenAddress,
      abi: ERC721_ABI,
      functionName: 'transferFrom',
      args: [fromAddress, deadAddress, tokenId],
    });
    console.log('NFT销毁交易已发送，等待确认...');

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('NFT销毁交易已确认');

    return {
      success: true,
      txHash: receipt.transactionHash || hash,
    };
  } catch (error) {
    console.error('NFT销毁失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
} 