// context/index.tsx
'use client'

import { wagmiAdapter, projectId, networks } from '../config/index'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, avalanche, base, optimism, polygon } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

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

// Create the modal
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
    // 禁用所有钱包，然后只通过 includeWalletIds 启用指定钱包
    // allWallets: 'HIDE',
    // 排除 Trust Wallet 选项 - 使用完整的钱包 ID
    excludeWalletIds: ['4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'],
    // 只包含我们想要的钱包，这样可以更好地控制显示的钱包
    // includeWalletIds: [
    //     'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    //     '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    //     '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66', // TokenPocket (TP)
    //     'ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef'  // imToken (IM)
    // ]
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
    const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}

export default ContextProvider
