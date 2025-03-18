import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

// Interface for a single holder's data
interface HolderItem {
  address: {
    hash: string;
    is_contract: boolean;
  };
  value: string;
}

// Interface for the API response
interface HoldersResponse {
  items: HolderItem[];
  next_page_params: {
    address_hash: string;
    items_count: number;
    value: string;
  } | null;
}

export const useDBCHolders = (tokenAddress: string | null) => {
  const [holdersData, setHoldersData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHoldersData = async () => {
      if (!tokenAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_CONFIG.DBCSCAN.BASE_URL}${API_CONFIG.DBCSCAN.ENDPOINTS.TOKEN_HOLDERS(tokenAddress)}`);
        const data = await response.json();

        setHoldersData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHoldersData();
  }, [tokenAddress]);

  return { holdersData, loading, error };
}; 