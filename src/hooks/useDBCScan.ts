import { useState, useEffect } from 'react';
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

// 封装请求方法
export const fetchDBCTokens = async (): Promise<DBCToken[]> => {
  try {
    const response = await fetch(`${API_CONFIG.DBCSCAN.BASE_URL}${API_CONFIG.DBCSCAN.ENDPOINTS.TOKENS}`);
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
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_CONFIG.DBCSCAN.BASE_URL}${API_CONFIG.DBCSCAN.ENDPOINTS.TOKENS}`);
        const data = await response.json();
        setTokens(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { tokens, loading, error };
}; 