/**
 * 任务处理工具函数
 * 统一处理分发任务的合并、状态计算等逻辑
 */

// 任务接口定义
export interface TaskTransaction {
  type: 'creator' | 'iao' | 'liquidity' | 'airdrop' | 'mining' | 'burn';
  amount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  toAddress: string | null;
  error?: string;
  batchResult?: {
    completedCount: number;
    failedCount: number;
    transactions: Array<{
      txHash: string;
      status: 'success' | 'failed';
      error?: string;
    }>;
  };
}

export interface DistributionTask {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  agentId: string;
  result?: {
    metadata?: any;
    transactions?: TaskTransaction[];
    error?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface MergedTaskResult {
  task: DistributionTask;
  transactions: TaskTransaction[];
  completedSteps: string[];
  failedSteps: string[];
  finalStatus: 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED' | 'PENDING';
}

/**
 * 合并多个分发任务的交易记录
 * @param tasks 分发任务列表（按时间倒序）
 * @returns 合并后的任务结果
 */
export function mergeDistributionTasks(tasks: DistributionTask[]): MergedTaskResult {
  console.log('🔄 开始合并分发任务:', tasks.length);
  
  if (tasks.length === 0) {
    throw new Error('没有找到分发任务');
  }

  const mergedTransactions: { [key: string]: TaskTransaction } = {};
  const latestTask = tasks[0]; // 使用最新的任务作为基础
  let hasAnyTransactions = false;

  // 遍历所有任务，合并交易记录
  tasks.forEach((task, index) => {
    console.log(`  处理任务 ${index + 1}/${tasks.length}: ID=${task.id}, Status=${task.status}`);
    
    if (task.result?.transactions && Array.isArray(task.result.transactions)) {
      console.log(`    - 找到 ${task.result.transactions.length} 个交易记录`);
      hasAnyTransactions = true;
      
      task.result.transactions.forEach((tx: TaskTransaction) => {
        const txType = tx.type;
        
        // 优先保留成功的交易，如果没有成功的则保留最新的
        if (!mergedTransactions[txType] || tx.status === 'confirmed') {
          if (mergedTransactions[txType] && tx.status === 'confirmed') {
            console.log(`      ⭐ 用成功交易覆盖: ${txType}`);
          } else if (!mergedTransactions[txType]) {
            console.log(`      📝 记录新交易: ${txType} - ${tx.status}`);
          }
          mergedTransactions[txType] = { ...tx };
        }
      });
    } else {
      console.log(`    - 任务无交易记录`);
    }
  });

  // 如果没有找到任何交易记录，返回基础结果
  if (!hasAnyTransactions) {
    console.log('⚠️ 没有找到任何交易记录');
    return {
      task: latestTask,
      transactions: [],
      completedSteps: [],
      failedSteps: [],
      finalStatus: latestTask.status as any || 'PENDING'
    };
  }

  // 计算合并后的状态
  const transactions = Object.values(mergedTransactions);
  const completedSteps = transactions
    .filter(tx => tx.status === 'confirmed')
    .map(tx => tx.type);
  const failedSteps = transactions
    .filter(tx => tx.status === 'failed')
    .map(tx => tx.type);
  
  let finalStatus: 'COMPLETED' | 'PARTIAL_FAILED' | 'FAILED' | 'PENDING' = 'COMPLETED';
  if (failedSteps.length > 0 && completedSteps.length > 0) {
    finalStatus = 'PARTIAL_FAILED';
  } else if (failedSteps.length > 0) {
    finalStatus = 'FAILED';
  } else if (completedSteps.length === 0) {
    finalStatus = 'PENDING';
  }

  console.log(`🎯 合并完成: ${transactions.length} 个交易，${completedSteps.length} 成功，${failedSteps.length} 失败`);

  // 返回合并后的结果
  const mergedTask: DistributionTask = {
    ...latestTask,
    status: finalStatus,
    result: {
      ...latestTask.result,
      transactions: transactions,
      status: finalStatus
    }
  };

  return {
    task: mergedTask,
    transactions,
    completedSteps,
    failedSteps,
    finalStatus
  };
}

/**
 * 从任务列表中获取已完成的步骤
 * @param tasks 分发任务列表
 * @returns 已完成的步骤列表
 */
export function getCompletedStepsFromTasks(tasks: DistributionTask[]): string[] {
  const mergedResult = mergeDistributionTasks(tasks);
  return mergedResult.completedSteps;
}

/**
 * 从任务列表中获取失败的步骤
 * @param tasks 分发任务列表
 * @returns 失败的步骤列表
 */
export function getFailedStepsFromTasks(tasks: DistributionTask[]): string[] {
  const mergedResult = mergeDistributionTasks(tasks);
  return mergedResult.failedSteps;
}

/**
 * 检查特定步骤的状态
 * @param tasks 分发任务列表
 * @param stepType 步骤类型
 * @returns 步骤状态信息
 */
export function getStepStatus(tasks: DistributionTask[], stepType: string): {
  status: 'completed' | 'failed' | 'pending';
  transaction?: TaskTransaction;
} {
  const mergedResult = mergeDistributionTasks(tasks);
  const transaction = mergedResult.transactions.find(tx => tx.type === stepType);
  
  if (!transaction) {
    return { status: 'pending' };
  }
  
  const status = transaction.status === 'confirmed' ? 'completed' : 
                 transaction.status === 'failed' ? 'failed' : 'pending';
  
  return { status, transaction };
}

/**
 * 验证任务是否为分发任务
 * @param task 任务对象
 * @returns 是否为分发任务
 */
export function isDistributionTask(task: any): task is DistributionTask {
  return task && task.type === 'DISTRIBUTE_TOKENS';
}

/**
 * 过滤出分发任务
 * @param tasks 任务列表
 * @returns 分发任务列表
 */
export function filterDistributionTasks(tasks: any[]): DistributionTask[] {
  return tasks.filter(isDistributionTask);
}

// ============ 后端数据库查询工具 ============

/**
 * 从数据库获取Agent的所有分发任务并合并
 * @param agentId Agent ID
 * @returns 合并后的任务结果
 */
export async function getMergedDistributionTasksFromDB(agentId: string): Promise<MergedTaskResult | null> {
  const { prisma } = await import('@/lib/prisma');

  // 获取所有分发任务
  const tasks = await prisma.task.findMany({
    where: {
      agentId,
      type: 'DISTRIBUTE_TOKENS'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (tasks.length === 0) {
    return null;
  }

  // 转换为标准格式
  const distributionTasks: DistributionTask[] = tasks.map(task => ({
    id: task.id,
    type: task.type,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    startedAt: task.startedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
    agentId: task.agentId,
    result: task.result ? JSON.parse(task.result) : undefined
  }));

  // 应用合并逻辑
  return mergeDistributionTasks(distributionTasks);
}

/**
 * 从数据库获取已完成的分发步骤
 * @param agentId Agent ID
 * @returns 已完成的步骤列表
 */
export async function getCompletedStepsFromDB(agentId: string): Promise<string[]> {
  const mergedResult = await getMergedDistributionTasksFromDB(agentId);
  return mergedResult?.completedSteps || [];
}

/**
 * 从数据库获取失败的分发步骤
 * @param agentId Agent ID
 * @returns 失败的步骤列表
 */
export async function getFailedStepsFromDB(agentId: string): Promise<string[]> {
  const mergedResult = await getMergedDistributionTasksFromDB(agentId);
  return mergedResult?.failedSteps || [];
}
