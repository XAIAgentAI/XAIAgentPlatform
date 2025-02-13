import { type Chain } from 'viem';

// 环境判断
export const isTestnet = process.env.NEXT_PUBLIC_IS_TEST_ENV === "true";

// 测试网配置
export const testnetConfig = {
  chainId: 19850818,
  name: "DeepBrainChain Testnet",
  symbol: "tDBC",
  rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL || 'https://rpc-testnet.dbcwallet.io',
  blockExplorerUrl: process.env.NEXT_PUBLIC_TESTNET_EXPLORER_URL || "https://test.dbcscan.io",
} as const;

// 主网配置
export const mainnetConfig = {
  chainId: 19880818,
  name: "DeepBrainChain Mainnet",
  symbol: "DBC",
  rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://rpc.dbcwallet.io',
  blockExplorerUrl: process.env.NEXT_PUBLIC_MAINNET_EXPLORER_URL || "https://dbcscan.io",
} as const;

// 根据环境变量选择当前配置
export const currentNetwork = isTestnet ? testnetConfig : mainnetConfig;

// 测试网 Chain 配置
export const dbcTestnet = {
  id: testnetConfig.chainId,
  name: testnetConfig.name,
  nativeCurrency: {
    name: testnetConfig.symbol,
    symbol: testnetConfig.symbol,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [testnetConfig.rpcUrl] },
    public: { http: [testnetConfig.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'DBCScan', url: testnetConfig.blockExplorerUrl },
  },
  testnet: true,
} as const satisfies Chain;

// 主网 Chain 配置
export const dbcMainnet = {
  id: mainnetConfig.chainId,
  name: mainnetConfig.name,
  nativeCurrency: {
    name: mainnetConfig.symbol,
    symbol: mainnetConfig.symbol,
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [mainnetConfig.rpcUrl] },
    public: { http: [mainnetConfig.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'DBCScan', url: mainnetConfig.blockExplorerUrl },
  },
  testnet: false,
} as const satisfies Chain;

// 当前使用的 Chain 配置
export const currentChain = isTestnet ? dbcTestnet : dbcMainnet;

// 工具函数：获取当前网络的区块浏览器URL
export const getExplorerUrl = () => currentNetwork.blockExplorerUrl;

// 工具函数：获取交易URL
export const getTransactionUrl = (hash: string) => `${getExplorerUrl()}/tx/${hash}`;



// 工具函数：确保是主网环境
export const ensureMainnet = () => {
  if (isTestnet) {
    throw new Error('This feature is only available on mainnet');
  }
  return true;
};