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