import { fetchDBCPrice } from '@/hooks/useDBCPrice';
import { SwapResponse, SwapData, KLineData } from '../types/swap';
import { TimeInterval } from '@/hooks/useTokenPrice';

const SUBGRAPH_URL = 'https://test.dbcswap.io/api/graph-mainnet/subgraphs/name/ianlapham/dbcswap-v3-mainnet';
export const DBC_TOKEN_ADDRESS = "0xd7ea4da7794c7d09bceab4a21a6910d9114bc936";
export const XAA_TOKEN_ADDRESS = "0x16d83f6b17914a4e88436251589194ca5ac0f452";


interface FetchSwapDataParams {
  interval: TimeInterval;
  targetToken: string;
  baseToken: string;
}

interface SwapQueryVariables {
  targetToken: string;
  baseToken: string;
  fromTimestamp: string;
}

const getTimeRange = (interval: TimeInterval): number => {
  const now = Math.floor(Date.now() / 1000);
  switch (interval) {
    case '30m':
      return now - 30 * 60 * 96; // 30分钟间隔，获取最近48小时的数据 (96个数据点)
    case '1h':
      return now - 60 * 60 * 72; // 1小时间隔，获取最近72小时的数据 (72个数据点)
    case '4h':
      return now - 4 * 60 * 60 * 30; // 4小时间隔，获取最近5天的数据 (30个数据点)
    case '1d':
      return now - 24 * 60 * 60 * 30; // 1天间隔，获取最近30天的数据 (30个数据点)
    case '1w':
      return now - 7 * 24 * 60 * 60 * 52; // 1周间隔，获取最近52周的数据
    default:
      return now - 60 * 60 * 72; // 默认1小时
  }
};

