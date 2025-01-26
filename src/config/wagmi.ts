import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { dbcTestnet, defaultNetwork } from './networks';

export { dbcTestnet };

export const config = createConfig({
  chains: [dbcTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [defaultNetwork.chainId]: http(defaultNetwork.rpcUrl),
  },
});