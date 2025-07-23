import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 工具模块
 * @module Utils
 * @category 工具
 */

/**
 * 合并Tailwind CSS类，保持正确的优先级顺序
 * 
 * @param inputs - 要合并的CSS类数组
 * @returns 合并后的CSS类字符串
 * @example
 * ```tsx
 * // 在组件中使用
 * <div className={cn("base-style", isActive && "active-style", className)}>
 *   内容
 * </div>
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将日期字符串格式化为本地化的日期和时间
 * 
 * @param date - 要格式化的日期字符串或Date对象
 * @returns 格式化后的日期时间字符串
 * @example
 * ```ts
 * // 格式化当前日期
 * const formattedDate = formatDate(new Date());
 * // 格式化ISO日期字符串
 * const formattedDate = formatDate("2023-01-01T12:00:00Z");
 * ```
 */
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString()
}

/**
 * 生成指定长度的随机字符串ID
 * 
 * @param length - 生成的ID长度，默认为8
 * @returns 随机生成的字符串ID
 * @example
 * ```ts
 * // 生成默认长度(8)的ID
 * const id = generateId();
 * // 生成12位长度的ID
 * const longerId = generateId(12);
 * ```
 */
export function generateId(length: number = 8) {
  return Math.random().toString(36).substring(2, length + 2)
}

/**
 * 计算价格变化百分比
 * @param currentPrice 当前价格
 * @param price24hAgo 24小时前价格
 * @returns 价格变化百分比
 */
export const calculatePriceChange = (currentPrice: number, price24hAgo: number): number => {
  if (price24hAgo <= 0 || currentPrice <= 0) return 0;
  return ((currentPrice - price24hAgo) / price24hAgo) * 100;
};

/**
 * K线数据点类型
 */
export interface KLineDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * 计算24小时价格变化
 * @param params 计算所需参数
 * @returns 价格变化信息
 */
export const calculate24hPriceChange = (params: {
  klineData: KLineDataPoint[];
  currentPrice: number;
}): {
  priceChange: number;
  price24hAgo: number;
  isValid: boolean;
  debugInfo?: {
    currentTime: number;
    targetTime: number;
    closestTime: number;
    dataPoints: number;
  };
} => {
  const { klineData, currentPrice } = params;

  console.log("klineData", klineData, "currentPrice", currentPrice);

  // 初始化返回值
  const result = {
    priceChange: 0,
    price24hAgo: 0,
    isValid: false,
    debugInfo: {
      currentTime: 0,
      targetTime: 0,
      closestTime: 0,
      dataPoints: klineData.length,
    }
  };

  try {
    // 基础验证
    if (!Array.isArray(klineData) || klineData.length === 0) {
      console.warn('K线数据为空或无效');
      return result;
    }

    if (typeof currentPrice !== 'number' || currentPrice <= 0) {
      console.warn('当前价格无效:', currentPrice);
      return result;
    }

    // 确保数据按时间排序
    const sortedData = [...klineData].sort((a, b) => a.time - b.time);

    // 获取当前时间和24小时前的时间戳
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgoTimestamp = now - 24 * 60 * 60;

    // 更新调试信息
    result.debugInfo.currentTime = now;
    result.debugInfo.targetTime = oneDayAgoTimestamp;

    // 找到最接近24小时前的有效数据点
    let closestIndex = -1;
    let minTimeDiff = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < sortedData.length; i++) {
      const dataPoint = sortedData[i];
      
      // 验证数据点的有效性
      if (!dataPoint || typeof dataPoint.time !== 'number' || typeof dataPoint.close !== 'number') {
        continue;
      }

      // 统一时间戳格式（处理毫秒和秒的情况）
      const pointTime = dataPoint.time > 9999999999 ? 
        Math.floor(dataPoint.time / 1000) : 
        dataPoint.time;

      const timeDiff = Math.abs(pointTime - oneDayAgoTimestamp);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestIndex = i;
      }
    }

    // 如果找不到有效的数据点
    if (closestIndex === -1) {
      console.warn('未找到有效的24小时前数据点');
      return result;
    }

    // 获取24小时前的价格
    const price24hAgo = sortedData[closestIndex].close;
    result.debugInfo.closestTime = sortedData[closestIndex].time;

    // 验证24小时前的价格
    if (typeof price24hAgo !== 'number' || price24hAgo <= 0) {
      console.warn('24小时前价格无效:', price24hAgo);
      return result;
    }

    // 计算价格变化
    const priceChange = ((currentPrice - price24hAgo) / price24hAgo) * 100;

    // 验证计算结果
    if (!isFinite(priceChange)) {
      console.warn('价格变化计算结果无效:', priceChange);
      return result;
    }

    // 更新结果
    result.priceChange = Number(priceChange.toFixed(2)); // 保留两位小数
    result.price24hAgo = price24hAgo;
    result.isValid = true;

    return result;

  } catch (error) {
    console.error('计算24小时价格变化时发生错误:', error);
    return result;
  }
};

/**
 * 格式化价格变化显示
 */
