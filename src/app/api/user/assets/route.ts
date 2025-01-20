import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createSuccessResponse, handleError, ApiError } from '@/lib/error';
import { getUserAddress } from '@/lib/auth';

// 获取用户资产信息
export async function GET() {
  try {
    const address = getUserAddress();
    if (!address) {
      throw new ApiError(401, '未授权');
    }

    // 这里应该连接到以太坊节点获取真实数据
    // 目前返回模拟数据
    const mockData = {
      tokens: [
        {
          symbol: 'ETH',
          balance: '1.5',
          usdValue: 3000,
        },
        {
          symbol: 'USDT',
          balance: '1000',
          usdValue: 1000,
        },
      ],
      nfts: [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          metadata: {
            name: 'NFT #1',
            description: 'This is NFT #1',
            image: 'https://example.com/nft1.png',
          },
        },
      ],
    };

    return createSuccessResponse(mockData);
  } catch (error) {
    return handleError(error);
  }
} 