/**
 * 服务端钱包配置
 */

import type { DistributionConfig, DistributionAddresses } from './types';

// 分配比例配置
export const DISTRIBUTION_RATIOS: DistributionConfig = {
  CREATOR: 0.33,    // 33%
  IAO: 0.15,        // 15%
  LIQUIDITY: 0.10,  // 10%
  AIRDROP: 0.02,    // 2%
  MINING: 0.40      // 40%
} as const;

// 固定分配地址
export const DISTRIBUTION_ADDRESSES: DistributionAddresses = {
  LIQUIDITY: '0xfCE792dd602fA70143e43e7556e8a92D762bA9FC',  // DBCSwap流动性地址（待配置）
  AIRDROP: '0x8ef54e57dFB0b84Eb909072B699057Ef9517704a',    // 空投地址
} as const;

// 服务端钱包私钥（从环境变量获取）
export const getServerWalletPrivateKey = (): `0x${string}` => {
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY environment variable is required');
  }

  // 确保私钥格式正确
  return (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
};

// AI挖矿合约地址（固定地址）
export const getMiningContractAddress = (): `0x${string}` => {
  return '0x6B0B8F74aaCe9731a2f5fc45c64bbd72075dBfDB';  // AI模型挖矿合约
};

// 获取平台钱包地址（从私钥推导）
export const getServerWalletAddress = (): `0x${string}` => {
  const { privateKeyToAccount } = require('viem/accounts');
  const privateKey = getServerWalletPrivateKey();
  const account = privateKeyToAccount(privateKey);
  return account.address;
};

// 验证所有必需的环境变量
export const validateEnvironmentVariables = (): void => {
  const requiredVars = [
    'SERVER_WALLET_PRIVATE_KEY'
    // DBCSWAP_LIQUIDITY_ADDRESS 暂时不验证，因为会在分配时跳过
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};