export const formatPriceChange = (priceChange: number | string | undefined | null): string => {
  if (priceChange === undefined || priceChange === null) return '+0.00%';
  
  const numericChange = typeof priceChange === 'string' ? parseFloat(priceChange) : priceChange;
  
  if (!isFinite(numericChange) || isNaN(numericChange)) return '+0.00%';
  
  // 处理 -0 的情况
  if (Math.abs(numericChange) < 0.01) return '+0.00%';
  
  const sign = numericChange >= 0 ? '+' : '';
  return `${sign}${numericChange.toFixed(2)}%`;
};

/**
 * 找到最接近指定时间戳的数据点索引
 * @param dataPoints 数据点数组
 * @param targetTimestamp 目标时间戳
 * @param getTime 获取数据点时间戳的函数
 * @returns 最接近的数据点索引
 */
export const findClosestDataPointIndex = <T>(
  dataPoints: T[],
  targetTimestamp: number,
  getTime: (point: T) => number
): number => {
  let closestIndex = 0;
  let minTimeDiff = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < dataPoints.length; i++) {
    const timeDiff = Math.abs(getTime(dataPoints[i]) - targetTimestamp);
    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestIndex = i;
    }
  }

  return closestIndex;
};

export interface SwapData {
  amount0: string;
  amount1: string;
  timestamp: string;
}

/**
 * 从多个交易中找出24小时前或最早的价格
 */
export const find24hAgoPrice = (params: {
  swaps24hAgo: SwapData[];      // 24小时前的交易数据
  swaps24hWithin: SwapData[];   // 24小时内的交易数据
  targetTimestamp: number;
  baseTokenIsToken0: boolean;
  targetTokenIsToken0: boolean;
  xaaDbcRate?: number;
  baseTokenIsXAA?: boolean;
}): {
  price24hAgo: number;
  timestamp: number;
  timeDiff: number;
  isWithin24h: boolean;  // 标识是否使用了24小时内的数据
} => {
  const {
    swaps24hAgo,
    swaps24hWithin,
    targetTimestamp,
    baseTokenIsToken0,
    targetTokenIsToken0,
    xaaDbcRate = 1,
    baseTokenIsXAA = false
  } = params;

  // 初始化返回值
  const result = {
    price24hAgo: 0,
    timestamp: 0,
    timeDiff: Number.MAX_SAFE_INTEGER,
    isWithin24h: false
  };

  try {
    let swapToUse;


    
    // 首先尝试使用24小时前的数据
    if (swaps24hAgo && swaps24hAgo.length > 0) {
      // 使用24小时前最近的一笔交易
      if(swaps24hAgo[0].timestamp < swaps24hAgo[swaps24hAgo.length - 1].timestamp) {
        swapToUse = swaps24hAgo[swaps24hAgo.length - 1];
        result.isWithin24h = false;
      } else {
        swapToUse = swaps24hAgo[0];
        result.isWithin24h = false;
      }
    } 
    // 如果没有24小时前的数据，使用24小时内最早的数据
    else if (swaps24hWithin && swaps24hWithin.length > 0) {
      if(swaps24hWithin[0].timestamp < swaps24hWithin[swaps24hWithin.length - 1].timestamp) {
        swapToUse = swaps24hWithin[0];
        result.isWithin24h = true;
      } else {
        swapToUse = swaps24hWithin[swaps24hWithin.length - 1];
        result.isWithin24h = true;
      }
    } else {
      // 如果都没有数据，返回初始值
      console.log('没有找到任何交易数据');
      return result;
    }

    // 计算时间差
    const swapTimestamp = parseInt(swapToUse.timestamp);
    const timeDiff = Math.abs(swapTimestamp - targetTimestamp);

    // 计算价格
    const amount0 = parseFloat(swapToUse.amount0);
    const amount1 = parseFloat(swapToUse.amount1);
    console.log("111 amount0", amount0, "amount1", amount1);

    if (amount0 !== 0 && amount1 !== 0) {
      let price;
      if (baseTokenIsToken0 && !targetTokenIsToken0) {
        price = Math.abs(amount0 / amount1);
      } else if (!baseTokenIsToken0 && targetTokenIsToken0) {
        price = Math.abs(amount1 / amount0);
      }

      console.log("222 24h ago price前", price);


      // 如果基准代币是XAA，需要转换为DBC价格
      if (baseTokenIsXAA && typeof price === 'number') {
        price = price * xaaDbcRate;
      }

      console.log("222 24h ago price", price);

      result.price24hAgo = price || 0;
      result.timestamp = swapTimestamp;
      result.timeDiff = timeDiff;

      // console.log('价格计算结果:', {
      //   使用数据类型: result.isWithin24h ? '24小时内最早数据' : '24小时前数据',
      //   交易时间: new Date(swapTimestamp * 1000).toISOString(),
      //   计算价格: price,
      //   时间差: timeDiff
      // });
    } else {
      console.log('交易金额为0:', { amount0, amount1 });
    }

    return result;

  } catch (error) {
    console.error('计算价格时发生错误:', error);
    return result;
  }
};
