import { type Chain } from 'viem';

export const defaultNetwork = {
  chainId: 19850818,
  name: "DeepBrainChain Testnet",
  symbol: "tDBC",
  rpcUrl: 'https://rpc-testnet.dbcwallet.io',
  blockExplorerUrl: "https://test.dbcscan.io",
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