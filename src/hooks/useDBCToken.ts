import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

interface TokenDetail {
  address: string;
  circulating_market_cap: number | null;
  decimals: string;
  exchange_rate: number | null;
  holders: string;
  icon_url: string | null;
  name: string;
  symbol: string;
  total_supply: string;
  type: string;
  volume_24h: number | null;
}

export const useDBCToken = (tokenAddress: string | null) => {
  const [tokenData, setTokenData] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_CONFIG.DBCSCAN.BASE_URL}${API_CONFIG.DBCSCAN.ENDPOINTS.TOKEN_DETAIL(tokenAddress)}`);
        const data = await response.json();
        setTokenData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenAddress]);

  return { tokenData, loading, error };
}; 