import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { currentChain, currentNetwork, dbcMainnet, dbcTestnet } from './networks';

// 导出所有需要的配置
export { currentChain, dbcMainnet, dbcTestnet };

// wagmi 配置
export const config = createConfig({
  chains: [dbcTestnet, dbcMainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [dbcTestnet.id]: http(currentNetwork.rpcUrl),
    [dbcMainnet.id]: http(currentNetwork.rpcUrl),
  },
});