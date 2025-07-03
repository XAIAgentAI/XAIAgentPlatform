/**
 * DBCSwap 池子管理模块
 * 用于创建池子、添加流动性等操作
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { currentChain } from '@/config/networks';
import { getPoolCurrentPrice, getTokenPriceInXAA } from '@/services/poolPriceService';

// DBCSwap V3 合约地址配置
export const DBCSWAP_CONFIG = {
  V3_FACTORY: '0x34A7E09D8810d2d8620700f82b471879223F1628' as const,
  POSITION_MANAGER: '0xfCE792dd602fA70143e43e7556e8a92D762bA9FC' as const,
  XAA_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true" 
    ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a" 
    : "0x16d83F6B17914a4e88436251589194ca5ac0f452",
} as const;

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
  async ensurePoolInitialized(poolAddress: string, uniswapPrice?: number): Promise<void> {
    const slot0 = await this.publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: ABIS.POOL,
      functionName: 'slot0',
    }) as readonly [bigint, number, number, number, number, number, boolean];

    const sqrtPriceX96 = slot0[0];

    // 如果价格为0，说明池子未初始化
    if (sqrtPriceX96 === BigInt(0)) {
      if (!uniswapPrice || uniswapPrice <= 0) {
        throw new Error('池子未初始化且未提供Uniswap价格，无法初始化池子');
      }

      // 使用Uniswap价格初始化
      // sqrtPriceX96 = sqrt(price) * 2^96
      const sqrtPrice = Math.sqrt(uniswapPrice);
      const initialSqrtPrice = BigInt(Math.floor(sqrtPrice * Math.pow(2, 96)));

      console.log(`🏗️ 使用Uniswap价格初始化池子:`);
      console.log(`  - Uniswap价格: ${uniswapPrice}`);
      console.log(`  - sqrt价格: ${sqrtPrice}`);
      console.log(`  - sqrtPriceX96: ${initialSqrtPrice.toString()}`);

      const initializeHash = await this.walletClient.writeContract({
        address: poolAddress as `0x${string}`,
        abi: ABIS.POOL,
        functionName: 'initialize',
        args: [initialSqrtPrice],
      });

      await this.publicClient.waitForTransactionReceipt({ hash: initializeHash });
      console.log(`✅ 池子初始化完成`);
    } else {
      // 池子已初始化，检查当前价格是否合理
      const currentPoolPrice = Math.pow(Number(sqrtPriceX96) / Math.pow(2, 96), 2);
      console.log(`🔍 池子已初始化，当前价格 (token1/token0): ${currentPoolPrice}`);


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
   * 添加流动性到池子
   * 这是主要的公共方法，用于IAO后的代币分发
   */
  async addLiquidity(params: AddLiquidityParams): Promise<PoolManagerResult> {
    try {
      const { tokenAddress, tokenAmount, xaaAmount } = params;

      console.log(`🏊 开始添加流动性:`);
      console.log(`  - 代币地址: ${tokenAddress}`);
      console.log(`  - 代币数量: ${tokenAmount}`);
      console.log(`  - XAA数量: ${xaaAmount}`);

      // 确定token0和token1的顺序
      const isToken0 = tokenAddress.toLowerCase() < DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS.toLowerCase();

      // 统一计算：一个代币等于多少XAA (XAA/代币的比例)
      const tokenToXaaRate = parseFloat(xaaAmount) / parseFloat(tokenAmount);
      const uniswapPrice = tokenToXaaRate

      console.log(`💰 计算的Uniswap价格:`);
      console.log(`  - XAA地址: ${DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS}`);
      console.log(`  - 代币地址: ${tokenAddress}`);
      console.log(`  - 代币数量: ${tokenAmount}`);
      console.log(`  - XAA数量: ${xaaAmount}`);
      console.log(`  - 代币:XAA比例: 1:${tokenToXaaRate} (一个代币等于${tokenToXaaRate}个XAA)`);
      console.log(`  - 代币是token0: ${isToken0}`);
      console.log(`  - token0: ${isToken0 ? tokenAddress : DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS}`);
      console.log(`  - token1: ${isToken0 ? DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS : tokenAddress}`);
      console.log(`  - Uniswap价格 (token1/token0): ${uniswapPrice}`);

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

      // 3. 确保池子已初始化（使用计算出的Uniswap价格）
      await this.ensurePoolInitialized(poolAddress, uniswapPrice);

      // 4. 授权代币
      await this.approveTokens(tokenAddress, tokenAmount, xaaAmount);

      // 5. 添加流动性（传递计算出的Uniswap价格）
      const result = await this.mintLiquidity(tokenAddress, tokenAmount, xaaAmount, uniswapPrice);

      return {
        success: true,
        poolAddress,
        ...result
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 铸造流动性
   */
  private async mintLiquidity(tokenAddress: string, tokenAmount: string, xaaAmount: string, uniswapPrice?: number) {
    const tokenAmountWei = parseEther(tokenAmount);
    const xaaAmountWei = parseEther(xaaAmount);

    // 获取池子地址
    const poolAddress = await this.ensurePoolExists(tokenAddress);

    // 设置截止时间
    const deadline = BigInt(Math.floor(Date.now() / 1000) + this.options.deadline * 60);

    // 确定token0和token1的顺序
    const isToken0 = tokenAddress.toLowerCase() < DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS.toLowerCase();
    const token0 = isToken0 ? tokenAddress : DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS;
    const token1 = isToken0 ? DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS : tokenAddress;
    const amount0Desired = isToken0 ? tokenAmountWei : xaaAmountWei;
    const amount1Desired = isToken0 ? xaaAmountWei : tokenAmountWei;

    // 设置tick范围（必须包含当前tick）
    const tickSpacing = 10; // 0.05%手续费的tick间距

    // 获取当前tick
    const currentTick = await this.getCurrentTick(poolAddress);

    let tickLower: number;
    let tickUpper: number;

    if (uniswapPrice && uniswapPrice > 0) {
      // 基于Uniswap价格计算理想的tick范围
      const minPrice = uniswapPrice * 0.2;  // 20%
      const maxPrice = uniswapPrice * 5.0;  // 500%

      const idealTickLower = Math.floor(Math.log(minPrice) / Math.log(1.0001) / tickSpacing) * tickSpacing;
      const idealTickUpper = Math.floor(Math.log(maxPrice) / Math.log(1.0001) / tickSpacing) * tickSpacing;

      // 确保当前tick在范围内
      tickLower = Math.min(idealTickLower, currentTick - 100); // 至少比当前tick小100
      tickUpper = Math.max(idealTickUpper, currentTick + 100); // 至少比当前tick大100

      // 确保符合tick间距
      tickLower = Math.floor(tickLower / tickSpacing) * tickSpacing;
      tickUpper = Math.floor(tickUpper / tickSpacing) * tickSpacing;

      console.log(`📊 基于Uniswap价格的Tick范围计算:`);
      console.log(`  - Uniswap价格: ${uniswapPrice}`);
      console.log(`  - 最小价格 (20%): ${minPrice}`);
      console.log(`  - 最大价格 (500%): ${maxPrice}`);
      console.log(`  - 理想tickLower: ${idealTickLower}`);
      console.log(`  - 理想tickUpper: ${idealTickUpper}`);
      console.log(`  - 当前tick: ${currentTick}`);
      console.log(`  - 调整后tickLower: ${tickLower}`);
      console.log(`  - 调整后tickUpper: ${tickUpper}`);
    } else {
      // 如果没有IAO价格，使用当前tick动态计算
      const tickRange = 1000;
      tickLower = Math.floor((currentTick - tickRange) / tickSpacing) * tickSpacing;
      tickUpper = Math.floor((currentTick + tickRange) / tickSpacing) * tickSpacing;

      console.log(`📊 基于当前tick的范围计算:`);
      console.log(`  - 当前tick: ${currentTick}`);
      console.log(`  - tickLower: ${tickLower}`);
      console.log(`  - tickUpper: ${tickUpper}`);
      console.log(`  - tick范围: ${tickRange * 2} ticks`);
    }

    // 验证tick范围
    const tickInRange = currentTick >= tickLower && currentTick < tickUpper;
    console.log(`🔍 Tick范围验证:`);
    console.log(`  - 当前tick: ${currentTick}`);
    console.log(`  - tickLower: ${tickLower}`);
    console.log(`  - tickUpper: ${tickUpper}`);
    console.log(`  - tick在范围内: ${tickInRange}`);
    console.log(`  - 价格范围: ${Math.pow(1.0001, tickLower).toFixed(6)} - ${Math.pow(1.0001, tickUpper).toFixed(6)}`);

    if (!tickInRange) {
      throw new Error(`当前tick (${currentTick}) 不在设置的范围内 [${tickLower}, ${tickUpper})`);
    }

    // 计算滑点
    const slippageMultiplier = (100 - this.options.slippage) / 100;
    const amount0Min = BigInt(Math.floor(Number(amount0Desired) * slippageMultiplier));
    const amount1Min = BigInt(Math.floor(Number(amount1Desired) * slippageMultiplier));

    const mintParams = {
      token0: token0 as `0x${string}`,
      token1: token1 as `0x${string}`,
      fee: this.options.fee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0Desired,
      amount1Desired: amount1Desired,
      amount0Min: amount0Min,
      amount1Min: amount1Min,
      recipient: this.account.address,
      deadline: deadline,
    };

    const addLiquidityHash = await this.walletClient.writeContract({
      address: DBCSWAP_CONFIG.POSITION_MANAGER,
      abi: ABIS.POSITION_MANAGER,
      functionName: 'mint',
      args: [mintParams],
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ 
      hash: addLiquidityHash 
    });

    return {
      txHash: addLiquidityHash,
      tokenAmount: formatEther(tokenAmountWei),
      xaaAmount: formatEther(xaaAmountWei),
      blockNumber: receipt.blockNumber.toString(),
    };
  }
}
