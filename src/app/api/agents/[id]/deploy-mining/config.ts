/**
 * 挖矿合约配置管理
 */

export interface MiningConfig {
  // 部署API配置
  deploymentApi: {
    url: string;
    auth: string;
  };
  
  // 注册合约配置
  registryContract: {
    address: `0x${string}`;
    functionName: string;
    functionSignature: string;
    explorerUrl: string;
  };
  
  // 默认参数配置
  defaultParams: {
    stakingType: number;
    rewardAmountPerYear: string;
  };
}

/**
 * 挖矿合约配置
 */
export const MINING_CONFIG: MiningConfig = {
  deploymentApi: {
    url: 'http://54.179.233.88:8070/deploy/staking',
    auth: 'Basic YWRtaW46MTIz'
  },
  
  registryContract: {
    address: '0xa7B9f404653841227AF204a561455113F36d8EC8',
    functionName: 'registerProjectStakingContract',
    functionSignature: 'b5cf512f',
    explorerUrl: 'https://www.dbcscan.io/zh/address/0xa7B9f404653841227AF204a561455113F36d8EC8?tab=write_proxy'
  },
  
  defaultParams: {
    stakingType: 2,
    rewardAmountPerYear: '2000000000000000000000000000' // 2000万个代币 (20亿 * 10^18)
  }
};

/**
 * 挖矿合约部署参数
 */
export interface MiningDeploymentRequest {
  nft: string;
  owner: string;
  project_name: string;
  reward_amount_per_year?: string; // 可选，使用默认值
  reward_token: string;
}

/**
 * 挖矿合约注册参数
 */
export interface MiningRegistrationRequest {
  project_name: string;
  staking_type?: number; // 可选，使用默认值
  contract_address: string;
}

/**
 * API响应格式
 */
export interface MiningApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 部署响应数据
 */
export interface MiningDeploymentResponse {
  proxy_address: string;
}

/**
 * 验证挖矿部署参数
 */
export function validateMiningDeploymentParams(params: MiningDeploymentRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.nft || !params.nft.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('NFT合约地址格式无效');
  }
  
  if (!params.owner || !params.owner.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('拥有者地址格式无效');
  }
  
  if (!params.project_name || params.project_name.trim().length === 0) {
    errors.push('项目名称不能为空');
  }
  
  if (!params.reward_token || !params.reward_token.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('奖励代币地址格式无效');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证挖矿注册参数
 */
export function validateMiningRegistrationParams(params: MiningRegistrationRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.project_name || params.project_name.trim().length === 0) {
    errors.push('项目名称不能为空');
  }
  
  if (!params.contract_address || !params.contract_address.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push('合约地址格式无效');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 构建完整的部署参数
 */
export function buildDeploymentParams(params: MiningDeploymentRequest): MiningDeploymentRequest & {
  reward_amount_per_year: string;
} {
  return {
    ...params,
    reward_amount_per_year: params.reward_amount_per_year || MINING_CONFIG.defaultParams.rewardAmountPerYear
  };
}

/**
 * 构建完整的注册参数
 */
export function buildRegistrationParams(params: MiningRegistrationRequest): MiningRegistrationRequest & {
  staking_type: number;
} {
  return {
    ...params,
    staking_type: params.staking_type || MINING_CONFIG.defaultParams.stakingType
  };
}