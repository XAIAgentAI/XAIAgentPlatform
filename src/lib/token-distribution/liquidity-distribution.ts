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
   * 计算IAO结束后的代币价格（相对于XAA）
   */
  private async calculateTokenPriceAfterIao(agentId: string): Promise<number> {
    try {
      console.log(`💰 计算IAO结束后的代币价格 - Agent ID: ${agentId}`);

      // 获取Agent信息
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: {
          iaoContractAddress: true,
          totalSupply: true
        }
      });

      if (!agent?.iaoContractAddress) {
        console.log('⚠️ 未找到IAO合约地址，无法计算真实价格');
        throw new Error('IAO合约地址未设置，无法计算代币价格');
      }

      // 获取IAO合约的实际筹资数据
      const iaoData = await this.getIaoContractData(agent.iaoContractAddress);

      if (!iaoData.isSuccess) {
        console.log('⚠️ IAO尚未成功，无法计算结束价格');
        throw new Error('IAO尚未成功完成');
      }

      // 计算IAO结束价格
      const iaoEndPrice = iaoData.totalRaised / iaoData.totalTokensSold; // USD per token

      // 获取当前XAA价格（USD）
      const xaaPrice = await this.getCurrentXaaPrice();

      // 计算代币相对于XAA的价格，并上浮2%
      const tokenToXaaPrice = (iaoEndPrice ) * 1.02;

      console.log(`📊 IAO真实价格计算结果:`);
      console.log(`  - IAO筹资总额: ${iaoData.totalRaised} USD`);
      console.log(`  - IAO售出代币: ${iaoData.totalTokensSold}`);
      console.log(`  - IAO结束价格: ${iaoEndPrice} USD/Token`);
      console.log(`  - 当前XAA价格: ${xaaPrice} USD`);
      console.log(`  - 代币/XAA价格比例: ${tokenToXaaPrice} (已上浮2%)`);

      return tokenToXaaPrice;

    } catch (error) {
      console.error('❌ 计算代币价格失败:', error);
      console.log('🔄 使用备用计算方法...');
      return await this.calculateFallbackPrice(agentId);
    }
  }

  /**
   * 获取IAO合约数据
   */
  private async getIaoContractData(iaoContractAddress: string): Promise<{
    isSuccess: boolean;
    totalRaised: number;
    totalTokensSold: number;
  }> {
    try {
      console.log(`🔍 查询IAO合约数据: ${iaoContractAddress}`);

      // 导入必要的依赖
      const { createPublicClient, http } = await import('viem');
      const { getContractABI } = await import('@/config/contracts');
      const { dbcMainnet } = await import('@/config/networks');

      // 创建公共客户端
      const publicClient = createPublicClient({
        chain: dbcMainnet,
        transport: http()
      });

      // 获取合约ABI（非XAA代币使用UserAgent IAO ABI）
      const contractABI = getContractABI('UserAgent');

      // 1. 检查IAO是否成功
      const [isSuccess, endTime, totalDeposited, totalDepositedWithNFT] = await Promise.all([
        publicClient.readContract({
          address: iaoContractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'isSuccess',
        }).catch(() => false),

        publicClient.readContract({
          address: iaoContractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'endTime',
        }).catch(() => BigInt(0)),

        publicClient.readContract({
          address: iaoContractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'totalDeposited',
        }).catch(() => BigInt(0)),

        publicClient.readContract({
          address: iaoContractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'totalDepositedWithNFT',
        }).catch(() => BigInt(0))
      ]);

      // 检查IAO是否已结束
      const isIAOEnded = Date.now() > Number(endTime) * 1000;

      if (!isIAOEnded) {
        throw new Error('IAO尚未结束');
      }

      if (!isSuccess) {
        throw new Error('IAO未成功');
      }

      // 2. 计算总筹资金额（USD）
      // totalDeposited 是XAA数量，需要转换为USD
      const xaaPrice = await this.getCurrentXaaPrice(); // USD per XAA
      const totalDepositedNum = parseFloat((totalDeposited as bigint).toString()) / 1e18; // 转换为XAA数量
      const totalRaisedUSD = totalDepositedNum * xaaPrice;

      // 3. 计算售出的代币数量
      // 根据IAO规则，15%的代币用于IAO
      // 这里需要从Agent信息获取总供应量
      const agent = await prisma.agent.findUnique({
        where: { iaoContractAddress },
        select: { totalSupply: true }
      });

      if (!agent?.totalSupply) {
        throw new Error('无法获取代币总供应量');
      }

      const totalSupply = parseFloat(agent.totalSupply.toString());
      const totalTokensSold = totalSupply * 0.15; // 15%用于IAO

      console.log(`📊 IAO合约数据查询结果:`);
      console.log(`  - IAO成功: ${isSuccess}`);
      console.log(`  - 筹资XAA数量: ${totalDepositedNum}`);
      console.log(`  - XAA价格: ${xaaPrice} USD`);
      console.log(`  - 筹资总额: ${totalRaisedUSD} USD`);
      console.log(`  - 售出代币数量: ${totalTokensSold}`);

      return {
        isSuccess: !!isSuccess,
        totalRaised: totalRaisedUSD,
        totalTokensSold: totalTokensSold
      };

    } catch (error) {
      console.error('❌ 查询IAO合约失败:', error);
      throw error;
    }
  }

  /**
   * 备用价格计算方法
   */
  private async calculateFallbackPrice(agentId: string): Promise<number> {
    console.log('🔄 使用备用价格计算方法');

    // 如果无法获取真实IAO数据，使用合理的默认值
    // 这个值应该基于项目的实际情况设定
    const fallbackRatio = 0.0001; // 10000个代币 = 1个XAA

    console.log(`⚠️ 使用备用价格比例: ${fallbackRatio}`);
    return fallbackRatio;
  }

  /**
   * 获取当前XAA价格（USD）
   */
  private async getCurrentXaaPrice(): Promise<number> {
    try {
      // 这里应该调用实际的价格API
      // 目前返回一个模拟价格
      return 0.00001432; // 示例XAA价格
    } catch (error) {
      console.error('❌ 获取XAA价格失败:', error);
      return 0.00001432; // 默认XAA价格
    }
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

      // 2. 检查Agent状态
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
          // 如果有池子地址字段，也可以更新
          // poolAddress: result.poolAddress
        }
      });

      // 5. 记录历史
      await prisma.history.create({
        data: {
          action: 'liquidity_distribution_success',
          result: 'success',
          agentId: params.agentId,
        },
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
      try {
        await prisma.history.create({
          data: {
            action: 'liquidity_distribution_failed',
            result: 'failed',
            agentId: params.agentId,
          },
        });
      } catch (dbError) {
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
