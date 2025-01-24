import { useState, useEffect } from 'react';

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
  const [holders, setHolders] = useState<HolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolders = async () => {
      if (!tokenAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`https://www.dbcscan.io/api/v2/tokens/${tokenAddress}/holders`);
        if (!response.ok) {
          throw new Error('Failed to fetch holders data');
        }
        const data: HoldersResponse = await response.json();
        setHolders(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHolders();
  }, [tokenAddress]);

  return { holders, loading, error };
}; 