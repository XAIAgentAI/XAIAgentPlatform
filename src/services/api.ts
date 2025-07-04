import axios from 'axios';
import { LocalAgent } from '@/types/agent';
import { getBatchTokenPrices } from './swapService';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOST_URL + '/api' || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface GetAgentsParams {
  page?: number;
  pageSize?: number;
  searchKeyword?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  forceRefresh?: boolean;
}

interface GetAgentsData {
  items: LocalAgent[];
  total: number;
  page: number;
  pageSize: number;
}

export const agentAPI = {
  // 获取所有 agents
  getAllAgents: async (params: GetAgentsParams = {}): Promise<ApiResponse<GetAgentsData>> => {
    const { 
      page = 1, 
      pageSize = 20, 
      searchKeyword, 
      category, 
      status,
      sortBy,
      sortOrder = 'desc',
      forceRefresh
    } = params;

    console.log('getAllAgents params', params);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(searchKeyword && { searchKeyword }),
      ...(category && { category }),
      ...(status && { status }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...(forceRefresh && { forceRefresh: 'true' }),
    });

    const response = await api.get(`/agents?${queryParams}`);
    return response.data;
  },
  
//   // 通过ID获取单个agent
//   getAgentById: async (id: string): Promise<ApiResponse<LocalAgent>> => {
//     const response = await api.get(`/agents/${id}`);
//     return response.data;
//   },
// };


  // 获取单个 agent
  getAgentById: async (id: string): Promise<ApiResponse<LocalAgent>> => {
    console.log("🔍 [DEBUG] getAgentById called with id:", id);

    const response = await api.get(`/agents/${id}`);
    console.log("🔍 [DEBUG] API response:", response);
    console.log("🔍 [DEBUG] Response data:", response.data);

    // 检查响应数据
    if (!response.data) {
      console.error("❌ [ERROR] No response data");
      throw new Error('No response data');
    }

    if (response.data.code !== 200) {
      console.error("❌ [ERROR] API returned error code:", response.data.code, response.data.message);
      throw new Error(response.data?.message || 'API returned error');
    }

    if (!response.data.data) {
      console.error("❌ [ERROR] No agent data in response");
      throw new Error('No agent data in response');
    }

    const agentData = response.data.data;
    console.log("🔍 [DEBUG] Agent data:", agentData);

    let poolData = {};

    // 只有当agent有symbol和tokenAddress时才获取池子数据
    if (agentData.symbol && agentData.tokenAddress) {
      try {
        console.log("🔍 [DEBUG] Fetching pool data for:", agentData.symbol, agentData.tokenAddress);
        const poolsResponse = await getBatchTokenPrices([{
          symbol: agentData.symbol,
          address: agentData.tokenAddress,
        }]);
        poolData = poolsResponse[agentData.symbol] || {};
        console.log("🔍 [DEBUG] Pool data fetched:", poolData);
      } catch (error) {
        console.warn("⚠️ [WARN] Failed to fetch pool data:", error);
        // 继续执行，不让池子数据获取失败影响整个请求
      }
    } else {
      console.log("🔍 [DEBUG] Skipping pool data fetch - missing symbol or tokenAddress");
    }

    const result = {
      ...response.data,
      data: {
        ...agentData,
        ...poolData,
      }
    };

    console.log("🔍 [DEBUG] Final result:", result);
    return result;
  },

  // 获取实时价格数据
  getAgentPrices: async (): Promise<Record<string, { marketCap: string; change24h: string; volume24h: string }>> => {
    const response = await api.get('/agents/prices');
    return response.data;
  },
};
