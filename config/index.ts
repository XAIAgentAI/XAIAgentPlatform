// config/index.tsx

import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import { type AppKitNetwork } from '@reown/appkit/networks'
import { dbcMainnet, dbcTestnet, isTestnet } from '@/config/networks'

// Get projectId from https://cloud.reown.com
export const projectId = '6b35795ceb51cccc8536db15be92afa0'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// 根据环境只导出对应的网络
export const networks = [isTestnet ? dbcTestnet : dbcMainnet] as [AppKitNetwork, ...AppKitNetwork[]]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig