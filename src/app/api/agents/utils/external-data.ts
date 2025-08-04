import { getBatchTokenPrices } from '@/services/swapService';
import { fetchDBCTokens } from '@/services/dbcScan';

// 外部数据结果接口
export interface ExternalDataResult {
  tokenPrices: Record<string, any>;
  dbcTokens: any[];
}

// 获取外部数据（Token价格和DBC令牌信息）
export async function fetchExternalData(
  tokenInfos: { address: string; symbol: string }[]
): Promise<ExternalDataResult> {
  // 创建一个Promise数组来并行获取所有外部数据
  const externalDataPromises: Promise<any>[] = [];

  if (tokenInfos.length > 0) {
    externalDataPromises.push(getBatchTokenPrices(tokenInfos));
  }
  externalDataPromises.push(fetchDBCTokens());

  // 并行请求外部API数据
  const results = await Promise.all(externalDataPromises);

  // 根据Promise数组的顺序提取结果
  let resultIndex = 0;
  let tokenPrices = {} as Record<string, any>;
  let dbcTokens: any[] = [];

  if (tokenInfos.length > 0) {
    tokenPrices = results[resultIndex++];
  }
  dbcTokens = results[resultIndex++];

  return {
    tokenPrices,
    dbcTokens
  };
} 