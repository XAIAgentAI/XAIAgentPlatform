/**
 * 智能合约事件监听服务
 * 监听 TimeUpdated 事件并自动同步到数据库
 */

import { createPublicClient, http, parseAbiItem } from 'viem';
import { PrismaClient } from '@prisma/client';
import { MAINNET_USERAGENT_IAO_CONTRACT_ABI } from '@/config/contracts';
import { dbcMainnet } from '@/config/networks';

const prisma = new PrismaClient();

// 使用项目中已配置的 DBC 主网
const chain = dbcMainnet; // DBC 主网 (Chain ID: 19880818)
const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

console.log(`🔧 事件监听器配置:`, {
  environment: process.env.NODE_ENV,
  chainId: chain.id,
  chainName: chain.name,
  rpcUrl: rpcUrl ? `${rpcUrl.substring(0, 30)}...` : 'undefined'
});

// 创建公共客户端 - 优先使用 WebSocket，回退到 HTTP
const createTransport = () => {
  // 尝试使用 WebSocket（如果 RPC URL 支持）
  const wsUrl = rpcUrl?.replace('https://', 'wss://').replace('http://', 'ws://');

  // 由于 DBC 可能不支持 WebSocket，直接使用 HTTP
  return http(rpcUrl, {
    // 增加重试配置
    retryCount: 3,
    retryDelay: 1000,
  });
};

const publicClient = createPublicClient({
  chain,
  transport: createTransport(),
});



class ContractEventListener {
  private isListening = false;
  private watchUnsubscribe: (() => void) | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * 开始监听所有IAO合约的TimeUpdated事件
   */
  async startListening() {
    if (this.isListening) {
      console.log('事件监听已在运行中');
      return;
    }

    try {
      console.log('开始监听IAO合约TimeUpdated事件...');
      
      // 获取所有有IAO合约地址的Agent
      const agentsWithContracts = await prisma.agent.findMany({
        where: {
          OR: [
            { iaoContractAddress: { not: null } },
            { iaoContractAddressTestnet: { not: null } }
          ]
        },
        select: {
          id: true,
          iaoContractAddress: true,
          iaoContractAddressTestnet: true,
        }
      });

      // 强制使用主网合约地址
      const contractAddresses = agentsWithContracts
        .map(agent => agent.iaoContractAddress) // 只使用主网地址
        .filter(Boolean) as string[];

      if (contractAddresses.length === 0) {
        console.log('❌ 没有找到需要监听的合约地址');
        console.log('📊 Agent数据:', agentsWithContracts.map(agent => ({
          id: agent.id,
          mainnet: agent.iaoContractAddress,
          testnet: agent.iaoContractAddressTestnet
        })));
        return;
      }

      console.log(`📡 开始监听 ${contractAddresses.length} 个合约的事件:`);
      contractAddresses.forEach((addr, index) => {
        console.log(`  ${index + 1}. ${addr}`);
      });

      // 使用 watchEvent 监听事件，增强错误处理
      try {
        // 测试 RPC 连接
        const blockNumber = await publicClient.getBlockNumber();
        console.log(`🔗 RPC 连接正常，当前区块: ${blockNumber}`);

        // 使用轮询模式监听事件（避免过滤器问题）
        console.log('🔄 使用轮询模式监听事件（避免 DBC RPC 过滤器限制）');

        this.watchUnsubscribe = publicClient.watchEvent({
          address: contractAddresses as `0x${string}`[],
          event: parseAbiItem('event TimeUpdated(uint256 startTime, uint256 endTime)'),
          onLogs: (logs) => {
            console.log(`🎉 收到 ${logs.length} 个 TimeUpdated 事件`);
            logs.forEach(log => this.handleTimeUpdatedEvent(log));
          },
          onError: (error) => {
            console.error('❌ 事件监听错误:', error);
            this.isListening = false;

            // 过滤器错误频繁，延长重连间隔
            if (error.message.includes('Filter id') || error.message.includes('does not exist')) {
              console.log('🔄 检测到过滤器错误，30秒后重新创建监听器...');
              setTimeout(() => this.restartListening(), 30000); // 延长到30秒
            } else {
              console.log('🔄 其他错误，60秒后重新创建监听器...');
              setTimeout(() => this.restartListening(), 60000); // 延长到60秒
            }
          },
          // 强制使用轮询模式，避免过滤器
          poll: true,
          pollingInterval: 30000, // 30秒轮询一次，减少过滤器压力
        });

        this.isListening = true;
        console.log('✅ 事件监听启动成功（轮询模式，30秒间隔，避免过滤器问题）');

      } catch (error) {
        console.error('❌ 创建事件监听器失败:', error);
        this.isListening = false;
        throw error;
      }

      // 添加心跳日志，每5分钟输出一次状态
      setInterval(() => {
        if (this.isListening) {
          console.log(`💓 事件监听器心跳 - 正在监听 ${contractAddresses.length} 个合约 - ${new Date().toISOString()}`);
        }
      }, 5 * 60 * 1000); // 5分钟

    } catch (error) {
      console.error('启动事件监听失败:', error);
      throw error;
    }
  }

