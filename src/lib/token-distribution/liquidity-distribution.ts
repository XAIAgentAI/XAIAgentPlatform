/**
 * IAO后代币分发 - 流动性部分
 * 用于将10%的代币添加到DBCSwap流动性池
 * 
 * 使用Uniswap SDK进行价格和tick计算
 */

import { PoolManager, type AddLiquidityParams, DBCSWAP_CONFIG } from '@/lib/pool-manager';
import { prisma } from '@/lib/db';
import { TickMath, nearestUsableTick } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';

// 分配比例配置
export const DISTRIBUTION_RATIOS = {
  CREATOR: 0.33,    // 33% - 创建者
  IAO: 0.15,        // 15% - IAO合约
  LIQUIDITY: 0.10,  // 10% - 流动性池 ← 这部分我们处理
  AIRDROP: 0.02,    // 2% - 空投
  MINING: 0.40      // 40% - 挖矿合约
} as const;

// 类型定义
export interface LiquidityDistributionParams {
  agentId: string;
  tokenAddress: string;
  totalSupply: string;
  iaoContractAddress?: string; // IAO合约地址，从上层传入
  xaaPrice?: number; // XAA对代币的价格比例，默认1:1
}

export interface LiquidityDistributionResult {
  success: boolean;
  poolAddress?: string;
  txHash?: string;
  tokenAmount?: string;
  xaaAmount?: string;
  blockNumber?: string;
  error?: string;
}

/**
 * 流动性分发管理器
 */
export class LiquidityDistributionManager {
  private poolManager: PoolManager;

  constructor(serverPrivateKey: string) {
    this.poolManager = new PoolManager({
      serverPrivateKey,
      fee: 500, // 0.05%手续费
      slippage: 0.5, // 0.5%滑点
      deadline: 20 // 20分钟截止时间
    });
  }

