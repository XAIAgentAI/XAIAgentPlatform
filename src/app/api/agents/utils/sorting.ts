import { getIaoFundraisingAmount } from './iao-utils';

// 根据指定字段对数据进行排序
export async function sortAgentData(
  items: any[],
  sortBy: string,
  sortOrder: string,
  page: number = 1,
  status?: string | null
): Promise<any[]> {
  let result = [...items]; // 创建副本以避免修改原数组
  let iaoItemsWithFunding: any[] = [];

  // IAO即将开始状态的特殊排序：有倒计时的排在上面，倒计时最短的排在最上面
  if (status === 'IAO_COMING_SOON') {
    const now = Math.floor(Date.now() / 1000);
    
    result = result.sort((a, b) => {
      const aStartTime = a.iaoStartTime ? Number(a.iaoStartTime) : null;
      const bStartTime = b.iaoStartTime ? Number(b.iaoStartTime) : null;
      
      // 计算倒计时时间（秒）
      const aCountdown = aStartTime ? aStartTime - now : null;
      const bCountdown = bStartTime ? bStartTime - now : null;
      
      // 有倒计时的排在上面
      if (aCountdown !== null && bCountdown !== null) {
        // 都有倒计时，按倒计时时长升序排列（倒计时最短的排在最上面）
        return aCountdown - bCountdown;
      } else if (aCountdown !== null) {
        // a有倒计时，b没有，a排在前面
        return -1;
      } else if (bCountdown !== null) {
        // b有倒计时，a没有，b排在前面
        return 1;
      } else {
        // 都没有倒计时，保持原有顺序
        return 0;
      }
    });
    
    return result;
  }

  // 特殊处理：只在第一页且没有明确状态筛选时，将IAO项目倒计时<24小时且募资金额前三的置顶
  if (page === 1 && (!status || status === '')) {
    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 24 * 60 * 60;

    // 筛选出IAO进行中且倒计时<24小时的项目
    const iaoOngoingItems = result.filter(item => {
      const endTime = item.endTime;
      if (!endTime) return false;

      const isIaoOngoing = now >= (item.startTime || 0) && now < endTime;
      const isWithin24Hours = endTime - now < oneDayInSeconds;

      return isIaoOngoing && isWithin24Hours;
    });

    // 获取这些项目的募资金额并排序
     iaoItemsWithFunding = await Promise.all(
      iaoOngoingItems.map(async (item) => {
        const fundingAmount = await getIaoFundraisingAmount(item);
        return { ...item, _iaoFundingAmount: fundingAmount };
      })
    );

    // 按募资金额排序，取前三名
    const topThreeIaoItems = iaoItemsWithFunding
      .sort((a, b) => (b._iaoFundingAmount || 0) - (a._iaoFundingAmount || 0))
      .slice(0, 3);

    // 从原数组中移除这些置顶项目
    const remainingItems = result.filter(item =>
      !topThreeIaoItems.some(topItem => topItem.id === item.id)
    );

    // 将置顶项目放在最前面
    result = [...topThreeIaoItems, ...remainingItems];
  }

  if (['usdPrice', 'volume24h', 'tvl', 'marketCap', 'lp', 'priceChange24h'].includes(sortBy)) {
    const sortField = `_${sortBy}`;
    
    // 确保所有项目都有有效的排序字段值
    // 对于marketCap字段，如果_marketCap为0但marketCap字符串存在，尝试从字符串中提取数值
    if (sortBy === 'marketCap') {
      result.forEach(item => {
        if (item._marketCap === 0 && item.marketCap) {
          try {
            // 从字符串中提取数值，例如从"$1,000,000"提取1000000
            const marketCapStr = item.marketCap.replace(/[$,]/g, '');
            const marketCapNum = parseFloat(marketCapStr);
            if (!isNaN(marketCapNum)) {
              item._marketCap = marketCapNum;
            }
          } catch (e) {
            console.error(`无法从 ${item.marketCap} 提取市值用于项目 ${item.name}:`, e);
          }
        }
      });
    }
    
    result = result.sort((a, b) => {
      if (sortOrder === 'desc') {
        return (b[sortField] || 0) - (a[sortField] || 0);
      } else {
        return (a[sortField] || 0) - (b[sortField] || 0);
      }
    });
    
  }
  // 处理 investedXAA 排序
  else if (sortBy === 'investedXAA') {
    // 首先需要为所有项目获取募资金额
    const itemsWithFunding = await Promise.all(
      result.map(async (item) => {
        const fundingAmount = await getIaoFundraisingAmount(item);
        return { ...item, _iaoFundingAmount: fundingAmount };
      })
    );

    // 按募资金额排序
    result = itemsWithFunding.sort((a, b) => {
      if (sortOrder === 'desc') {
        return (b._iaoFundingAmount || 0) - (a._iaoFundingAmount || 0);
      } else {
        return (a._iaoFundingAmount || 0) - (b._iaoFundingAmount || 0);
      }
    });

    // 更新 iaoItemsWithFunding 以便后续处理
    iaoItemsWithFunding = itemsWithFunding;
  }
  // 支持更复杂的排序组合
  else if (sortBy === 'hot') {
    result = result.sort((a, b) => {
      const scoreA = (a._marketCap || 0) * 0.5 + (a._volume24h || 0) * 0.3 + (a.usageCount || 0) * 0.2;
      const scoreB = (b._marketCap || 0) * 0.5 + (b._volume24h || 0) * 0.3 + (b.usageCount || 0) * 0.2;
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
  }
  else if (sortBy === 'trending') {
    result = result.sort((a, b) => {
      // 价格变化的绝对值乘以交易量
      const scoreA = Math.abs(a._priceChange24h || 0) * (a._volume24h || 1);
      const scoreB = Math.abs(b._priceChange24h || 0) * (b._volume24h || 1);
      return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
  }

  // 1. 构建一个 id -> _iaoFundingAmount 的映射
  const iaoFundingMap = new Map<string, number>();
  iaoItemsWithFunding.forEach(item => {
    iaoFundingMap.set(item.id, item._iaoFundingAmount || 0);
  });

  // 2. 融合到最终返回的 agent 数据
  result = result.map(agent => {
    if (iaoFundingMap.has(agent.id)) {
      return {
        ...agent,
        investedXAA: iaoFundingMap.get(agent.id), // 用链上最新的覆盖
      };
    }
    return agent;
  });

  return result;
}

// 构建排序条件
export function buildOrderBy(sortBy: string, sortOrder: string): any {
  // 处理特殊排序方式
  const specialSortFields = ['usdPrice', 'volume24h', 'tvl', 'marketCap', 'lp', 'priceChange24h', 'hot', 'trending', 'investedXAA'];

  // 根据价格等字段排序时使用不同的查询策略
  if (specialSortFields.includes(sortBy)) {
    // 默认使用创建时间排序，后续通过程序处理排序
    return { createdAt: 'desc' };
  } else {
    // 对于标准字段，直接使用数据库排序
    return { [sortBy]: sortOrder };
  }
} 