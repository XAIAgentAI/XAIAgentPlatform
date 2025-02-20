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

export const useDBCPrice = () => {
  const [price, setPrice] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('https://dbchaininfo.congtu.cloud/query/dbc_info?language=CN');
        if (!response.ok) {
          throw new Error('Failed to fetch DBC price');
        }
        const data: DBCPriceResponse = await response.json();
        if (data.status === 1) {
          setPrice(data.content.dbc_price.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch DBC price');
        console.error('Failed to fetch DBC price:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    // 每30秒更新一次价格
    const timer = setInterval(fetchPrice, 30000);

    return () => clearInterval(timer);
  }, []);

  return { price, loading, error };
}; 