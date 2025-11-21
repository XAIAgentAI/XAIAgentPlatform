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
  // 捕获同步错误
  window.addEventListener('error', (event) => {
    console.error('捕获到全局错误:', event);

    // 捕获订阅冲突错误
    if (event.message?.includes('Restore will override. subscription')) {
      console.log('捕获到订阅冲突错误，正在处理...');
      event.preventDefault();
      connectionManager.clearSubscriptions();

      if (!connectionManager.hasRestoredConnection) {
        connectionManager.markConnectionRestored();
        console.log('正在重置连接状态...');

        setTimeout(() => {
          if (wagmiAdapter && wagmiAdapter.wagmiConfig) {
            console.log('重置连接完成');
            connectionManager.hasRestoredConnection = false;
          }
        }, 500);
      }

      return true;
    }

    // 捕获其他钱包连接相关错误
    if (event.message?.includes('wallet') ||
        event.message?.includes('WalletConnect') ||
        event.message?.includes('provider')) {
      console.warn('钱包连接错误:', event.message);
      // 不阻止这些错误的传播，让 ErrorBoundary 处理
      // 但记录到控制台供调试
    }
  });

  // 捕获未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    console.error('捕获到未处理的 Promise rejection:', event.reason);

    // Axios 请求超时或网络错误
    if (event.reason?.name === 'AxiosError' || event.reason?.isAxiosError) {
      console.warn('API 请求失败:', event.reason.message);
      // 阻止错误冒泡,避免崩溃页面
      event.preventDefault();
      return;
    }

    // 钱包相关的 Promise rejection
    if (event.reason?.message?.includes('User rejected') ||
        event.reason?.message?.includes('User denied') ||
        event.reason?.code === 4001) {
      console.log('用户拒绝了钱包操作');
      event.preventDefault(); // 阻止默认的错误处理
      return;
    }

    // WalletConnect 相关错误
    if (event.reason?.message?.includes('WalletConnect') ||
        event.reason?.message?.includes('QR Code')) {
      console.log('WalletConnect 连接错误');
      event.preventDefault();
      return;
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

// 获取当前网站的域名和协议
const getOrigin = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'https://app.xaiagent.io'; // 默认值，服务器端渲染时使用
}

// Set up metadata
const metadata = {
    name: 'xaiagent',
    description: 'xaiagent',
    url: getOrigin(), // 动态使用当前网站的域名
    icons: [`${getOrigin()}/logo.png`] // 动态构建图标URL
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
