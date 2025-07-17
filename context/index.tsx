// context/index.tsx
'use client'

import { wagmiAdapter, projectId, networks } from '../config/index'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, avalanche, base, optimism, polygon } from '@reown/appkit/networks'
import React, { type ReactNode, useEffect } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// 添加连接恢复和错误处理工具
const connectionManager = {
  hasRestoredConnection: false,
  subscriptionIds: new Set(),
  
  // 清理所有订阅
  clearSubscriptions() {
    this.subscriptionIds.clear();
  },
  
  // 标记连接已恢复
  markConnectionRestored() {
    this.hasRestoredConnection = true;
  }
};

// 全局错误处理函数，捕获订阅冲突错误
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('捕获到错误:', event);
    if (event.message?.includes('Restore will override. subscription')) {
      console.log('捕获到订阅冲突错误，正在处理...');
      // 阻止错误冒泡
      event.preventDefault();
      
      // 清理订阅状态
      connectionManager.clearSubscriptions();
      
      // 如果在5秒内没有其他操作，刷新连接
      if (!connectionManager.hasRestoredConnection) {
        connectionManager.markConnectionRestored();
        console.log('正在重置连接状态...');
        
        // 延迟执行，避免连续多次重置
        setTimeout(() => {
          // 重置连接状态，但不刷新页面
          if (wagmiAdapter && wagmiAdapter.wagmiConfig) {
            console.log('重置连接完成');
            connectionManager.hasRestoredConnection = false;
          }
        }, 500);
      }
      
      return true;
    }
  });
}

// Set up queryClient with retry configuration
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false, // 禁用自动重试
            retryOnMount: false, // 组件重新挂载时不重试
            refetchOnWindowFocus: false, // 窗口获得焦点时不重试
            refetchOnReconnect: false, // 重新连接时不重试
        },
        mutations: {
            retry: false, // 禁用 mutation 的自动重试
        },
    },
})

if (!projectId) {
    throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
    name: 'xaiagent',
    description: 'xaiagent',
    url: 'https://app.xaiagent.io', // origin must match your domain & subdomain
    icons: ['https://assets.reown.com/reown-profile-pic.png']
}

// Create the modal with improved connection handling
const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: networks,
    defaultNetwork: networks[0],
    metadata: metadata,
    features: {
        analytics: true,
        // 禁用邮箱登录
        email: false,
        // 禁用社交登录（包括 Google、X、Discord 等）
        socials: false,
    },
    // 排除 Trust Wallet 选项 - 使用完整的钱包 ID
    excludeWalletIds: ['4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'],
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    // 添加组件卸载时的清理逻辑
    useEffect(() => {
        return () => {
            // 组件卸载时清理订阅
            connectionManager.clearSubscriptions();
        };
    }, []);

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider
