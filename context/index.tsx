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
    }
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
