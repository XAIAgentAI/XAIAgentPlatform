/**
 * DBCSwap 池子管理模块
 * 用于创建池子、添加流动性等操作
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { currentChain } from '@/config/networks';
import { TickMath, nearestUsableTick } from '@uniswap/v3-sdk';
import { Token, CurrencyAmount } from '@uniswap/sdk-core';
import JSBI from 'jsbi';

// DBCSwap V3 合约地址配置
export const DBCSWAP_CONFIG = {
  V3_FACTORY: '0x34A7E09D8810d2d8620700f82b471879223F1628' as const,
  POSITION_MANAGER: '0xfCE792dd602fA70143e43e7556e8a92D762bA9FC' as const,
  XAA_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true" 
    ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a" 
    : "0x16d83F6B17914a4e88436251589194ca5ac0f452",
} as const;

// Uniswap V3 常量
const TICK_SPACINGS = {
  100: 1,    // 0.01%
  500: 10,   // 0.05%
  3000: 60,  // 0.3%
  10000: 200 // 1%
};

// 使用SDK常量
const MIN_TICK = TickMath.MIN_TICK;
const MAX_TICK = TickMath.MAX_TICK;
const MIN_SQRT_RATIO = BigInt(TickMath.MIN_SQRT_RATIO.toString());
const MAX_SQRT_RATIO = BigInt(TickMath.MAX_SQRT_RATIO.toString());

// 合约 ABI
export const ABIS = {
  ERC20: [
    {
      "inputs": [
        {"internalType": "address", "name": "spender", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "owner", "type": "address"},
        {"internalType": "address", "name": "spender", "type": "address"}
      ],
      "name": "allowance",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const,

  V3_FACTORY: [
    {
      "inputs": [
        {"internalType": "address", "name": "tokenA", "type": "address"},
        {"internalType": "address", "name": "tokenB", "type": "address"},
        {"internalType": "uint24", "name": "fee", "type": "uint24"}
      ],
      "name": "createPool",
      "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "tokenA", "type": "address"},
        {"internalType": "address", "name": "tokenB", "type": "address"},
        {"internalType": "uint24", "name": "fee", "type": "uint24"}
      ],
      "name": "getPool",
      "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const,

  POSITION_MANAGER: [
    {
      "inputs": [
        {
          "components": [
            {"internalType": "address", "name": "token0", "type": "address"},
            {"internalType": "address", "name": "token1", "type": "address"},
            {"internalType": "uint24", "name": "fee", "type": "uint24"},
            {"internalType": "int24", "name": "tickLower", "type": "int24"},
            {"internalType": "int24", "name": "tickUpper", "type": "int24"},
            {"internalType": "uint256", "name": "amount0Desired", "type": "uint256"},
            {"internalType": "uint256", "name": "amount1Desired", "type": "uint256"},
            {"internalType": "uint256", "name": "amount0Min", "type": "uint256"},
            {"internalType": "uint256", "name": "amount1Min", "type": "uint256"},
            {"internalType": "address", "name": "recipient", "type": "address"},
            {"internalType": "uint256", "name": "deadline", "type": "uint256"}
          ],
          "internalType": "struct INonfungiblePositionManager.MintParams",
          "name": "params",
          "type": "tuple"
        }
      ],
      "name": "mint",
      "outputs": [
        {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
        {"internalType": "uint128", "name": "liquidity", "type": "uint128"},
        {"internalType": "uint256", "name": "amount0", "type": "uint256"},
        {"internalType": "uint256", "name": "amount1", "type": "uint256"}
      ],
      "stateMutability": "payable",
      "type": "function"
    }
  ] as const,

  POOL: [
    {
      "inputs": [],
      "name": "slot0",
      "outputs": [
        {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
        {"internalType": "int24", "name": "tick", "type": "int24"},
        {"internalType": "uint16", "name": "observationIndex", "type": "uint16"},
        {"internalType": "uint16", "name": "observationCardinality", "type": "uint16"},
        {"internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16"},
        {"internalType": "uint8", "name": "feeProtocol", "type": "uint8"},
        {"internalType": "bool", "name": "unlocked", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"}],
      "name": "initialize",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const
};

// 类型定义
export interface PriceRange {
  initial: number;
  min: number;
  max: number;
}

export interface PoolManagerOptions {
  serverPrivateKey: string;
  fee?: number; // 手续费，默认500 (0.05%)
  slippage?: number; // 滑点，默认0.5%
  deadline?: number; // 截止时间（分钟），默认20分钟
}

export interface AddLiquidityParams {
  tokenAddress: string;
  tokenAmount: string;
  xaaAmount: string;
  priceRange: PriceRange;
}

export interface PoolManagerResult {
  success: boolean;
  poolAddress?: string;
  txHash?: string;
  tokenAmount?: string;
  xaaAmount?: string;
  blockNumber?: string;
  error?: string;
}

interface CalculatedPoolParams {
  initialPrice: number;
  minPrice: number;
  maxPrice: number;
  initialSqrtPrice: bigint;
  minTick: number;
  maxTick: number;
  currentTick?: number;
  token0: string;
  token1: string;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: bigint;
  tokenAmountWei: bigint;
  xaaAmountWei: bigint;
  token0Decimals: number;
  token1Decimals: number;
}

/**
 * 计算 sqrtPriceX96
 * 
 * 使用Uniswap SDK的TickMath.getSqrtRatioAtTick计算sqrtPriceX96
 * 
 * @param price 价格 (token1/token0)
 * @param token0Decimals token0 的小数位数
 * @param token1Decimals token1 的小数位数
 * @returns sqrtPriceX96 值
 */
