import { fetchDBCPrice } from '@/hooks/useDBCPrice';
import { SwapResponse, SwapData, KLineData } from '../types/swap';
import { TimeInterval } from '@/hooks/useTokenPrice';
import { calculatePriceChange, calculate24hPriceChange, find24hAgoPrice } from '@/lib/utils';

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_IS_TEST_ENV === "true" ? "https://test.dbcswap.io/api/graph/subgraphs/name/ianlapham/uniswap-v3-test" : 'https://test.dbcswap.io/api/graph-mainnet/subgraphs/name/ianlapham/dbcswap-v3-mainnet';
export const DBC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_IS_TEST_ENV === "true" ? "" : "0xd7ea4da7794c7d09bceab4a21a6910d9114bc936";
export const XAA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_IS_TEST_ENV === "true" ? "0xC21155334688E2c1Cf89D4aB09d38D30002717DD" : "0x16d83f6b17914a4e88436251589194ca5ac0f452";


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

export const convertToKLineData = (swaps: SwapData[], interval: TimeInterval = '1h', targetToken: string, baseToken: string): KLineData[] => {
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

      // 判断token0和token1的位置
      const token0Address = swap.token0.id.toLowerCase();
      const token1Address = swap.token1.id.toLowerCase();
      const targetTokenAddress = targetToken.toLowerCase();
      const baseTokenAddress = baseToken.toLowerCase();

      // 确定baseToken和targetToken的位置
      const baseTokenIsToken0 = token0Address === baseTokenAddress;
      const targetTokenIsToken0 = token0Address === targetTokenAddress;

      debugger
      // 根据token位置计算价格
      if (baseTokenIsToken0 && !targetTokenIsToken0) {
        return Math.abs(amount0 / amount1);  // 每个baseToken能换多少targetToken
      } else if (!baseTokenIsToken0 && targetTokenIsToken0) {
        return Math.abs(amount1 / amount0);  // 每个baseToken能换多少targetToken
      } else {
        console.warn('Token位置异常，无法计算价格');
        return 0;
      }

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
  lp?: number; // LP 数量
  targetTokenAmountLp?: number; // 目标代币LP数量
  baseTokenAmountLp?: number; // 基础代币LP数量
}

