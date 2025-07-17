/**
 * IAO后代币分发 - 流动性部分
 * 用于将10%的代币添加到DBCSwap流动性池
 */

import { PoolManager, type AddLiquidityParams } from '@/lib/pool-manager';
import { prisma } from '@/lib/db';

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
   * 计算流动性分发数量
   */
  private async calculateLiquidityAmounts(totalSupply: string, iaoContractAddress?: string): Promise<{tokenAmount: string, xaaAmount: string}> {
    console.log(`🧮 计算流动性数量 - 总供应量: ${totalSupply}, IAO合约: ${iaoContractAddress || '未提供'}`);

    const totalSupplyNum = parseFloat(totalSupply);

    // 计算10%的代币用于流动性
    const tokenAmount = totalSupplyNum * DISTRIBUTION_RATIOS.LIQUIDITY;

    // 直接从IAO合约查询用户投入的XAA数量，这些XAA应该用于流动性池
    const xaaAmount = await this.getTotalDepositedTokenIn(iaoContractAddress);

    console.log(`📊 计算结果:`);
    console.log(`  - 代币数量: ${tokenAmount} (${DISTRIBUTION_RATIOS.LIQUIDITY * 100}%)`);
    console.log(`  - XAA数量: ${xaaAmount} (从IAO合约totalDepositedTokenIn查询)`);

    return {
      tokenAmount: tokenAmount.toString(),
      xaaAmount: xaaAmount.toString()
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
   * 这是主要的公共方法，在IAO成功后调用
   */
  async distributeLiquidity(params: LiquidityDistributionParams): Promise<LiquidityDistributionResult> {
    try {
      console.log('🚀 开始流动性分发...');
      console.log(`📊 Agent ID: ${params.agentId}`);
      console.log(`🪙 代币地址: ${params.tokenAddress}`);
      console.log(`📈 总供应量: ${params.totalSupply}`);

      // 1. 计算分发数量
      const { tokenAmount, xaaAmount } = await this.calculateLiquidityAmounts(
        params.totalSupply,
        params.iaoContractAddress
      );

      console.log(`💰 计算的流动性数量:`);
      console.log(`  - 代币数量: ${tokenAmount} (${DISTRIBUTION_RATIOS.LIQUIDITY * 100}%)`);
      console.log(`  - XAA数量: ${xaaAmount}`);

      // 2. 计算IAO初始价格（基于投入比例）
      // 确定token0和token1的顺序
      const { DBCSWAP_CONFIG } = await import('@/lib/pool-manager');
      const isToken0 = params.tokenAddress.toLowerCase() < DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS.toLowerCase();
      
      // 根据代币顺序计算正确的价格方向
      let iaoPrice;
      if (isToken0) {
        // 如果代币是token0，XAA是token1，价格是XAA/代币
        iaoPrice = parseFloat(xaaAmount) / parseFloat(tokenAmount);
      } else {
        // 如果XAA是token0，代币是token1，价格是代币/XAA
        iaoPrice = parseFloat(tokenAmount) / parseFloat(xaaAmount);
      }
      
      console.log(`💰 IAO初始价格计算:`);
      console.log(`  - 代币是token0: ${isToken0}`);
      console.log(`  - token0: ${isToken0 ? params.tokenAddress : DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS}`);
      console.log(`  - token1: ${isToken0 ? DBCSWAP_CONFIG.XAA_TOKEN_ADDRESS : params.tokenAddress}`);
      console.log(`  - IAO初始价格 (token1/token0): ${iaoPrice}`);

      // 3. 检查Agent状态
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

      // 3. 执行流动性添加
      console.log(`🔍 准备调用poolManager.addLiquidity:`);
      console.log(`  - tokenAddress: ${params.tokenAddress}`);
      console.log(`  - tokenAmount: ${tokenAmount}`);
      console.log(`  - xaaAmount: ${xaaAmount}`);
      console.log(`  - 计算的IAO价格: ${iaoPrice}`);

      const addLiquidityParams: AddLiquidityParams = {
        tokenAddress: params.tokenAddress,
        tokenAmount,
        xaaAmount
      };

      console.log(`🔍 addLiquidityParams:`, addLiquidityParams);

      const result = await this.poolManager.addLiquidity(addLiquidityParams);

      if (!result.success) {
        throw new Error(result.error || '流动性添加失败');
      }

      // 4. 更新数据库状态
      await prisma.agent.update({
        where: { id: params.agentId },
        data: {
          liquidityAdded: true,
          poolAddress: result.poolAddress // 保存池子地址到数据库
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

      // 记录失败历史
      try {      } catch (dbError) {
        console.error('记录失败历史时出错:', dbError);
      }

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
  async checkDistributionStatus(agentId: string) {
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

    const { tokenAmount, xaaAmount } = await this.calculateLiquidityAmounts(
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
