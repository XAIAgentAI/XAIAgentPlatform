import { SwapResponse, SwapData, KLineData } from '../types/swap';

const SUBGRAPH_URL = 'https://test.dbcswap.io/api/graph-mainnet/subgraphs/name/ianlapham/dbcswap-v3-mainnet';

const swapQuery = `
  query GetSwaps {
    swaps(
      orderBy: timestamp, 
      orderDirection: desc,
      first: 120
    ) {
      id
      amount0
      amount1
      token0 {
        id
        name
        volume
      }
      token1 {
        id
        name
        volume
      }
      timestamp
    }
  }
`;

export const fetchSwapData = async (): Promise<SwapData[]> => {
  try {
    console.log('开始请求 Subgraph API...');
    console.log('请求URL:', SUBGRAPH_URL);
    console.log('请求Query:', swapQuery);

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: swapQuery,
      }),
    });

    if (!response.ok) {
      console.error('API响应错误:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error('Network response was not ok');
    }

    const data: SwapResponse = await response.json();
    console.log('API返回的完整Swap数据:', data?.data?.swaps);
    console.log('API返回数据统计:', {
      hasData: !!data,
      swapsLength: data?.data?.swaps?.length || 0,
      firstSwap: data?.data?.swaps?.[0],
      lastSwap: data?.data?.swaps?.[data?.data?.swaps?.length - 1]
    });

    return data.data.swaps;
  } catch (error) {
    console.error('获取swap数据时出错:', error);
    throw error;
  }
};

export const convertToKLineData = (swaps: SwapData[]): KLineData[] => {
  console.log('开始转换K线数据, 输入的完整Swap数据:', swaps);
  console.log('输入数据长度:', swaps?.length || 0);
  
  if (!swaps || swaps.length === 0) {
    console.warn('没有swap数据可供转换');
    return [];
  }

  // 按小时分组
  const groupedByTimestamp: { [key: number]: SwapData[] } = {};
  
  swaps.forEach(swap => {
    // 转换为毫秒时间戳
    const timestamp = parseInt(swap.timestamp) * 1000;
    // 向下取整到小时
    const hourTimestamp = Math.floor(timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
    
    if (!groupedByTimestamp[hourTimestamp]) {
      groupedByTimestamp[hourTimestamp] = [];
    }
    groupedByTimestamp[hourTimestamp].push(swap);
  });

  console.log('按小时分组统计:', {
    总数据量: swaps.length,
    分组数量: Object.keys(groupedByTimestamp).length,
    时间范围: {
      开始: new Date(Math.min(...Object.keys(groupedByTimestamp).map(Number))).toISOString(),
      结束: new Date(Math.max(...Object.keys(groupedByTimestamp).map(Number))).toISOString()
    }
  });

  // 转换为K线数据
  const klineData = Object.entries(groupedByTimestamp).map(([timestamp, hourSwaps]) => {
    // 确保交易按时间排序
    hourSwaps.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    
    const rates = hourSwaps.map(swap => {
      const amount0 = parseFloat(swap.amount0);
      const amount1 = parseFloat(swap.amount1);
      return Math.abs(amount1 / amount0);
    }).filter(rate => !isNaN(rate) && isFinite(rate) && rate > 0);

    if (rates.length === 0) {
      console.warn(`时间戳 ${timestamp} 的数据点无有效汇率`);
      return null;
    }

    const klineData: KLineData = {
      time: parseInt(timestamp) / 1000, // 转换为秒
      open: rates[0],
      high: Math.max(...rates),
      low: Math.min(...rates),
      close: rates[rates.length - 1],
      volume: hourSwaps.reduce((acc, swap) => {
        const volume = Math.abs(parseFloat(swap.amount1));
        return acc + (isNaN(volume) ? 0 : volume);
      }, 0)
    };

    return klineData;
  }).filter((item): item is KLineData => item !== null);

  // 按时间升序排序
  const sortedKlineData = klineData.sort((a, b) => a.time - b.time);

  console.log('转换后的K线数据统计:', {
    原始数据量: swaps.length,
    分组数量: Object.keys(groupedByTimestamp).length,
    最终K线数量: sortedKlineData.length,
    时间范围: {
      开始: new Date(sortedKlineData[0]?.time * 1000).toISOString(),
      结束: new Date(sortedKlineData[sortedKlineData.length - 1]?.time * 1000).toISOString()
    }
  });

  return sortedKlineData;
}; 