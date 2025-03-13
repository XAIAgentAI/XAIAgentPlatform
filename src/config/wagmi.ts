import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { currentChain, currentNetwork, dbcMainnet, dbcTestnet, testnetConfig, mainnetConfig, isTestnet } from './networks';

// 导出所有需要的配置
export { currentChain, dbcMainnet, dbcTestnet };

// // wagmi 配置
// export const config = createConfig({
//   chains: [isTestnet ? dbcTestnet : dbcMainnet], // 根据环境只允许一个网络
//   connectors: [
//     injected(),
//   ],
//   transports: {
//     [dbcTestnet.id]: http(testnetConfig.rpcUrl),
//     [dbcMainnet.id]: http(mainnetConfig.rpcUrl),
//   },
// });