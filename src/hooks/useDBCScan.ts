import { useState, useEffect } from 'react';

interface DBCToken {
  symbol: string;
  holders: string;
  address: string;
}

export const useDBCScan = () => {
  const [tokens, setTokens] = useState<DBCToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('https://www.dbcscan.io/api/v2/tokens');
        if (!response.ok) {
          throw new Error('Failed to fetch tokens');
        }
        const data = await response.json();
        setTokens(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { tokens, loading, error };
}; 