function encodeSqrtRatioX96(price: number, token0Decimals: number, token1Decimals: number): bigint {
  try {
    // 1. 调整代币精度差异
    const decimalAdjustment = Math.pow(10, token0Decimals - token1Decimals);
    const adjustedPrice = price * decimalAdjustment;
    
    // 2. 从价格计算tick
    const tick = Math.log(adjustedPrice) / Math.log(1.0001);
    
    // 3. 使用最接近的整数tick
    const nearestTick = Math.round(tick);
    
    // 4. 使用TickMath从tick计算sqrtPriceX96
    // 注意：getSqrtRatioAtTick返回JSBI对象，需要转换为bigint
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(nearestTick);
    
    console.log(`🧮 sqrtPriceX96计算过程:`);
    console.log(`  - 原始价格: ${price}`);
    console.log(`  - 代币精度调整: 10^(${token0Decimals} - ${token1Decimals}) = ${decimalAdjustment}`);
    console.log(`  - 调整后价格: ${adjustedPrice}`);
    console.log(`  - 计算tick: log(${adjustedPrice})/log(1.0001) = ${tick}`);
    console.log(`  - 最接近的整数tick: ${nearestTick}`);
    console.log(`  - sqrtPriceX96 (JSBI): ${sqrtRatioX96.toString()}`);
    
    return BigInt(sqrtRatioX96.toString());
  } catch (error) {
    console.error('❌ 使用SDK计算sqrtPriceX96失败，回退到自定义方法:', error);
    
    // 回退到自定义方法
    const decimalAdjustment = Math.pow(10, token0Decimals - token1Decimals);
    const adjustedPrice = price * decimalAdjustment;
    const sqrtPrice = Math.sqrt(adjustedPrice);
    const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * Math.pow(2, 96)));
    
    console.log(`⚠️ 使用自定义方法计算sqrtPriceX96:`);
    console.log(`  - sqrtPriceX96: ${sqrtPriceX96.toString()}`);
    
    return sqrtPriceX96;
  }
}

/**
 * 从价格计算 tick
 * 
 * 使用Uniswap SDK的价格计算方法
 * 
 * @param price 价格 (token1/token0)
 * @param token0Decimals token0 的小数位数
 * @param token1Decimals token1 的小数位数
 * @returns tick 值
 */
function priceToTick(price: number, token0Decimals: number, token1Decimals: number): number {
  try {
    // 1. 调整代币精度差异
    const decimalAdjustment = Math.pow(10, token0Decimals - token1Decimals);
    const adjustedPrice = price * decimalAdjustment;
    
    // 2. 计算tick值
    const tick = Math.log(adjustedPrice) / Math.log(1.0001);
    
    console.log(`🧮 tick计算过程:`);
    console.log(`  - 原始价格: ${price}`);
    console.log(`  - 代币精度调整: 10^(${token0Decimals} - ${token1Decimals}) = ${decimalAdjustment}`);
    console.log(`  - 调整后价格: ${adjustedPrice}`);
    console.log(`  - 计算公式: log(价格)/log(1.0001)`);
    console.log(`  - 计算结果: ${tick}`);
    console.log(`  - 取整结果: ${Math.floor(tick)}`);
    
    // 向下取整，因为tick必须是整数
    return Math.floor(tick);
  } catch (error) {
    console.error('❌ 计算tick失败:', error);
    throw error;
  }
}