const buildSwapQuery = (targetToken: string, baseToken: string, fromTimestamp: number) => `
  query GetSwaps($targetToken: String!, $baseToken: String!, $fromTimestamp: String!) {
    swaps(
      where: {
        and: [
          {
            or: [
              { token0: $targetToken },
              { token1: $targetToken }
            ]
          },
          {
            or: [
              { token0: $baseToken },
              { token1: $baseToken }
            ]
          },
          { timestamp_gt: $fromTimestamp }
        ]
      },
      orderBy: timestamp, 
      orderDirection: desc,
      first: 1000
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

export const fetchSwapData = async ({ interval, targetToken, baseToken }: FetchSwapDataParams): Promise<SwapData[]> => {
  try {
    const fromTimestamp = getTimeRange(interval);
    const query = buildSwapQuery(targetToken, baseToken, fromTimestamp);
    const variables: SwapQueryVariables = {
      targetToken: targetToken.toLowerCase(),
      baseToken: baseToken.toLowerCase(),
      fromTimestamp: fromTimestamp.toString()
    };

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
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

    // 检查是否有错误
    if (data.errors) {
      console.error('子图查询错误:', data.errors);
      throw new Error(data.errors[0].message);
    }

    // 如果没有数据，尝试扩大时间范围
    if (!data.data?.swaps || data.data.swaps.length === 0) {
      // 扩大时间范围到30天
      const extendedFromTimestamp = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const extendedQuery = buildSwapQuery(targetToken, baseToken, extendedFromTimestamp);
      const extendedVariables: SwapQueryVariables = {
        targetToken: targetToken.toLowerCase(),
        baseToken: baseToken.toLowerCase(),
        fromTimestamp: extendedFromTimestamp.toString()
      };

      const extendedResponse = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: extendedQuery,
          variables: extendedVariables
        }),
      });

      const extendedData: SwapResponse = await extendedResponse.json();

      if (extendedData.data?.swaps) {
        return extendedData.data.swaps;
      }
    }

    return data.data.swaps || [];
  } catch (error) {
    console.error('获取交易数据失败:', error);
    throw error;
  }
};

export const convertToKLineData = (swaps: SwapData[], interval: TimeInterval = '1h'): KLineData[] => {
  if (!swaps || swaps.length === 0) {
    return [];
  }

  // 按时间间隔分组
  const groupedByTimestamp: { [key: number]: SwapData[] } = {};

  swaps.forEach(swap => {
    const timestamp = parseInt(swap.timestamp) * 1000; // 转换为毫秒时间戳
    let intervalTimestamp: number;

    // 根据不同的时间间隔进行分组
    if (interval === '30m') {
      // 30分钟为一组
      intervalTimestamp = Math.floor(timestamp / (30 * 60 * 1000)) * (30 * 60 * 1000);
    } else if (interval === '1h') {
      // 1小时为一组
      intervalTimestamp = Math.floor(timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
    } else if (interval === '4h') {
      // 4小时为一组
      intervalTimestamp = Math.floor(timestamp / (4 * 60 * 60 * 1000)) * (4 * 60 * 60 * 1000);
    } else if (interval === '1d') {
      // 1天为一组
      intervalTimestamp = Math.floor(timestamp / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
    } else if (interval === '1w') {
      // 获取当前时间的星期一凌晨
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - date.getDay() + 1);
      intervalTimestamp = date.getTime();
    } else {
      // 默认1小时为一组
      intervalTimestamp = Math.floor(timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
    }

    if (!groupedByTimestamp[intervalTimestamp]) {
      groupedByTimestamp[intervalTimestamp] = [];
    }
    groupedByTimestamp[intervalTimestamp].push(swap);
  });

  // 转换为K线数据
  const klineData = Object.entries(groupedByTimestamp).map(([timestamp, periodSwaps]) => {
    // 确保交易按时间排序
    periodSwaps.sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));

    const rates = periodSwaps.map(swap => {
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
      volume: periodSwaps.reduce((acc, swap) => {
        const volume = Math.abs(parseFloat(swap.amount1));
        return acc + (isNaN(volume) ? 0 : volume);
      }, 0)
    };

    return klineData;
  }).filter((item): item is KLineData => item !== null);

  // 按时间升序排序
  const sortedKlineData = klineData.sort((a, b) => a.time - b.time);

  return sortedKlineData;
};

// // 根据代币对 列表，获取代币对汇率
// export const getTokenPairRate = async (tokenPair: string[]) => {
//   // 检查输入参数
//   if (!tokenPair || tokenPair.length !== 2) {
//     throw new Error('无效的代币对参数');
//   }

//   const [token0, token1] = tokenPair;

//   try {
//     // 构建GraphQL查询
//     const query = `
//       query GetLatestSwap($token0: String!, $token1: String!) {
//         swaps(
//           first: 1, 
//           orderBy: timestamp, 
//           orderDirection: desc,
//           where: {
//             token0: $token0,
//             token1: $token1
//           }
//         ) {
//           id
//           timestamp
//           amount0
//           amount1
//         }
//       }
//     `;

//     // 执行查询
//     const response = await request(
//       process.env.NEXT_PUBLIC_SUBGRAPH_URL as string,
//       query,
//       {
//         token0,
//         token1
//       }
//     );

//     if (!response.swaps || response.swaps.length === 0) {
//       return null;
//     }

//     const latestSwap = response.swaps[0];

//     // 计算汇率
//     const amount0 = parseFloat(latestSwap.amount0);
//     const amount1 = parseFloat(latestSwap.amount1);

//     if (isNaN(amount0) || isNaN(amount1) || amount0 === 0) {
//       return null;
//     }

//     const rate = Math.abs(amount1 / amount0);

//     return {
//       rate,
//       timestamp: parseInt(latestSwap.timestamp)
//     };

//   } catch (error) {
//     console.error('获取代币对汇率失败:', error);
//     throw error;
//   }

// };

interface TokenInfo {
  address: string;
  symbol: string;
}

