import { createPublicClient, http, formatEther } from 'viem';
import { dbcMainnet } from '@/config/networks';
import { getContractABI } from '@/config/contracts';

// 获取IAO合约的募资金额
export async function getIaoFundraisingAmount(agent: any): Promise<number> {
  try {
    const iaoContractAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
      ? agent.iaoContractAddressTestnet
      : agent.iaoContractAddress;

    if (!iaoContractAddress) {
      return 0;
    }

    const publicClient = createPublicClient({
      chain: dbcMainnet,
      transport: http()
    });

    const contractABI = getContractABI(agent.symbol);
    const functionName = agent.symbol === 'XAA' ? 'totalDepositedDBC' : 'totalDepositedTokenIn';

    const totalDeposited = await publicClient.readContract({
      address: iaoContractAddress as `0x${string}`,
      abi: contractABI,
      functionName: functionName,
    });

    const totalDepositedNum = Number(formatEther(totalDeposited as bigint));
    return totalDepositedNum;
  } catch (error) {
    console.error(`获取IAO募资金额失败 (${agent.id}):`, error);
    return 0;
  }
}

// 根据状态筛选生成时间条件
export function getStatusTimeFilter(status?: string | null) {
  if (!status) return [];

  const now = Math.floor(Date.now() / 1000);

  switch (status) {
    case 'IAO_ONGOING':
      // IAO进行中：当前时间在IAO开始时间和结束时间之间
      return [{
        AND: [
          { iaoStartTime: { lte: now } },
          { iaoEndTime: { gt: now } }
        ]
      }];

    case 'TRADABLE':
      // 可交易：IAO已结束且有代币地址
      return [{
        AND: [
          { iaoEndTime: { lte: now } },
          {
            OR: [
              { tokenAddress: { not: null } },
              { tokenAddressTestnet: { not: null } }
            ]
          }
        ]
      }];

    case 'IAO_COMING_SOON':
      // IAO即将开始：当前时间小于IAO开始时间
      return [{
        iaoStartTime: { gt: now }
      }];

    case 'TBA':
      // 待公布：IAO已结束但没有代币地址
      return [{
        AND: [
          { iaoEndTime: { lte: now } },
          { tokenAddress: null },
          { tokenAddressTestnet: null }
        ]
      }];

    case 'FAILED':
      // IAO失败：iaoSuccessful字段为false
      return [{
        AND: [
          { iaoEndTime: { lte: now } },
          { iaoSuccessful: false }
        ]
      }];

    default:
      return [];
  }
}

// 根据IAO时间动态计算状态
export function calculateDynamicStatus(item: any, now: number): string {
  const iaoStartTime = item.iaoStartTime ? Number(item.iaoStartTime) : null;
  const iaoEndTime = item.iaoEndTime ? Number(item.iaoEndTime) : null;
  const tokenAddress = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true'
    ? item.tokenAddressTestnet
    : item.tokenAddress;

  // 如果没有IAO时间信息，状态应该是TBA
  if (!iaoStartTime || !iaoEndTime) {
    return 'TBA';
  }

  // 如果有IAO时间信息，检查iaoSuccessful字段
  if (item.iaoSuccessful !== undefined && item.iaoSuccessful !== null) {
    // 如果iaoSuccessful字段存在，根据其值判断状态
    if (item.iaoSuccessful === false) {
      return 'FAILED';
    } else if (item.iaoSuccessful === true) {
      return 'TRADABLE';
    }
  }

  let calculatedStatus: string;

  // 根据当前时间和IAO时间判断状态
  if (now < iaoStartTime) {
    // IAO还未开始
    calculatedStatus = 'IAO_COMING_SOON';
  } else if (now >= iaoStartTime && now < iaoEndTime) {
    // IAO进行中
    calculatedStatus = 'IAO_ONGOING';
  } else if (now >= iaoEndTime) {
    // IAO已结束，检查是否有代币地址
    if (tokenAddress) {
      // 有代币地址，表示可交易
      calculatedStatus = 'TRADABLE';
    } else {
      // IAO结束但还没有代币地址，检查原状态
      if (item.status === 'FAILED') {
        // 如果原状态是FAILED，说明IAO确实失败了
        calculatedStatus = 'FAILED';
      } else {
        // 其他情况，可能在处理中
        calculatedStatus = 'TBA';
      }
    }
  } else {
    // 默认返回原状态
    calculatedStatus = item.status;
  }

  return calculatedStatus;
} 