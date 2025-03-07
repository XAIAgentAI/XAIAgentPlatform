import axios from 'axios';
import { LocalAgent } from '@/types/agent';

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
    const { page = 1, pageSize = 20, searchKeyword, category, status } = params;

    console.log('getAllAgents params', params);
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(searchKeyword && { searchKeyword }),
      ...(category && { category }),
      ...(status && { status }),
    });

    const response = await api.get(`/agents?${queryParams}`);
    return response.data;
  },

  // 获取单个 agent
  getAgentById: async (id: number): Promise<LocalAgent> => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },

  // 获取实时价格数据
  getAgentPrices: async (): Promise<Record<string, { marketCap: string; change24h: string; volume24h: string }>> => {
    const response = await api.get('/agents/prices');
    return response.data;
  },
};

export default api; 