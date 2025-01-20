import { ApiError } from './error';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { noAuth?: boolean } = {}
  ): Promise<T> {
    const { noAuth, ...requestOptions } = options;
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(!noAuth && this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...requestOptions.headers,
    });

    console.log(`Making request to ${endpoint}:`, {
      headers: Object.fromEntries(headers.entries()),
      method: requestOptions.method || 'GET',
    });

    const response = await fetch(`/api${endpoint}`, {
      ...requestOptions,
      headers,
    });

    const data: ApiResponse<T> = await response.json();
    console.log(`Response from ${endpoint}:`, data);

    if (!response.ok) {
      console.error(`Request to ${endpoint} failed:`, data);
      if (response.status === 401) {
        // 清除无效的 token
        this.clearToken();
        localStorage.removeItem('token');
      }
      throw new ApiError(data.code, data.message, data.data);
    }

    return data.data;
  }

  // Auth
  async getNonce() {
    return this.request<{ nonce: string; message: string }>('/auth/nonce', { noAuth: true });
  }

  async connectWallet(params: { address: string; signature: string; message: string }) {
    return this.request<{ token: string; address: string }>('/auth/wallet-connect', {
      method: 'POST',
      body: JSON.stringify(params),
      noAuth: true,
    });
  }

  async disconnect() {
    return this.request('/auth/disconnect', {
      method: 'POST',
    });
  }

  // Agents
  async getAgents(params?: {
    page?: number;
    pageSize?: number;
    searchKeyword?: string;
    category?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
    }
    return this.request<{
      items: Array<{
        id: string;
        name: string;
        description: string;
        category: string;
        avatar: string;
        status: string;
        capabilities: string[];
        rating: number;
        usageCount: number;
        creatorAddress: string;
        reviewCount: number;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/agents?${searchParams.toString()}`, { noAuth: true });
  }

  async getAgentById(id: string) {
    return this.request<{
      id: string;
      name: string;
      description: string;
      longDescription: string;
      category: string;
      avatar: string;
      status: string;
      capabilities: string[];
      rating: number;
      usageCount: number;
      creatorAddress: string;
      createdAt: string;
      updateAt: string;
      examples: Array<{
        title: string;
        description: string;
        prompt: string;
      }>;
      reviewCount: number;
      historyCount: number;
    }>(`/agents/${id}`, { noAuth: true });
  }

  async createAgent(data: {
    name: string;
    description: string;
    longDescription?: string;
    category: string;
    avatar?: string;
    capabilities: string[];
    examples?: Array<{
      title: string;
      description: string;
      prompt: string;
    }>;
  }) {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgent(
    id: string,
    data: {
      name: string;
      description: string;
      longDescription?: string;
      category: string;
      avatar?: string;
      capabilities: string[];
      examples?: Array<{
        title: string;
        description: string;
        prompt: string;
      }>;
    }
  ) {
    return this.request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string) {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Reviews
  async getAgentReviews(agentId: string, params?: { page?: number; pageSize?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
    }
    return this.request<{
      reviews: Array<{
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        user: {
          address: string;
          nickname: string;
          avatar: string;
        };
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/agents/${agentId}/reviews?${searchParams.toString()}`, { noAuth: true });
  }

  async createAgentReview(agentId: string, data: { rating: number; comment: string }) {
    return this.request(`/agents/${agentId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User
  async getUserProfile() {
    return this.request<{
      id: string;
      address: string;
      nickname?: string;
      avatar?: string;
      preferences: Record<string, any>;
      createdAt: string;
      agentCount: number;
      reviewCount: number;
    }>('/user/profile');
  }

  async updateUserSettings(data: {
    nickname?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  }) {
    return this.request('/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserAssets() {
    return this.request<{
      tokens: Array<{
        symbol: string;
        balance: string;
        usdValue: number;
      }>;
      nfts: Array<{
        contractAddress: string;
        tokenId: string;
        metadata: Record<string, any>;
      }>;
    }>('/user/assets');
  }

  // Upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<{ url: string }>('/upload', {
      method: 'POST',
      headers: {}, // Let browser set content-type for FormData
      body: formData,
    });
  }
}

export const apiClient = new ApiClient(); 