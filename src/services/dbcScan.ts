import { API_CONFIG } from '@/config/api';

export interface DBCToken {
  symbol: string;
  holders: string;
  address: string;
  name: string;
  poolSize: string;
  totalSupply: string;
}

interface DBCTokenResponse {
  items: DBCToken[];
}

export const fetchDBCTokens = async (): Promise<DBCToken[]> => {
  // 设置超时和重试参数
  const TIMEOUT_MS = 3000; // 3秒超时
  const MAX_RETRIES = 2;   // 最多重试2次
  
  // 封装fetch请求，添加超时控制
  const fetchWithTimeout = async (url: string, options = {}, timeout = TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.DBCSCAN.BASE_URL}${API_CONFIG.DBCSCAN.ENDPOINTS.TOKENS}`
      );
      
      if (!response.ok) {
        throw new Error(`获取DBC tokens失败: ${response.status} ${response.statusText}`);
      }
      
      const data: DBCTokenResponse = await response.json();
      return data.items;
    } catch (error) {
      retries++;
      console.error(`获取DBC tokens失败 (尝试 ${retries}/${MAX_RETRIES + 1}):`, error);
      
      if (retries <= MAX_RETRIES) {
        // 指数退避策略，等待时间逐次增加
        await new Promise(resolve => setTimeout(resolve, 500 * retries));
      } else {
        console.error('所有DBC tokens获取尝试均失败，返回空数组');
        return []; // 返回空数组而不是抛出错误
      }
    }
  }
  
  return []; // 以防万一的保险返回
}; 