  /**
   * 价格转换为 tick，使用Uniswap SDK的方法
   */
  private priceToTick(price: number): number {
    try {
      // 计算tick值
      const tick = Math.log(price) / Math.log(1.0001);
      
      console.log(`🧮 tick计算过程:`);
      console.log(`  - 价格: ${price}`);
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
   * 获取最接近的可用tick
   */
  private getUsableTick(tick: number, tickSpacing: number): number {
    return nearestUsableTick(tick, tickSpacing);
  }

  /**
   * 计算流动性分发数量和价格
   */
  private async calculateDistributionParams(totalSupply: string, iaoContractAddress?: string): Promise<{
    tokenAmount: string;
    xaaAmount: string;
    rawXaaAmount: string;
    initialPrice: number;
    minPrice: number;
    maxPrice: number;
    initialTick: number;
    minTick: number;
    maxTick: number;
    isTokenAddressSmaller?: boolean; // 添加标志来指示代币地址顺序
  }> {
    console.log(`🧮 计算流动性参数 - 总供应量: ${totalSupply}, IAO合约: ${iaoContractAddress || '未提供'}`);

    const totalSupplyNum = parseFloat(totalSupply);
    const tickSpacing = 10;  // 0.05% fee的tickSpacing

    // 1. 计算代币数量
    const liquidityTokenAmount = totalSupplyNum * DISTRIBUTION_RATIOS.LIQUIDITY;  // 10%用于流动性
    const iaoTokenAmount = totalSupplyNum * DISTRIBUTION_RATIOS.IAO;  // 15%用于IAO

    // 2. 从IAO合约获取原始XAA数量
    const rawXaaAmount = await this.getTotalDepositedTokenIn(iaoContractAddress);
    
    // 3. 计算初始价格
    const fullXaaAmount = parseFloat(rawXaaAmount);
    
    // 价格计算 - 默认情况下，我们计算 XAA/用户代币 的比率
    // 注意：在实际添加流动性时，将根据地址大小决定是否需要调整这个价格
    let baseInitialPrice = fullXaaAmount / liquidityTokenAmount;  // 基础初始价格 = IAO的XAA数量 / 流通池中的代币数量
    let initialPrice = baseInitialPrice * 1.1;  // 实际使用的初始价格（1.1倍）
    
    // 4. 计算初始tick - 使用SDK方法
    const initialTickRaw = this.priceToTick(initialPrice);
    // 确保tick对齐到spacing
    const initialTick = Math.floor(initialTickRaw / tickSpacing) * tickSpacing;
    
    // 5. 计算最低价格（初始价格的0.2倍）
    const minPriceRatio = 0.2;
    let minPrice = initialPrice * minPriceRatio;  // 基于调整后的初始价格计算
    // 计算最低价格对应的tick - 使用SDK方法
    const minTickRaw = this.priceToTick(minPrice);
    const minTick = this.getUsableTick(Math.floor(minTickRaw / tickSpacing) * tickSpacing, tickSpacing);
    
    // 6. 计算实际用于流动性的XAA数量（95%）
    const actualXaaAmountNum = fullXaaAmount * 0.95;
    const actualXaaAmount = actualXaaAmountNum.toString();
    
    // 7. 计算最高价格 - 使用对称价格范围
    const priceRatio = initialPrice / minPrice;
    let maxPrice = initialPrice * priceRatio;
    const calculationMethod = 'Uniswap SDK - 对称价格范围';
    
    // 8. 检查价格表示方式的正确性
    // 在Uniswap V3中价格是token1/token0，但我们需要知道哪个是token0，哪个是token1
    console.log(`\n💰 重要提示: 当前价格计算是以 XAA/用户代币 表示的`);
    console.log(`  实际交易中，Uniswap会根据代币地址大小重新确定token0和token1，并调整价格方向`);
    console.log(`  如果用户代币地址 < XAA地址: token0=用户代币, token1=XAA, 价格=XAA/用户代币`);
    console.log(`  如果用户代币地址 > XAA地址: token0=XAA, token1=用户代币, 价格=用户代币/XAA (需要取倒数)`);
    
    // 计算最高价格对应的tick - 使用SDK方法
    const maxTickRaw = this.priceToTick(maxPrice);
    const maxTick = this.getUsableTick(Math.floor(maxTickRaw / tickSpacing) * tickSpacing, tickSpacing);

    // 验证tick是否在Uniswap V3允许的范围内
    if (minTick < TickMath.MIN_TICK || maxTick > TickMath.MAX_TICK) {
      console.log(`\n⚠️  警告：Tick超出Uniswap V3允许范围：`);
      console.log(`  - 允许范围: [${TickMath.MIN_TICK}, ${TickMath.MAX_TICK}]`);
      console.log(`  - 当前范围: [${minTick}, ${maxTick}]`);
    }

    console.log(`\n========== 流动性价格配置 ==========`);
    console.log(`💰 代币数量:`);
    console.log(`  - 总供应量: ${totalSupplyNum}`);
    console.log(`  - IAO代币数量(15%): ${iaoTokenAmount}`);
    console.log(`  - 流动性代币数量(10%): ${liquidityTokenAmount}`);
    console.log(`  - 原始XAA数量: ${rawXaaAmount}`);
    console.log(`  - 价格计算用XAA数量(100%): ${fullXaaAmount}`);
    console.log(`  - 实际使用XAA数量(95%): ${actualXaaAmount}`);

    console.log(`\n💰 价格计算:`);
    console.log(`  - 计算公式: XAA数量 / 流动性代币数量`);
    console.log(`  - 基础价格 = ${fullXaaAmount} / ${liquidityTokenAmount} = ${baseInitialPrice}`);
    console.log(`  - 调整价格 = ${baseInitialPrice} * 1.1 = ${initialPrice}`);

    console.log(`\n💰 价格和Tick设置:`);
    console.log(`  - 基础初始价格(XAA/用户代币): ${baseInitialPrice.toFixed(8)}`);
    console.log(`  - 调整后初始价格: ${initialPrice.toFixed(8)} (1.1x of base)`);
    console.log(`    • 原始tick: ${initialTickRaw}`);
    console.log(`    • 对齐后tick: ${initialTick} (spacing: ${tickSpacing})`);
    console.log(`  - 最低价格: ${minPrice.toFixed(8)} (${(minPrice/initialPrice * 100).toFixed(1)}% of initial)`);
    console.log(`    • 原始tick: ${minTickRaw}`);
    console.log(`    • 对齐后tick: ${minTick} (spacing: ${tickSpacing})`);
    console.log(`  - 最高价格: ${maxPrice.toFixed(8)} (${(maxPrice/initialPrice).toFixed(2)}x of initial)`);
    console.log(`    • 原始tick: ${maxTickRaw}`);
    console.log(`    • 对齐后tick: ${maxTick} (spacing: ${tickSpacing})`);
    console.log(`  - 计算方法: ${calculationMethod}`);

    console.log(`\n📏 Tick配置:`);
    console.log(`  - Fee: 0.05% (tickSpacing: ${tickSpacing})`);
    console.log(`  - 初始tick到最低tick的距离: ${initialTick - minTick}`);
    console.log(`  - 初始tick到最高tick的距离: ${maxTick - initialTick}`);
    console.log(`  - 总tick范围: ${maxTick - minTick}`);
    console.log(`  - 验证价格:`);
    console.log(`    • 最低价格 = 1.0001^${minTick} = ${Math.pow(1.0001, minTick).toFixed(8)}`);
    console.log(`    • 初始价格 = 1.0001^${initialTick} = ${Math.pow(1.0001, initialTick).toFixed(8)}`);
    console.log(`    • 最高价格 = 1.0001^${maxTick} = ${Math.pow(1.0001, maxTick).toFixed(8)}`);
    console.log(`===================================\n`);

    return {
      tokenAmount: liquidityTokenAmount.toString(),  // 返回流动性需要的代币数量（10%）
      xaaAmount: actualXaaAmount,  // 返回95%的XAA数量用于实际添加流动性
      rawXaaAmount,
      initialPrice,
      minPrice,
      maxPrice,
      initialTick,
      minTick,
      maxTick,
    };
  }

  /**
   * 从IAO合约查询总投入的XAA数量
   */
  private async getTotalDepositedTokenIn(iaoContractAddress?: string): Promise<string> {
    try {
      console.log(`🔍 查询IAO合约中的总投入XAA数量 - 合约地址: ${iaoContractAddress || '未提供'}`);

      if (!iaoContractAddress) {
        console.log('⚠️ 未提供IAO合约地址，返回0');
        return '0';
      }

      console.log(`🏦 IAO合约地址: ${iaoContractAddress}`);

      // 导入必要的依赖
      const { createPublicClient, http } = await import('viem');
      const { getContractABI } = await import('@/config/contracts');
      const { dbcMainnet } = await import('@/config/networks');

      // 创建公共客户端
      const publicClient = createPublicClient({
        chain: dbcMainnet,
        transport: http()
      });

      // 获取合约ABI
      const contractABI = getContractABI('UserAgent');

      // 查询总投入金额
      const totalDeposited = await publicClient.readContract({
        address: iaoContractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'totalDepositedTokenIn',
      });

      // 将BigInt转换为字符串，并从wei转换为ether
      const totalDepositedStr = totalDeposited.toString();
      const totalDepositedEther = parseFloat(totalDepositedStr) / Math.pow(10, 18);

      // 四舍五入到整数，避免精度问题
      const roundedAmount = Math.round(totalDepositedEther);

      console.log(`✅ 查询到总投入XAA数量: ${totalDepositedEther} XAA (${totalDepositedStr} wei)`);
      console.log(`🔧 四舍五入后的XAA数量: ${roundedAmount} XAA`);

      return roundedAmount.toString();

    } catch (error) {
      console.error('❌ 查询IAO合约总投入失败:', error);
      return '0';
    }
  }

  /**
   * 执行流动性分发
   */
  async distributeLiquidity(params: LiquidityDistributionParams): Promise<LiquidityDistributionResult> {
    try {
      console.log('🚀 开始流动性分发...');
      console.log(`📊 Agent ID: ${params.agentId}`);
      console.log(`🪙 代币地址: ${params.tokenAddress}`);
      console.log(`📈 总供应量: ${params.totalSupply}`);

      // 1. 检查Agent状态
      const agent = await prisma.agent.findUnique({
        where: { id: params.agentId }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      if (agent.liquidityAdded) {
        return {
          success: false,
          error: '流动性已经添加过了'
        };
      }

      // 2. 计算所有必要参数
      const distributionParams = await this.calculateDistributionParams(
        params.totalSupply,
        params.iaoContractAddress
      );

      console.log(`\n📊 价格参数 - 这里表示的价格是XAA/用户代币的比率`);
      console.log(`  - 初始价格: ${distributionParams.initialPrice}`);
      console.log(`  - 最小价格: ${distributionParams.minPrice}`);
      console.log(`  - 最大价格: ${distributionParams.maxPrice}`);
      console.log(`  - 注意: PoolManager会根据代币地址大小自动调整价格方向`);

      // 3. 准备添加流动性的参数
      const addLiquidityParams: AddLiquidityParams = {
        tokenAddress: params.tokenAddress,
        tokenAmount: distributionParams.tokenAmount,
        xaaAmount: distributionParams.xaaAmount,
        priceRange: {
          initial: distributionParams.initialPrice,
          min: distributionParams.minPrice,
          max: distributionParams.maxPrice
        }
      };

      console.log(`📊 准备添加流动性:`, addLiquidityParams);

      // 4. 执行流动性添加
      const result = await this.poolManager.addLiquidity(addLiquidityParams);

      if (!result.success) {
        throw new Error(result.error || '流动性添加失败');
      }

      // 5. 更新数据库状态
      await prisma.agent.update({
        where: { id: params.agentId },
        data: {
          liquidityAdded: true,
          poolAddress: result.poolAddress
        }
      });

      console.log('✅ 流动性分发完成');
      console.log(`🏊 池子地址: ${result.poolAddress}`);
      console.log(`📝 交易哈希: ${result.txHash}`);

      return {
        success: true,
        poolAddress: result.poolAddress,
        txHash: result.txHash,
        tokenAmount: result.tokenAmount,
        xaaAmount: result.xaaAmount,
        blockNumber: result.blockNumber
      };

    } catch (error) {
      console.error('❌ 流动性分发失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 批量处理多个Agent的流动性分发
   */
  async batchDistributeLiquidity(agentIds: string[]): Promise<LiquidityDistributionResult[]> {
    const results: LiquidityDistributionResult[] = [];

    for (const agentId of agentIds) {
      try {
        // 获取Agent信息
        const agent = await prisma.agent.findUnique({
          where: { id: agentId }
        });

        if (!agent || !agent.tokenAddress || !agent.totalSupply) {
          results.push({
            success: false,
            error: `Agent ${agentId} 信息不完整`
          });
          continue;
        }

        // 执行分发
        const result = await this.distributeLiquidity({
          agentId,
          tokenAddress: agent.tokenAddress,
          totalSupply: agent.totalSupply.toString()
        });

        results.push(result);

        // 添加延迟避免过快的连续交易
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * 检查流动性分发状态
   */
  async checkDistributionStatus(agentId: string): Promise<{
    agentId: string;
    liquidityAdded: boolean | null;
    tokenAddress: string | null;
    calculatedTokenAmount: string;
    calculatedXaaAmount: string;
  }> {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        liquidityAdded: true,
        tokenAddress: true,
        totalSupply: true
      }
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const { tokenAmount, xaaAmount } = await this.calculateDistributionParams(
      agent.totalSupply?.toString() || '0',
      agentId
    );

    return {
      agentId,
      liquidityAdded: agent.liquidityAdded,
      tokenAddress: agent.tokenAddress,
      calculatedTokenAmount: tokenAmount,
      calculatedXaaAmount: xaaAmount
    };
  }
}

/**
 * 创建流动性分发管理器实例
 */
export function createLiquidityDistributionManager(): LiquidityDistributionManager {
  const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  
  if (!serverPrivateKey) {
    throw new Error('SERVER_WALLET_PRIVATE_KEY not configured');
  }

  return new LiquidityDistributionManager(serverPrivateKey);
}

/**
 * 便捷函数：为单个Agent分发流动性
 */
export async function distributeLiquidityForAgent(
  agentId: string,
  tokenAddress: string,
  totalSupply: string,
  iaoContractAddress?: string
): Promise<LiquidityDistributionResult> {
  const manager = createLiquidityDistributionManager();

  return manager.distributeLiquidity({
    agentId,
    tokenAddress,
    totalSupply,
    iaoContractAddress
  });
}

/**
 * 便捷函数：批量分发流动性
 */
export async function batchDistributeLiquidity(
  agentIds: string[]
): Promise<LiquidityDistributionResult[]> {
  const manager = createLiquidityDistributionManager();
  
  return manager.batchDistributeLiquidity(agentIds);
}