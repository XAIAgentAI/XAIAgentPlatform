import { useState, useEffect } from 'react';

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

// 封装请求方法
export const fetchDBCTokens = async (): Promise<DBCToken[]> => {
  try {
    const response = await fetch('https://www.dbcscan.io/api/v2/tokens');
    if (!response.ok) {
      throw new Error('Failed to fetch tokens');
    }
    const data: DBCTokenResponse = await response.json();
    return data.items;
  } catch (err) {
    console.error('Error fetching DBC tokens:', err);
    throw err;
  }
};

export const useDBCScan = () => {
  const [tokens, setTokens] = useState<DBCToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTokens = async () => {
      try {
        setLoading(true);
        const data = await fetchDBCTokens();
        setTokens(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    };

    getTokens();
  }, []);

  return { tokens, loading, error };
}; 