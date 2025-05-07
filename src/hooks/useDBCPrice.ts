import { useState, useEffect } from 'react';
import { fetchDBCPrice } from '@/services/dbcPrice';

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