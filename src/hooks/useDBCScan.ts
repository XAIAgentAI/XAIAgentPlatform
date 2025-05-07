import { useState, useEffect } from 'react';
import { fetchDBCTokens, DBCToken } from '@/services/dbcScan';
export const useDBCScan = () => {
  const [tokens, setTokens] = useState<DBCToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const items = await fetchDBCTokens();
        setTokens(items);
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