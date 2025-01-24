// config/index.tsx

import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { type AppKitNetwork } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
export const projectId = '6b35795ceb51cccc8536db15be92afa0'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const dbcTestnet = {
  id: 19850818,
  name: "DeepBrainChain Testnet",
  // network: "dbcTestnet",
  nativeCurrency: {
    name: "tDBC",
    symbol: "tDBC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.dbcwallet.io'] },
    // public: { http: ['https://rpc-testnet.dbcwallet.io'] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://test.dbcscan.io",
    },
  },

} as const;

export const networks = [dbcTestnet, mainnet] as [AppKitNetwork, ...AppKitNetwork[]]

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