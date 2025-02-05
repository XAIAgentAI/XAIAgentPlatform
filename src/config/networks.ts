import { type Chain } from 'viem';

export const defaultNetwork = {
  chainId: 19850818,
  name: "DeepBrainChain Testnet",
  symbol: "tDBC",
  rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL || 'https://rpc-testnet.dbcwallet.io',
  blockExplorerUrl: process.env.NEXT_PUBLIC_TESTNET_EXPLORER_URL || "https://test.dbcscan.io",
} as const;

export const dbcTestnet = {
  id: defaultNetwork.chainId,
  name: defaultNetwork.name,
  nativeCurrency: {
    name: defaultNetwork.symbol,
    symbol: defaultNetwork.symbol,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [defaultNetwork.rpcUrl] },
    public: { http: [defaultNetwork.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'DBCScan', url: defaultNetwork.blockExplorerUrl },
  },
  testnet: true,
} as const satisfies Chain;

export const dbcMainnet = {
  id: 19880818,
  name: 'DeepBrainChain Mainnet',
  nativeCurrency: {
    name: 'DBC',
    symbol: 'DBC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://rpc.dbcwallet.io'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://rpc.dbcwallet.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'DBCScan',
      url: process.env.NEXT_PUBLIC_MAINNET_EXPLORER_URL || 'https://dbcscan.io',
    },
  },
  testnet: false,
} as const satisfies Chain;