  /**
   * 处理TimeUpdated事件
   */
  private async handleTimeUpdatedEvent(log: any) {
    try {
      const { startTime, endTime } = log.args;
      const contractAddress = log.address.toLowerCase();
      
      console.log(`🎯 收到TimeUpdated事件:`, {
        contractAddress,
        startTime: Number(startTime),
        endTime: Number(endTime),
        startTimeFormatted: new Date(Number(startTime) * 1000).toISOString(),
        endTimeFormatted: new Date(Number(endTime) * 1000).toISOString(),
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash
      });

      // 查找对应的Agent
      const agent = await prisma.agent.findFirst({
        where: {
          OR: [
            { iaoContractAddress: { equals: contractAddress, mode: 'insensitive' } },
            { iaoContractAddressTestnet: { equals: contractAddress, mode: 'insensitive' } }
          ]
        }
      });

      if (!agent) {
        console.warn(`未找到合约地址 ${contractAddress} 对应的Agent`);
        return;
      }

      // 更新数据库中的时间（存储时间戳）
      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          iaoStartTime: BigInt(startTime),
          iaoEndTime: BigInt(endTime),
        }
      });

      // 记录同步历史
      await prisma.history.create({
        data: {
          action: 'time_sync_from_contract',
          result: 'success',
          agentId: agent.id,
        }
      });

      console.log(`成功同步Agent ${agent.id} 的时间信息`);

    } catch (error) {
      console.error('处理TimeUpdated事件失败:', error);
      
      // 记录错误历史
      try {
        await prisma.history.create({
          data: {
            action: 'time_sync_from_contract',
            result: 'failed',
            agentId: 'unknown',
            error: `同步时间失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        });
      } catch (historyError) {
        console.error('记录错误历史失败:', historyError);
      }
    }
  }



  /**
   * 停止监听
   */
  stopListening() {
    if (this.watchUnsubscribe) {
      this.watchUnsubscribe();
      this.watchUnsubscribe = null;
    }
    this.isListening = false;
    console.log('事件监听已停止');
  }

  /**
   * 重新启动监听
   */
  private async restartListening() {
    console.log('重新启动事件监听...');
    this.stopListening();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    await this.startListening();
  }

  /**
   * 获取监听状态
   */
  isActive() {
    return this.isListening;
  }

  /**
   * 手动同步指定合约的时间（用于初始化或错误恢复）
   */
  async syncContractTime(contractAddress: string, agentId: string) {
    try {
      console.log(`手动同步合约 ${contractAddress} 的时间...`);

      // 读取合约中的时间
      const [startTime, endTime] = await Promise.all([
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MAINNET_USERAGENT_IAO_CONTRACT_ABI,
          functionName: 'startTime',
        }),
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MAINNET_USERAGENT_IAO_CONTRACT_ABI,
          functionName: 'endTime',
        })
      ]);

      // 更新数据库（存储时间戳）
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          iaoStartTime: BigInt(startTime as string),
          iaoEndTime: BigInt(endTime as string),
        }
      });

      console.log(`手动同步成功: startTime=${Number(startTime)}, endTime=${Number(endTime)}`);
      return { startTime: Number(startTime), endTime: Number(endTime) };

    } catch (error) {
      console.error('手动同步合约时间失败:', error);
      throw error;
    }
  }
}

// 创建全局实例
export const contractEventListener = new ContractEventListener();

// 导出启动函数
export const startContractEventListener = () => {
  return contractEventListener.startListening();
};

// 导出停止函数
export const stopContractEventListener = () => {
  contractEventListener.stopListening();
};

// 导出手动同步函数
export const syncContractTime = (contractAddress: string, agentId: string) => {
  return contractEventListener.syncContractTime(contractAddress, agentId);
};
