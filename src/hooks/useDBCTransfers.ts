import { useState, useEffect } from 'react';

interface TransferItem {
  block_hash: string;
  from: {
    hash: string;
    is_contract: boolean;
  };
  to: {
    hash: string;
    is_contract: boolean;
  };
  log_index: string;
  method: string;
  timestamp: string;
  total: {
    decimals: string;
    value: string;
  };
  tx_hash: string;
  type: string;
}

interface TransfersResponse {
  items: TransferItem[];
  next_page_params: {
    block_number: number;
    index: number;
  } | null;
}

export const useDBCTransfers = (tokenAddress: string | null) => {
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      if (!tokenAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`https://www.dbcscan.io/api/v2/tokens/${tokenAddress}/transfers`);
        if (!response.ok) {
          throw new Error('Failed to fetch transfers data');
        }
        const data: TransfersResponse = await response.json();
        setTransfers(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, [tokenAddress]);

  return { transfers, loading, error };
}; 