interface TokenPriceInfo {
  tokenAddress: string;
  tvl: number;
  volume24h: number;
  usdPrice?: number;
  priceChange24h?: number; // 24小时价格变化百分比
}

// 批量获取代币价格
export const getBatchTokenPrices = async (tokens: TokenInfo[]): Promise<{ [symbol: string]: TokenPriceInfo }> => {
  try {
    // 获取24小时前的时间戳
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    // 构建查询数组
    const queries = tokens.map((token) => {
      const baseToken = token.symbol.toUpperCase() === 'XAA' ? DBC_TOKEN_ADDRESS : XAA_TOKEN_ADDRESS;
      const targetToken = token.address;

      return `
        ${token.symbol}: swaps(
          first: 1,
          orderBy: timestamp,
          orderDirection: desc,
          where: {
            and: [
              {
                or: [
                  { token0: "${targetToken.toLowerCase()}" },
                  { token1: "${targetToken.toLowerCase()}" }
                ]
              },
              {
                or: [
                  { token0: "${baseToken.toLowerCase()}" },
                  { token1: "${baseToken.toLowerCase()}" }
                ]
              }
            ]
          }
        ) {
          amount0
          amount1
          token0 {
            id
            totalValueLockedUSD
            volume
          }
          token1 {
            id
            totalValueLockedUSD
            volume
          }
          timestamp
        }
        ${token.symbol}24h: swaps(
          where: {
            and: [
              {
                or: [
                  { token0: "${targetToken.toLowerCase()}" },
                  { token1: "${targetToken.toLowerCase()}" }
                ]
              },
              {
                or: [
                  { token0: "${baseToken.toLowerCase()}" },
                  { token1: "${baseToken.toLowerCase()}" }
                ]
              },
              { timestamp_gt: "${oneDayAgo}" }
            ]
          }
        ) {
          amount0
          amount1
          timestamp
        }
        ${token.symbol}24hAgo: swaps(
          first: 1,
          orderBy: timestamp,
          orderDirection: desc,
          where: {
            and: [
              {
                or: [
                  { token0: "${targetToken.toLowerCase()}" },
                  { token1: "${targetToken.toLowerCase()}" }
                ]
              },
              {
                or: [
                  { token0: "${baseToken.toLowerCase()}" },
                  { token1: "${baseToken.toLowerCase()}" }
                ]
              },
              { timestamp_lt: "${oneDayAgo}" }
            ]
          }
        ) {
          amount0
          amount1
          timestamp
        }
      `;
    });

    // 构建完整的 GraphQL 查询
    const query = `
      query GetBatchTokenPrices {
        ${queries.join('\n')}
      }
    `;

    // 添加重试机制
    const maxRetries = 3;
    let retryCount = 0;
    let response;

    while (retryCount < maxRetries) {
      try {
        response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (response.ok) {
          break;
        }

        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 指数退避
      } catch (error) {
        console.error(`第 ${retryCount + 1} 次请求失败:`, error);
        if (retryCount === maxRetries - 1) throw error;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!response?.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    if (data.errors) {
      console.error('子图查询错误:', data.errors);
      throw new Error(data.errors[0].message);
    }

    const dbcPriceInfo = await fetchDBCPrice();
    const dbcPriceUsd = parseFloat(dbcPriceInfo.priceUsd);

    const priceMap: { [symbol: string]: TokenPriceInfo } = {};

    // 处理每个代币的数据
    tokens.forEach((token) => {
      const swapData = data.data[token.symbol];
      const swapData24h = data.data[`${token.symbol}24h`];
      const swapData24hAgo = data.data[`${token.symbol}24hAgo`];

      if (swapData && swapData[0]) {
        const swap = swapData[0];
        try {
          // 确定 baseToken 和 targetToken 的位置
          const baseToken = token.symbol.toUpperCase() === 'XAA' ? DBC_TOKEN_ADDRESS : XAA_TOKEN_ADDRESS;
          const targetToken = token.address;

          const baseTokenIsToken0 = swap.token0.id.toLowerCase() === baseToken.toLowerCase();
          const targetTokenIsToken0 = swap.token0.id.toLowerCase() === targetToken.toLowerCase();

          const amount0 = parseFloat(swap.amount0);
          const amount1 = parseFloat(swap.amount1);

          if (amount0 === 0 || amount1 === 0) {
            priceMap[token.symbol] = {
              tokenAddress: token.address,
              usdPrice: 0,
              tvl: 0,
              volume24h: 0,
              priceChange24h: 0
            };
            return;
          }

          // 计算当前价格
          let currentPrice;
          if (baseTokenIsToken0 && !targetTokenIsToken0) {
            currentPrice = Math.abs(amount0 / amount1);
          } else if (!baseTokenIsToken0 && targetTokenIsToken0) {
            currentPrice = Math.abs(amount1 / amount0);
          } else {
            console.error(`代币 ${token.symbol} 配对关系异常`);
            currentPrice = 0;
          }

          // 计算24小时前的价格
          let price24hAgo = 0;
          if (swapData24hAgo && swapData24hAgo[0]) {
            const swap24hAgo = swapData24hAgo[0];
            const amount24h0 = parseFloat(swap24hAgo.amount0);
            const amount24h1 = parseFloat(swap24hAgo.amount1);

            if (amount24h0 !== 0 && amount24h1 !== 0) {
              if (baseTokenIsToken0 && !targetTokenIsToken0) {
                price24hAgo = Math.abs(amount24h0 / amount24h1);
              } else if (!baseTokenIsToken0 && targetTokenIsToken0) {
                price24hAgo = Math.abs(amount24h1 / amount24h0);
              }
            }
          }

          // 计算价格变化百分比
          const priceChange24h = price24hAgo > 0 
            ? ((currentPrice - price24hAgo) / price24hAgo) * 100 
            : 0;

          // 获取 TVL 和 Volume
          const tokenData = targetTokenIsToken0 ? swap.token0 : swap.token1;

          // 计算24小时交易量
          const volume24h = swapData24h?.reduce((total: number, swap: any) => {
            const swapAmount = targetTokenIsToken0 ?
              Math.abs(parseFloat(swap.amount0)) :
              Math.abs(parseFloat(swap.amount1));
            return total + (isNaN(swapAmount) ? 0 : swapAmount);
          }, 0) || 0;

          priceMap[token.symbol] = {
            tokenAddress: token.address,
            usdPrice: (currentPrice) ? Number((Number(currentPrice) * Number(dbcPriceUsd)).toFixed(8)) : 0,
            tvl: parseFloat(tokenData.totalValueLockedUSD || '0'),
            volume24h: volume24h,
            priceChange24h: Number(priceChange24h.toFixed(2))
          };
        } catch (error) {
          console.error(`处理代币 ${token.symbol} 数据时出错:`, error);
          priceMap[token.symbol] = {
            tokenAddress: token.address,
            usdPrice: 0,
            tvl: 0,
            volume24h: 0,
            priceChange24h: 0
          };
        }
      } else {
        // 如果没有找到交易数据，设置默认值
        priceMap[token.symbol] = {
          tokenAddress: token.address,
          usdPrice: 0,
          tvl: 0,
          volume24h: 0,
          priceChange24h: 0
        };
      }
    });

    return priceMap;

  } catch (error) {
    console.error('批量获取代币价格失败:', error);
    // 返回空数据而不是抛出错误，避免整个应用崩溃
    return tokens.reduce((acc, token) => {
      acc[token.symbol] = {
        tokenAddress: token.address,
        usdPrice: 0,
        tvl: 0,
        volume24h: 0,
        priceChange24h: 0
      };
      return acc;
    }, {} as { [symbol: string]: TokenPriceInfo });
  }
};
