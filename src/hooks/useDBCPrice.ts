import { useState, useEffect } from 'react';

interface DBCPriceResponse {
  status: number;
  code: string;
  msg: string;
  content: {
    dbc_price: number;
    update_time: string | null;
    percent_change_24h: number;
  };
}

interface DBCPriceInfo {
  priceUsd: string;
  percentChange24h: number;
}

// 独立的获取价格函数
export const fetchDBCPrice = async (): Promise<DBCPriceInfo> => {
  try {
    const response = await fetch('https://dbchaininfo.congtu.cloud/query/dbc_info?language=CN');
    if (!response.ok) {
      throw new Error('获取 DBC 价格失败：网络请求错误');
    }
    const data: DBCPriceResponse = await response.json();
    
    // 检查状态码是否为1，code为10502
    if (data.status === 1 && data.code === "10502") {
      return {
        priceUsd: data.content.dbc_price.toString(),
        percentChange24h: data.content.percent_change_24h
      };
    }
    
    throw new Error(`获取 DBC 价格失败：${data.msg || '未知错误'}`);
  } catch (err) {
    console.error('获取 DBC 价格失败:', err);
    return {
      priceUsd: "0",
      percentChange24h: 0
    };
  }
};

// React Hook
export const useDBCPrice = () => {
  const [priceUsd, setPriceUsd] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [percentChange24h, setPercentChange24h] = useState<number>(0);

  useEffect(() => {
    const updatePrice = async () => {
      try {
        const priceInfo = await fetchDBCPrice();
        setPriceUsd(priceInfo.priceUsd);
        setPercentChange24h(priceInfo.percentChange24h);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取 DBC 价格失败');
      } finally {
        setLoading(false);
      }
    };

    updatePrice();

    // 每30秒更新一次价格
    const timer = setInterval(updatePrice, 30000);

    return () => clearInterval(timer);
  }, []);

  return { 
    dbcPriceUsd: parseFloat(priceUsd), 
    dbcPercentChange24h: percentChange24h, 
    loading, 
    error,
  };
}; 