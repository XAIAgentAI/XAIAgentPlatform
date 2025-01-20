# XAIAgent 后端接口文档

## 目录
- [认证接口](#认证接口)
- [Agent相关接口](#agent相关接口)
- [用户相关接口](#用户相关接口)
- [文件上传接口](#文件上传接口)
- [通用响应格式](#通用响应格式)

## 认证接口

### Web3钱包认证

#### 1. 获取认证消息
```typescript
GET /api/auth/nonce

Response: {
  nonce: string;
  message: string;
}
```

#### 2. 钱包连接与认证
```typescript
POST /api/auth/wallet-connect
Body: {
  address: string;
  signature: string;
  message: string;
}

Response: {
  code: 200,
  message: "登录成功",
  data: {
    token: string;
    address: string;
  }
}
```

#### 3. 验证钱包签名
```typescript
POST /api/auth/verify-signature
Body: {
  address: string;
  signature: string;
}

Response: {
  code: 200,
  message: "验证成功",
  data: {
    isValid: boolean;
  }
}
```

#### 4. 断开钱包连接
```typescript
POST /api/auth/disconnect

Response: {
  code: 200,
  message: "已断开连接"
}
```

## Agent相关接口

### Agent列表

#### 1. 获取Agent列表
```typescript
GET /api/agents
参数: {
  page?: number;
  pageSize?: number;
  searchKeyword?: string;
  filter?: {
    category?: string;
    status?: string;
  }
}

Response: {
  code: 200,
  data: {
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
  }
}
```

#### 2. 获取Agent分类
```typescript
GET /api/agents/categories

Response: {
  code: 200,
  data: {
    categories: Array<{
      id: string;
      name: string;
      count: number;
    }>
  }
}
```

#### 3. 获取热门/推荐Agent
```typescript
GET /api/agents/featured

Response: {
  code: 200,
  data: {
    featured: Array<AgentItem>
  }
}
```

### Agent详情

#### 1. 获取Agent详细信息
```typescript
GET /api/agents/:id

Response: {
  code: 200,
  data: {
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
  }
}
```

#### 2. 创建Agent
```typescript
POST /api/agents
Body: {
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

Response: {
  code: 200,
  message: "创建成功",
  data: Agent;
}
```

#### 3. 更新Agent
```typescript
PUT /api/agents/:id
Body: {
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

Response: {
  code: 200,
  message: "更新成功",
  data: Agent;
}
```

#### 4. 删除Agent
```typescript
DELETE /api/agents/:id

Response: {
  code: 200,
  message: "删除成功"
}
```

### Agent评价

#### 1. 获取Agent评价列表
```typescript
GET /api/agents/:id/reviews
参数: {
  page: number;
  pageSize: number;
}

Response: {
  code: 200,
  data: {
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
  }
}
```

#### 2. 提交Agent评价
```typescript
POST /api/agents/:id/reviews
Body: {
  rating: number;
  comment: string;
}

Response: {
  code: 200,
  message: "评价提交成功",
  data: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      address: string;
      nickname: string;
      avatar: string;
    };
  }
}
```

### Agent使用历史

#### 1. 获取Agent使用历史
```typescript
GET /api/agents/:id/history
参数: {
  page: number;
  pageSize: number;
}

Response: {
  code: 200,
  data: {
    history: Array<{
      id: string;
      action: string;
      result: string;
      timestamp: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }
}
```

#### 2. 记录Agent使用历史
```typescript
POST /api/agents/:id/history
Body: {
  action: string;
  result: string;
}

Response: {
  code: 200,
  message: "记录成功",
  data: {
    id: string;
    action: string;
    result: string;
    timestamp: string;
  }
}
```

## 用户相关接口

### 1. 获取用户信息
```typescript
GET /api/user/profile

Response: {
  code: 200,
  data: {
    id: string;
    address: string;
    nickname?: string;
    avatar?: string;
    preferences: Record<string, any>;
    createdAt: string;
    agentCount: number;
    reviewCount: number;
  }
}
```

### 2. 更新用户设置
```typescript
PUT /api/user/settings
Body: {
  nickname?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

Response: {
  code: 200,
  message: "设置更新成功",
  data: {
    id: string;
    address: string;
    nickname?: string;
    avatar?: string;
    preferences: Record<string, any>;
    createdAt: string;
    agentCount: number;
    reviewCount: number;
  }
}
```

### 3. 获取用户资产信息
```typescript
GET /api/user/assets

Response: {
  code: 200,
  data: {
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
  }
}
```

## 文件上传接口

### 上传文件
```typescript
POST /api/upload
Body: FormData {
  file: File;
}

Response: {
  code: 200,
  message: "上传成功",
  data: {
    url: string;
  }
}
```

限制说明：
- 最大文件大小：5MB
- 支持的文件类型：image/jpeg, image/png, image/gif
- 需要认证后才能上传

## 通用响应格式

### 成功响应
```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}
```

### 错误响应
```typescript
interface ApiError {
  code: number;
  message: string;
  details?: any;
}
```

## 错误码说明

- 200: 成功
- 400: 请求参数错误
- 401: 未授权
- 403: 禁止访问
- 404: 资源不存在
- 429: 请求过于频繁
- 500: 服务器内部错误

## 安全说明

1. 所有需要认证的接口都需要在请求头中携带 token：
```typescript
headers: {
  'Authorization': 'Bearer ${token}'
}
```

2. 接口访问限制：
- 未认证用户：每分钟 20 次请求
- 已认证用户：每分钟 100 次请求

3. 数据验证：
- 所有用户输入都会进行 XSS 过滤
- 敏感数据传输使用 HTTPS
- 文件上传限制大小和类型 