/**
 * 计算最接近的可用 tick
 * @param tick 目标 tick
 * @param tickSpacing tick 间距
 * @returns 最接近的可用 tick
 */
function getUsableTick(tick: number, tickSpacing: number): number {
  return nearestUsableTick(tick, tickSpacing);
}

/**
 * 池子管理器类
 */
export class PoolManager {
  private publicClient;
  private walletClient;
  private account;
  private options: Required<PoolManagerOptions>;

  constructor(options: PoolManagerOptions) {
    // 设置默认选项
    this.options = {
      fee: 500, // 0.05% 手续费
      slippage: 0.5,
      deadline: 20,
      ...options
    };

    // 验证并格式化私钥
    let formattedPrivateKey: `0x${string}`;
    if (options.serverPrivateKey.startsWith('0x')) {
      formattedPrivateKey = options.serverPrivateKey as `0x${string}`;
    } else {
      formattedPrivateKey = `0x${options.serverPrivateKey}` as `0x${string}`;
    }

    // 创建账户和客户端
    this.account = privateKeyToAccount(formattedPrivateKey);
    
    this.publicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: currentChain,
      transport: http(),
    });
  }

  /**
   * 检查代币余额
   */
  async checkBalances(tokenAddress: string, tokenAmount: string, xaaAmount: string) {
    console.log(`💰 开始检查余额...`);
    console.log(`  - 代币地址: ${tokenAddress}`);
    console.log(`  - 需要代币数量: ${tokenAmount}`);
    console.log(`  - 需要XAA数量: ${xaaAmount}`);
    console.log(`  - 钱包地址: ${this.account.address}`);

    const tokenAmountWei = parseEther(tokenAmount);
    const xaaAmountWei = parseEther(xaaAmount);

    const [tokenBalance, xaaBalance] = await Promise.all([
      this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'balanceOf',
        args: [this.account.address],
      }),
      this.publicClient.readContract({
        address: DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'balanceOf',
        args: [this.account.address],
      }),
    ]);

    const tokenBalanceFormatted = formatEther(tokenBalance as bigint);
    const xaaBalanceFormatted = formatEther(xaaBalance as bigint);
    const tokenSufficient = (tokenBalance as bigint) >= tokenAmountWei;
    const xaaSufficient = (xaaBalance as bigint) >= xaaAmountWei;

    console.log(`💰 余额检查结果:`);
    console.log(`  - 代币余额: ${tokenBalanceFormatted} (需要: ${tokenAmount}) ${tokenSufficient ? '✅' : '❌'}`);
    console.log(`  - XAA余额: ${xaaBalanceFormatted} (需要: ${xaaAmount}) ${xaaSufficient ? '✅' : '❌'}`);

    return {
      tokenSufficient,
      xaaSufficient,
      tokenBalance: tokenBalanceFormatted,
      xaaBalance: xaaBalanceFormatted,
      tokenBalanceWei: tokenBalance.toString(),
      xaaBalanceWei: xaaBalance.toString(),
      tokenNeeded: tokenAmount,
      xaaNeeded: xaaAmount,
    };
  }

  /**
   * 检查或创建池子
   */
  async ensurePoolExists(tokenAddress: string): Promise<string> {
    // 检查池子是否存在
    let poolAddress = await this.publicClient.readContract({
      address: DBCSWAP_CONFIG.V3_FACTORY,
      abi: ABIS.V3_FACTORY,
      functionName: 'getPool',
      args: [tokenAddress as `0x${string}`, DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS as `0x${string}`, this.options.fee],
    });

    // 如果池子不存在，创建池子
    if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
      const createPoolHash = await this.walletClient.writeContract({
        address: DBCSWAP_CONFIG.V3_FACTORY,
        abi: ABIS.V3_FACTORY,
        functionName: 'createPool',
        args: [tokenAddress as `0x${string}`, DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS as `0x${string}`, this.options.fee],
      });

      // 等待创建确认
      await this.publicClient.waitForTransactionReceipt({ hash: createPoolHash });

      // 重新查询池子地址
      poolAddress = await this.publicClient.readContract({
        address: DBCSWAP_CONFIG.V3_FACTORY,
        abi: ABIS.V3_FACTORY,
        functionName: 'getPool',
        args: [tokenAddress as `0x${string}`, DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS as `0x${string}`, this.options.fee],
      });
    }

    return poolAddress as string;
  }

  /**
   * 检查并初始化池子
   */
  async ensurePoolInitialized(poolAddress: string, params: CalculatedPoolParams): Promise<void> {
    // 查询池子状态
    console.log(`🔍 检查池子状态: ${poolAddress}`);
    
    const slot0 = await this.publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: ABIS.POOL,
      functionName: 'slot0',
    }) as readonly [bigint, number, number, number, number, number, boolean];

    const sqrtPriceX96 = slot0[0];

    // 如果价格为0，说明池子未初始化
    if (sqrtPriceX96 === BigInt(0)) {
      console.log(`🏗️ 池子未初始化，使用计算的初始价格进行初始化:`);
      console.log(`  - 初始价格 (token1/token0): ${params.initialPrice}`);
      console.log(`  - sqrtPriceX96: ${params.initialSqrtPrice.toString()}`);
      
      // 验证 sqrtPriceX96 是否在有效范围内
      if (params.initialSqrtPrice < MIN_SQRT_RATIO || params.initialSqrtPrice > MAX_SQRT_RATIO) {
        console.error(`❌ 初始价格超出有效范围:`);
        console.error(`  - sqrtPriceX96: ${params.initialSqrtPrice.toString()}`);
        console.error(`  - MIN_SQRT_RATIO: ${MIN_SQRT_RATIO.toString()}`);
        console.error(`  - MAX_SQRT_RATIO: ${MAX_SQRT_RATIO.toString()}`);
        throw new Error(`初始价格超出有效范围: sqrtPriceX96不在[${MIN_SQRT_RATIO.toString()}, ${MAX_SQRT_RATIO.toString()}]范围内`);
      }
      
      // 初始化池子
      console.log(`🚀 正在初始化池子...`);
      const initializeHash = await this.walletClient.writeContract({
        address: poolAddress as `0x${string}`,
        abi: ABIS.POOL,
        functionName: 'initialize',
        args: [params.initialSqrtPrice],
      });

      console.log(`⏳ 等待池子初始化交易确认...`);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: initializeHash });
      console.log(`✅ 池子初始化成功，区块号: ${receipt.blockNumber}`);
    } else {
      // 池子已初始化，检查当前价格是否合理
      console.log(`✅ 池子已初始化`);
      
      // 使用 BigInt 计算以避免精度损失
      const sqrtPriceFloat = Number(sqrtPriceX96) / Math.pow(2, 96);
      const currentPoolPrice = sqrtPriceFloat * sqrtPriceFloat;
      
      // 调整价格以考虑代币小数位数差异
      const decimalAdjustment = Math.pow(10, params.token1Decimals - params.token0Decimals);
      const adjustedPoolPrice = currentPoolPrice / decimalAdjustment;
      
      console.log(`🔍 池子当前价格状态:`);
      console.log(`  - 当前价格 (token1/token0): ${adjustedPoolPrice}`);
      console.log(`  - 期望初始价格 (token1/token0): ${params.initialPrice}`);
      
      // 与期望价格比较
      const priceDiffPercentage = Math.abs((adjustedPoolPrice - params.initialPrice) / params.initialPrice * 100);
      console.log(`  - 价格差异: ${priceDiffPercentage.toFixed(2)}%`);
      
      if (priceDiffPercentage > 50) {
        console.log(`⚠️ 警告: 价格差异较大 (${priceDiffPercentage.toFixed(2)}%)，可能影响流动性添加`);
      }
    }
  }

  /**
   * 获取池子当前tick
   */
  private async getCurrentTick(poolAddress: string): Promise<number> {
    const slot0 = await this.publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: ABIS.POOL,
      functionName: 'slot0',
    }) as readonly [bigint, number, number, number, number, number, boolean];

    const [sqrtPriceX96, tick] = slot0;

    console.log(`🔍 池子状态查询:`);
    console.log(`  - 池子地址: ${poolAddress}`);
    console.log(`  - sqrtPriceX96: ${sqrtPriceX96.toString()}`);
    console.log(`  - 当前tick: ${tick}`);

    return tick;
  }

  /**
   * 授权代币
   */
  async approveTokens(tokenAddress: string, tokenAmount: string, xaaAmount: string): Promise<void> {
    const tokenAmountWei = parseEther(tokenAmount);
    const xaaAmountWei = parseEther(xaaAmount);

    // 授权代币
    console.log('📝 开始授权代币给Position Manager...');
    const tokenApproveHash = await this.walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ABIS.ERC20,
      functionName: 'approve',
      args: [DBCSWAP_CONFIG.POSITION_MANAGER, tokenAmountWei],
    });

    console.log(`✅ 代币授权交易已提交: ${tokenApproveHash}`);
    console.log('⏳ 等待代币授权交易确认...');

    // 等待代币授权确认
    const tokenApproveReceipt = await this.publicClient.waitForTransactionReceipt({ hash: tokenApproveHash });
    console.log('✅ 代币授权确认完成');
    console.log(`📊 代币授权区块号: ${tokenApproveReceipt.blockNumber}`);
    console.log(`📊 代币授权Gas使用: ${tokenApproveReceipt.gasUsed}`);

    // 检查XAA当前授权额度
    console.log('🔍 检查XAA授权前状态...');

    try {
      const currentAllowance = await this.publicClient.readContract({
        address: DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'allowance',
        args: [this.account.address, DBCSWAP_CONFIG.POSITION_MANAGER],
      });

      console.log(`💰 当前XAA授权额度: ${formatEther(currentAllowance as bigint)}`);

      // 如果已有授权额度，先重置为0
      if ((currentAllowance as bigint) > BigInt(0)) {
        console.log('🔄 重置XAA授权额度为0...');
        const resetHash = await this.walletClient.writeContract({
          address: DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS as `0x${string}`,
          abi: ABIS.ERC20,
          functionName: 'approve',
          args: [DBCSWAP_CONFIG.POSITION_MANAGER, BigInt(0)],
        });
        await this.publicClient.waitForTransactionReceipt({ hash: resetHash });
        console.log('✅ XAA授权重置完成');
      }
    } catch (error) {
      console.error('❌ 检查XAA授权状态失败:', error);
    }

    // 授权XAA
    console.log('📝 开始授权XAA代币...');
    console.log(`🔍 XAA代币地址: ${DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS}`);
    console.log(`🔍 Position Manager地址: ${DBCSWAP_CONFIG.POSITION_MANAGER}`);
    console.log(`🔍 授权数量: ${formatEther(xaaAmountWei)} XAA`);
    console.log(`🔍 钱包地址: ${this.account.address}`);

    let xaaApproveHash;
    try {
      xaaApproveHash = await this.walletClient.writeContract({
        address: DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'approve',
        args: [DBCSWAP_CONFIG.POSITION_MANAGER, xaaAmountWei],
      });

      console.log(`✅ XAA授权交易已提交: ${xaaApproveHash}`);
      console.log('⏳ 等待XAA授权交易确认...');
    } catch (error: any) {
      console.error('❌ XAA授权失败详细信息:');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误原因:', error.cause?.message || 'N/A');
      console.error('错误详情:', error.details || 'N/A');
      console.error('错误原因码:', error.cause?.reason || 'N/A');

      // 分析可能的原因
      let possibleCause = '未知原因';
      if (error.message.includes('Module(ModuleError { index: 51, error: [5, 0, 0, 0]')) {
        possibleCause = 'DBC链模块错误 - 可能是代币合约不支持标准ERC20授权，或者有特殊限制';
      } else if (error.message.includes('insufficient')) {
        possibleCause = '余额不足或授权额度不足';
      } else if (error.message.includes('revert')) {
        possibleCause = '合约调用被拒绝 - 可能是合约逻辑限制';
      }

      console.error('🔍 可能原因:', possibleCause);
      throw error;
    }

    // 等待XAA授权确认
    if (xaaApproveHash) {
      console.log('⏳ 等待XAA授权交易确认...');
      const xaaApproveReceipt = await this.publicClient.waitForTransactionReceipt({ hash: xaaApproveHash });
      console.log('✅ XAA授权确认完成');
      console.log(`📊 XAA授权区块号: ${xaaApproveReceipt.blockNumber}`);
      console.log(`📊 XAA授权Gas使用: ${xaaApproveReceipt.gasUsed}`);
    }
  }

  /**
   * 执行所有池子相关操作（创建、初始化、添加流动性）
   */
  async addLiquidity(params: AddLiquidityParams): Promise<PoolManagerResult> {
    try {
      const { tokenAddress, tokenAmount, xaaAmount, priceRange } = params;
  
      console.log(`\n========== 流动性参数验证 ==========`);
      console.log(`📊 代币信息:`);
      console.log(`  - 代币地址: ${tokenAddress}`);
      console.log(`  - 代币数量: ${tokenAmount}`);
      console.log(`  - XAA数量: ${xaaAmount}`);
      
      console.log(`\n💰 价格设置:`);
      console.log(`  - 初始价格: ${priceRange.initial}`);
      console.log(`  - 最小价格: ${priceRange.min} (${(priceRange.min / priceRange.initial * 100).toFixed(1)}% of initial)`);
      console.log(`  - 最大价格: ${priceRange.max} (${(priceRange.max / priceRange.initial * 100).toFixed(1)}% of initial)`);

      // 1. 检查余额
      const balanceCheck = await this.checkBalances(tokenAddress, tokenAmount, xaaAmount);
      if (!balanceCheck.tokenSufficient || !balanceCheck.xaaSufficient) {
        const errorDetails = [];
        if (!balanceCheck.tokenSufficient) {
          errorDetails.push(`代币不足: 需要 ${balanceCheck.tokenNeeded}, 当前 ${balanceCheck.tokenBalance}`);
        }
        if (!balanceCheck.xaaSufficient) {
          errorDetails.push(`XAA不足: 需要 ${balanceCheck.xaaNeeded}, 当前 ${balanceCheck.xaaBalance}`);
        }
        return {
          success: false,
          error: `余额不足 - ${errorDetails.join('; ')}`
        };
      }

      // 2. 确保池子存在
      const poolAddress = await this.ensurePoolExists(tokenAddress);
      console.log(`✅ 池子地址: ${poolAddress}`);

      // 计算所有需要的参数
      const calculatedParams = await this.calculatePoolParams(tokenAddress, tokenAmount, xaaAmount, priceRange, poolAddress);
      console.log(`\n========== 计算参数结果 ==========`);
      console.log(calculatedParams);

      // 3. 确保池子已初始化（使用提供的初始价格）
      await this.ensurePoolInitialized(poolAddress, calculatedParams);
      console.log(`✅ 池子初始化完成`);
      // throw new Error('test');

      // 4. 授权代币
      await this.approveTokens(tokenAddress, tokenAmount, xaaAmount);
      console.log(`✅ 代币授权完成`);

      // 5. 添加流动性
      const result = await this.mintLiquidity(tokenAddress, tokenAmount, xaaAmount, calculatedParams);
      console.log(`✅ 流动性添加完成`);

      return {
        success: true,
        poolAddress,
        ...result
      };
  
    } catch (error) {
      console.error('❌ 池子操作失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async calculatePoolParams(
    tokenAddress: string,
    tokenAmount: string,
    xaaAmount: string,
    priceRange: PriceRange,
    poolAddress: string
  ): Promise<CalculatedPoolParams> {
    console.log(`\n========== 开始计算池子参数 ==========`);
    
    // 转换为Wei
    const tokenAmountWei = parseEther(tokenAmount);
    const xaaAmountWei = parseEther(xaaAmount);
    
    // 确定token0和token1的顺序
    // 在Uniswap V3中，地址值较小的代币为token0，较大的为token1
    const [token0, token1] = tokenAddress.toLowerCase() < DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS.toLowerCase()
      ? [tokenAddress, DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS]
      : [DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS, tokenAddress];
    
    // 确定amount0和amount1的顺序
    const [amount0Desired, amount1Desired] = tokenAddress.toLowerCase() < DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS.toLowerCase()
      ? [tokenAmountWei, xaaAmountWei]
      : [xaaAmountWei, tokenAmountWei];
    
    console.log(`🧮 代币顺序确定:`);
    console.log(`  - token0: ${token0} ${token0 === tokenAddress ? '(用户代币)' : '(XAA)'}`);
    console.log(`  - token1: ${token1} ${token1 === tokenAddress ? '(用户代币)' : '(XAA)'}`);
    
    // 获取代币小数位数
    const [token0Decimals, token1Decimals] = await Promise.all([
      this.publicClient.readContract({
        address: token0 as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'decimals',
      }),
      this.publicClient.readContract({
        address: token1 as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'decimals',
      }),
    ]);
    
    console.log(`📊 代币小数位数:`);
    console.log(`  - token0 (${token0}): ${token0Decimals}`);
    console.log(`  - token1 (${token1}): ${token1Decimals}`);
    
    // 根据代币顺序调整价格
    // Uniswap中价格是以token1/token0表示的
    let initialPrice: number;
    let minPrice: number;
    let maxPrice: number;
    
    if (tokenAddress.toLowerCase() < DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS.toLowerCase()) {
      // 如果用户代币是token0，XAA是token1，那么价格是XAA/用户代币
      initialPrice = priceRange.initial; // XAA/用户代币的价格
      minPrice = priceRange.min;
      maxPrice = priceRange.max;
      console.log(`💰 价格表示: XAA/用户代币`);
    } else {
      // 如果XAA是token0，用户代币是token1，那么价格是用户代币/XAA
      // 需要取倒数来转换价格
      initialPrice = 1 / priceRange.initial; // 用户代币/XAA的价格
      minPrice = 1 / priceRange.max; // 注意最小最大价格取倒数后会互换
      maxPrice = 1 / priceRange.min;
      console.log(`💰 价格表示: 用户代币/XAA`);
    }
    
    // 获取正确的 tickSpacing
    const tickSpacing = 10;  // 0.05% fee的tickSpacing
    console.log(`📊 Tick间距: ${tickSpacing} (手续费: ${this.options.fee/10000}%)`);
    
    // 计算初始 sqrtPriceX96
    const initialSqrtPrice = encodeSqrtRatioX96(initialPrice, Number(token0Decimals), Number(token1Decimals));
    console.log(`📊 价格计算:`);
    console.log(`  - 初始价格 (token1/token0): ${initialPrice}`);
    console.log(`  - 最小价格 (token1/token0): ${minPrice}`);
    console.log(`  - 最大价格 (token1/token0): ${maxPrice}`);
    console.log(`  - initialSqrtPrice（sqrtPriceX96）: ${initialSqrtPrice.toString()}`);
    
    // 计算 tick 范围
    const initialTick = priceToTick(initialPrice, Number(token0Decimals), Number(token1Decimals));
    let minTick = priceToTick(minPrice, Number(token0Decimals), Number(token1Decimals));
    let maxTick = priceToTick(maxPrice, Number(token0Decimals), Number(token1Decimals));
    
    console.log(`📊 原始Tick计算:`);
    console.log(`  - 初始Tick: ${initialTick}`);
    console.log(`  - 最小Tick: ${minTick}`);
    console.log(`  - 最大Tick: ${maxTick}`);
    
    // 应用 tickSpacing
    minTick = getUsableTick(minTick, tickSpacing);
    maxTick = getUsableTick(maxTick, tickSpacing);
    
    // 确保minTick < maxTick
    if (minTick > maxTick) {
      [minTick, maxTick] = [maxTick, minTick];
    }
    
    console.log(`📊 调整后的Tick范围:`);
    console.log(`  - 最小Tick: ${minTick}`);
    console.log(`  - 最大Tick: ${maxTick}`);
    console.log(`  - Tick范围: ${maxTick - minTick} ticks`);
    
    // 尝试获取当前tick
    let currentTick: number | undefined;
    try {
      const slot0 = await this.publicClient.readContract({
        address: poolAddress as `0x${string}`,
        abi: ABIS.POOL,
        functionName: 'slot0',
      }) as readonly [bigint, number, number, number, number, number, boolean];
      
      if (slot0[0] !== BigInt(0)) {
        currentTick = slot0[1];
        console.log(`🔍 池子已初始化，当前tick: ${currentTick}`);
        
        // 确保当前tick在范围内
        const tickInRange = currentTick >= minTick && currentTick < maxTick;
        if (!tickInRange) {
          console.warn(`⚠️ 警告: 当前tick (${currentTick}) 不在设置的范围内 [${minTick}, ${maxTick})`);
          // 调整范围以包含当前tick
          if (currentTick < minTick) {
            const diff = minTick - currentTick;
            minTick = getUsableTick(currentTick - tickSpacing, tickSpacing);
            maxTick = Math.max(maxTick - diff, minTick + 10 * tickSpacing); // 保持至少10个tickSpacing的范围
          } else if (currentTick >= maxTick) {
            const diff = currentTick - maxTick + 1;
            maxTick = getUsableTick(currentTick + tickSpacing, tickSpacing);
            minTick = Math.min(minTick + diff, maxTick - 10 * tickSpacing); // 保持至少10个tickSpacing的范围
          }
          
          console.log(`🔄 调整后的范围:`);
          console.log(`  - 新minTick: ${minTick}`);
          console.log(`  - 新maxTick: ${maxTick}`);
          
          // 再次验证tick是否在范围内
          const newTickInRange = currentTick >= minTick && currentTick < maxTick;
          if (!newTickInRange) {
            throw new Error(`无法调整tick范围以包含当前tick (${currentTick})`);
          }
        }
      } else {
        console.log(`🔍 池子未初始化，将使用计算的初始价格`);
      }
    } catch (error) {
      console.warn(`⚠️ 获取当前tick失败，将使用计算的初始价格:`, error);
    }
    
    // 计算滑点
    const slippageMultiplier = (100 - this.options.slippage) / 100;
    const amount0Min = BigInt(Math.floor(Number(amount0Desired) * slippageMultiplier));
    const amount1Min = BigInt(Math.floor(Number(amount1Desired) * slippageMultiplier));
    
    // 设置截止时间
    const deadline = BigInt(Math.floor(Date.now() / 1000) + this.options.deadline * 60);
    
    console.log(`💰 流动性参数:`);
    console.log(`  - amount0Desired: ${formatEther(amount0Desired)}`);
    console.log(`  - amount1Desired: ${formatEther(amount1Desired)}`);
    console.log(`  - amount0Min: ${formatEther(amount0Min)}`);
    console.log(`  - amount1Min: ${formatEther(amount1Min)}`);
    console.log(`  - 截止时间: ${new Date(Number(deadline) * 1000).toLocaleString()}`);
    
    return {
      initialPrice,
      minPrice,
      maxPrice,
      initialSqrtPrice,
      minTick,
      maxTick,
      currentTick,
      token0,
      token1,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
      deadline,
      tokenAmountWei,
      xaaAmountWei,
      token0Decimals: Number(token0Decimals),
      token1Decimals: Number(token1Decimals)
    };
  }

  private async mintLiquidity(
    tokenAddress: string, 
    tokenAmount: string, 
    xaaAmount: string, 
    params: CalculatedPoolParams
  ) {
    console.log(`\n========== 开始添加流动性 ==========`);
    
    const mintParams = {
      token0: params.token0 as `0x${string}`,
      token1: params.token1 as `0x${string}`,
      fee: this.options.fee,
      tickLower: params.minTick,
      tickUpper: params.maxTick,
      amount0Desired: params.amount0Desired,
      amount1Desired: params.amount1Desired,
      amount0Min: params.amount0Min,
      amount1Min: params.amount1Min,
      recipient: this.account.address,
      deadline: params.deadline,
    };

    console.log(`📊 添加流动性参数:`);
    console.log(JSON.stringify(mintParams, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2));
    
    // 执行添加流动性操作
    const addLiquidityHash = await this.walletClient.writeContract({
      address: DBCSWAP_CONFIG.POSITION_MANAGER,
      abi: ABIS.POSITION_MANAGER,
      functionName: 'mint',
      args: [mintParams],
    });

    console.log(`✅ 添加流动性交易已提交: ${addLiquidityHash}`);
    console.log('⏳ 等待交易确认...');

    const receipt = await this.publicClient.waitForTransactionReceipt({ 
      hash: addLiquidityHash 
    });

    console.log(`✅ 流动性添加成功，区块号: ${receipt.blockNumber}`);
    console.log(`📊 Gas使用: ${receipt.gasUsed}`);

    return {
      txHash: addLiquidityHash,
      tokenAmount: formatEther(params.tokenAmountWei),
      xaaAmount: formatEther(params.xaaAmountWei),
      blockNumber: receipt.blockNumber.toString(),
    };
  }
}