// 批量获取代币价格
export const getBatchTokenPrices = async (tokens: TokenInfo[]): Promise<{ [symbol: string]: TokenPriceInfo }> => {
  console.log("getBatchTokenPrices-tokens", tokens);

  try {
    // 获取24小时前的时间戳
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    // 构建查询数组
    const queries = tokens.map((token) => {
      const baseToken = token.symbol.toUpperCase() === 'XAA' ? DBC_TOKEN_ADDRESS : XAA_TOKEN_ADDRESS;
      const targetToken = token.address;

      return `
        ${token.symbol}Pool: pools(
          first: 1,
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
          id
          totalValueLockedToken0
          totalValueLockedToken1
          totalValueLockedUSD
          liquidity
          token0 {
            id
            decimals
          }
          token1 {
            id
            decimals
          }
        }
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
          pool {
            id
            token0 {
              id
              totalSupply
              volume
            }
            token1 {
              id
              totalSupply
              volume
            }
          }
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
          first: 1000,
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
        },
        ${token.symbol}24hWithin: swaps(
          first: 1,
          orderBy: timestamp,
          orderDirection: asc,
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
      `;
    });

    // 添加XAA-DBC兑换比例查询
    const xaaDbcQuery = `
      xaaDbcSwap: swaps(
        first: 1,
        orderBy: timestamp,
        orderDirection: desc,
        where: {
          and: [
            {
              or: [
                { token0: "${XAA_TOKEN_ADDRESS.toLowerCase()}" },
                { token1: "${XAA_TOKEN_ADDRESS.toLowerCase()}" }
              ]
            },
            {
              or: [
                { token0: "${DBC_TOKEN_ADDRESS.toLowerCase()}" },
                { token1: "${DBC_TOKEN_ADDRESS.toLowerCase()}" }
              ]
            }
          ]
        }
      ) {
        amount0
        amount1
        token0 {
          id
        }
        token1 {
          id
        }
        timestamp
      }
    `;

    // 构建完整的 GraphQL 查询
    const query = `
      query GetBatchTokenPrices {
        ${queries.join('\n')}
        ${xaaDbcQuery}
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

    // 计算XAA-DBC兑换比例
    let xaaDbcRate = 1;
    const xaaDbcSwap = data.data.xaaDbcSwap?.[0];
    if (xaaDbcSwap) {
      const isXaaToken0 = xaaDbcSwap.token0.id.toLowerCase() === XAA_TOKEN_ADDRESS.toLowerCase();
      const amount0 = parseFloat(xaaDbcSwap.amount0);
      const amount1 = parseFloat(xaaDbcSwap.amount1);
      if (amount0 !== 0 && amount1 !== 0) {
        xaaDbcRate = isXaaToken0 ? Math.abs(amount1 / amount0) : Math.abs(amount0 / amount1);
      }
    }

    // 计算XAA的USD价格
    const xaaUsdPrice = xaaDbcRate * dbcPriceUsd;
    console.log("XAA USD Price:", xaaUsdPrice);

    const priceMap: { [symbol: string]: TokenPriceInfo } = {};

    // 处理每个代币的数据
    tokens.forEach((token) => {
      const poolData = data.data[`${token.symbol}Pool`];
      const swapData = data.data[token.symbol];
      const swapData24h = data.data[`${token.symbol}24h`];
      const swapData24hAgo = data.data[`${token.symbol}24hAgo`];
      const swapData24hWithin = data.data[`${token.symbol}24hWithin`];

      if (swapData && swapData[0] && poolData && poolData[0]) {
        const swap = swapData[0];
        const pool = poolData[0];
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
              priceChange24h: 0,
              lp: 0
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


          // 获取24小时前的价格
          const { price24hAgo, isWithin24h, timeDiff } = find24hAgoPrice({
            swaps24hAgo: swapData24hAgo,
            swaps24hWithin: swapData24hWithin,
            targetTimestamp: oneDayAgo,
            baseTokenIsToken0,
            targetTokenIsToken0,
            xaaDbcRate,
            baseTokenIsXAA: baseToken === XAA_TOKEN_ADDRESS
          });



          // 如果时间差太大，可能需要处理
          if (timeDiff > 3600) { // 如果差距超过1小时
            console.warn(`警告: 24小时前价格数据时间差较大 (${timeDiff} 秒)`);
          }

          // 获取 TVL 和 Volume
          const tokenData = targetTokenIsToken0 ? swap.token0 : swap.token1;

          // 计算24小时交易量
          const volume24h = swapData24h?.reduce((total: number, swap: any) => {
            const swapAmount = targetTokenIsToken0 ?
              Math.abs(parseFloat(swap.amount0)) :
              Math.abs(parseFloat(swap.amount1));
            return total + (isNaN(swapAmount) ? 0 : swapAmount);
          }, 0) || 0;

          // 如果基准代币是XAA，需要转换为DBC价格
          if (baseToken === XAA_TOKEN_ADDRESS) {
            currentPrice = currentPrice * xaaDbcRate;
          }
          const usdPrice = (currentPrice) ? Number((Number(currentPrice) * Number(dbcPriceUsd)).toFixed(8)) : 0;

          console.log("token", token, "currentPrice", currentPrice, "usdPrice", usdPrice, "dbcPriceUsd", dbcPriceUsd);

          // 计算 LP 数量 - 使用对标代币的 volumeToken 而不是 totalValueLocked
          const baseTokenAmount = !targetTokenIsToken0 ?
            parseFloat(pool.totalValueLockedToken0 || '0') :
            parseFloat(pool.totalValueLockedToken1 || '0');

          const targetTokenAmount = !targetTokenIsToken0 ?
            parseFloat(pool.totalValueLockedToken1 || '0') :
            parseFloat(pool.totalValueLockedToken0 || '0');

          // 1STID = 0.13 XAA = 0.13XAA * 0.02048 = 0.0026624 DBC = 0.0026624 DBC * 0.001981 = 0.00000527344 USDT


          // XAA对应的是DBC，其他代币对应的是XAA
          const baseTokenUsdPrice = token.symbol === "XAA" ? dbcPriceUsd :
            xaaUsdPrice


          const baseTokenUsdPriceFormatted = Number(baseTokenUsdPrice.toFixed(8));
          const lp = Number((baseTokenAmount * baseTokenUsdPriceFormatted).toFixed(2)); // 乘以 DBC 单价
          console.log("baseTokenAmount", baseTokenAmount, "baseTokenUsdPriceFormatted", baseTokenUsdPriceFormatted, "lp", lp);
          6095240865

          // debugger
          priceMap[token.symbol] = {
            tokenAddress: token.address,
            usdPrice,
            tvl: parseFloat(tokenData.totalValueLockedUSD || '0'),
            volume24h: Number(volume24h.toFixed(2) * usdPrice),
            priceChange24h: Number(calculatePriceChange(currentPrice, price24hAgo).toFixed(2)),
            lp,
            targetTokenAmountLp: Number((targetTokenAmount).toFixed(2)),
            baseTokenAmountLp: Number((baseTokenAmount).toFixed(2)),
          };
        } catch (error) {
          console.error(`处理代币 ${token.symbol} 数据时出错:`, error);
          priceMap[token.symbol] = {
            tokenAddress: token.address,
            usdPrice: 0,
            tvl: 0,
            volume24h: 0,
            priceChange24h: 0,
            lp: 0
          };
        }
      } else {
        // 如果没有找到交易数据，设置默认值
        priceMap[token.symbol] = {
          tokenAddress: token.address,
          usdPrice: 0,
          tvl: 0,
          volume24h: 0,
          priceChange24h: 0,
          lp: 0,
          targetTokenAmountLp: 0,
          baseTokenAmountLp: 0,
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
        priceChange24h: 0,
        lp: 0
      };
      return acc;
    }, {} as { [symbol: string]: TokenPriceInfo });
  }
};

interface TokenExchangeRateResponse {
  data: {
    swaps: Array<{
      id: string;
      amount0: string;
      amount1: string;
      token0: {
        id: string;
      };
      token1: {
        id: string;
      };
      timestamp: string;
    }>;
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * 获取两个代币之间的最新兑换比例
 * @param token0Address 代币0地址
 * @param token1Address 代币1地址
 * @returns 返回代币0对代币1的兑换比例，如果无法获取则返回 1
 */
export const getTokenExchangeRate = async (token0Address: string, token1Address: string): Promise<number> => {
  try {
    const query = `
      query GetTokenExchangeRate($token0Address: String!, $token1Address: String!) {
        swaps(
          first: 1,
          orderBy: timestamp,
          orderDirection: desc,
          where: {
            and: [
              {
                or: [
                  { token0: $token0Address },
                  { token1: $token0Address }
                ]
              },
              {
                or: [
                  { token0: $token1Address },
                  { token1: $token1Address }
                ]
              }
            ]
          }
        ) {
          id
          amount0
          amount1
          token0 {
            id
          }
          token1 {
            id
          }
          timestamp
        }
      }
    `;

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          token0Address: token0Address.toLowerCase(),
          token1Address: token1Address.toLowerCase()
        }
      }),
    });

    if (!response.ok) {
      console.error('获取代币兑换比例API响应错误:', {
        status: response.status,
        statusText: response.statusText
      });
      return 1;
    }

    const data: TokenExchangeRateResponse = await response.json();

    if (data.errors) {
      console.error('获取代币兑换比例查询错误:', data.errors);
      return 1;
    }

    const latestSwap = data.data.swaps[0];
    if (!latestSwap) {
      console.warn('未找到代币兑换记录');
      return 1;
    }

    const amount0 = parseFloat(latestSwap.amount0);
    const amount1 = parseFloat(latestSwap.amount1);
    const isToken0Token0 = latestSwap.token0.id.toLowerCase() === token0Address.toLowerCase();

    if (amount0 === 0 || amount1 === 0) {
      console.warn('代币兑换金额为0');
      return 1;
    }

    // 如果 token0 是 token0，则使用 amount0/amount1，否则使用 amount1/amount0
    const rate = isToken0Token0 ? Math.abs(amount1 / amount0) : Math.abs(amount0 / amount1);

    return rate;
  } catch (error) {
    console.error('获取代币兑换比例失败:', error);
    return 1;
  }
};
