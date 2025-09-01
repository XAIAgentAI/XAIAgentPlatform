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
    options: RequestInit & { noAuth?: boolean; maxRetries?: number } = {}
  ): Promise<T> {
    const { noAuth, maxRetries = 0, ...requestOptions } = options;
    
    // 确保endpoint不以斜杠结尾，除非是根路径
    const normalizedEndpoint = endpoint !== '/' && endpoint.endsWith('/') 
      ? endpoint.slice(0, -1) 
      : endpoint;
      
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(!noAuth && this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...requestOptions.headers,
    });

    console.log(`Making request to ${normalizedEndpoint}:`, {
      headers: Object.fromEntries(headers.entries()),
      method: requestOptions.method || 'GET',
    });

    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`/api${normalizedEndpoint}`, {
          ...requestOptions,
          headers,
        });

        const data: ApiResponse<T> = await response.json();
        console.log(`Response from ${normalizedEndpoint}:`, data);

        if (!response.ok) {
          console.error(`Request to ${normalizedEndpoint} failed:`, data);
          if (response.status === 401) {
            // 清除无效的 token
            this.clearToken();
            localStorage.removeItem('token');
          }
          throw new ApiError(data.code, data.message, data.data);
        }

        return data.data;
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          throw error;
        }
        // 如果不是最后一次尝试，等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    throw lastError;
  }

  // Auth
  async getNonce() {
    // 对于 nonce 请求，不进行重试
    return this.request<{ nonce: string; message: string }>('/auth/nonce', { 
      noAuth: true,
      maxRetries: 0 
    });
  }

  async connectWallet(params: { address: string; signature: string; message: string }) {
    // 对于钱包连接请求，不进行重试
    return this.request<{ token: string; address: string }>('/auth/wallet-connect', {
      method: 'POST',
      body: JSON.stringify(params),
      noAuth: true,
      maxRetries: 0
    });
  }

  async connectWalletNoSig(params: { address: string }) {
    // 无需签名的钱包连接，直接使用地址登录
    return this.request<{ token: string; address: string }>('/auth/wallet-connect-no-sig', {
      method: 'POST',
      body: JSON.stringify(params),
      noAuth: true,
      maxRetries: 0
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