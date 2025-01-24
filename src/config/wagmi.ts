import { http, createConfig } from 'wagmi';
import { type Chain } from 'viem';
import { defaultNetwork } from './networks';
import { injected } from 'wagmi/connectors';

const dbcTestnet = {
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

export const config = createConfig({
  chains: [dbcTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [defaultNetwork.chainId]: http(defaultNetwork.rpcUrl),
  },
}); 