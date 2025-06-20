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

// 创建公共客户端
const createTransport = () => {
  // 当前配置强制使用HTTP，因为我们使用的DBC主网RPC节点对WebSocket的支持不稳定
  return http(rpcUrl, {
    // 增加重试配置
    retryCount: 3,
    retryDelay: 1000,
    // 延长请求超时时间，以应对不稳定的RPC节点
    timeout: 30_000, // 30秒
  });
};

const publicClient = createPublicClient({
  chain,
  transport: createTransport(),
});



class ContractEventListener {
  private isListening = false;
  private watchUnsubscribes: (() => void)[] = []; // 改为正确的类型：一个返回void的函数数组
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isRestarting = false; // 防止重复重启
  private restartTimeout: NodeJS.Timeout | null = null; // 重启定时器
  private lastLogTime = 0; // 上次日志时间
  private logCooldown = 5000; // 日志冷却时间（5秒）

  /**
   * 限制日志输出频率
   */
  private logWithCooldown(message: string) {
    const now = Date.now();
    if (now - this.lastLogTime > this.logCooldown) {
      console.log(message);
      this.lastLogTime = now;
    }
  }

  /**
   * 开始监听所有IAO合约的TimeUpdated事件
   */
  async startListening() {
    if (this.isListening) {
      this.logWithCooldown('事件监听已在运行中');
      return;
    }

    if (this.isRestarting) {
      this.logWithCooldown('事件监听器正在重启中，跳过重复启动');
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

        // 轮询模式：为每个合约地址创建独立的监听器，提高稳定性
        console.log('🔄 为每个合约创建独立监听器（轮询模式，避免DBC RPC限制）');

        contractAddresses.forEach(address => {
          const unwatch = publicClient.watchEvent({
            address: address as `0x${string}`, // 单个地址
            event: parseAbiItem('event TimeUpdated(uint256 startTime, uint256 endTime)'),
            onLogs: (logs) => {
              console.log(`🎉 收到 ${logs.length} 个 TimeUpdated 事件 (合约: ${address})`);
              logs.forEach(log => this.handleTimeUpdatedEvent(log));
            },
            onError: (error) => {
              console.error(`❌ 合约 ${address} 的事件监听发生错误:`, error);
              // 任何一个监听器出错，都触发整体重启
              if (!this.isRestarting) {
                // 根据错误类型调整重启延迟
                const isTimeoutError = error.name === 'TimeoutError';
                const delay = isTimeoutError ? 60000 : 30000; // 超时错误等待更长时间
                console.log(`🔄 将在${delay / 1000}秒后重启所有监听器... (原因: ${error.name})`);

                this.isListening = false;
                if (this.restartTimeout) clearTimeout(this.restartTimeout);
                this.restartTimeout = setTimeout(() => {
                  this.restartListening('error');
                }, delay);
              }
            },
            poll: true,
            pollingInterval: 60000, // 60秒轮询一次，减轻RPC压力
          });
          this.watchUnsubscribes.push(unwatch);
        });

        this.isListening = true;
        console.log(`✅ ${contractAddresses.length} 个事件监听器启动成功`);

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
  async stopListening() {
    // 清除重启定时器
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.watchUnsubscribes.length > 0) {
      console.log(`正在停止 ${this.watchUnsubscribes.length} 个监听器...`);
      // viem的unwatch函数是同步的(返回void)，我们只需遍历并调用它们
      for (const unwatch of this.watchUnsubscribes) {
        try {
          unwatch();
        } catch (e) {
          // 这是一个安全措施，以防万一unwatch调用本身抛出异常
          console.warn('卸载监听器时发生同步错误:', e);
        }
      }
      this.watchUnsubscribes = [];
    }

    this.isListening = false;
    console.log('所有事件监听已停止');
  }

  /**
   * 重新启动监听
   * @param source 触发重启的来源，'manual' 表示手动触发, 'error' 表示错误后自动恢复
   */
  public async restartListening(source: 'manual' | 'error' = 'error') {
    if (this.isRestarting) {
      this.logWithCooldown('⚠️ 重启已在进行中，跳过重复重启');
      return;
    }

    this.isRestarting = true;
    if (source === 'manual') {
      console.log('🔄 手动触发: 重新加载合约监听器...');
    } else {
      console.log('🔄 错误恢复: 重新启动事件监听...');
    }

    try {
      await this.stopListening();
      // 等待1秒，确保旧的监听器完全停止
      // await new Promise(resolve => setTimeout(resolve, 1000)); // await stopListening() 已经是异步，无需额外等待
      await this.startListening();
      console.log('✅ 事件监听器已成功重启');
    } catch (error) {
      console.error('❌ 重启事件监听失败:', error);
    } finally {
      this.isRestarting = false;
    }
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
export const stopContractEventListener = async () => {
  await contractEventListener.stopListening();
};

// 导出手动重启函数，用于在创建新合约后刷新监听列表
export const reloadContractListeners = () => {
  return contractEventListener.restartListening('manual');
};

// 导出手动同步函数
export const syncContractTime = (contractAddress: string, agentId: string) => {
  return contractEventListener.syncContractTime(contractAddress, agentId);
};
