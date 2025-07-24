'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { LocalAgent } from '@/types/agent';
import { mergeDistributionTasks, filterDistributionTasks } from '@/lib/task-utils';
import { useTranslations } from 'next-intl'; // 添加翻译支持

interface TokenDistributionModalProps {
  agent: LocalAgent;
  onStatusUpdate?: () => void;
}

interface DistributionTransaction {
  type: string;
  amount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  toAddress: string;
  error?: string;
  percentage?: number;
  description?: string;
}

interface DistributionResult {
  code: number;
  message: string;
  data?: {
    transactions: DistributionTransaction[];
    totalDistributed: string;
    currentStep?: number;
    totalSteps?: number;
    stepName?: string;
  };
}

export const TokenDistributionModal = ({ agent, onStatusUpdate }: TokenDistributionModalProps) => {
  const t = useTranslations('tokenDistribution'); // 使用韩语翻译
  const [isOpen, setIsOpen] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);
  const [distributionTask, setDistributionTask] = useState<any>(null);
  const [isResultExpanded, setIsResultExpanded] = useState(false);
  const { toast } = useToast();



  // 获取分发任务状态
  const fetchDistributionTask = useCallback(async () => {
    try {
      console.log('🔍 [DEBUG] 开始获取分发任务状态 - Agent ID:', agent.id);
      const response = await fetch(`/api/agents/${agent.id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const response_data = await response.json();
        console.log('🔍 [DEBUG] Distribution task API response:', response_data, response_data.code === 200 , response_data.data, Array.isArray(response_data.data.tasks) );

        if (response_data.code === 200 && response_data.data && Array.isArray(response_data.data.tasks)) {
          console.log('🔍 [DEBUG] 找到的任务列表:', response_data.data.tasks);

          // 获取所有DISTRIBUTE_TOKENS任务
          const distributeTasks = filterDistributionTasks(response_data.data.tasks);
          console.log('🔍 [DEBUG] 找到的分发任务数量:', distributeTasks.length);



          if (distributeTasks.length > 0) {
            // 应用合并逻辑：合并所有分发任务的交易记录
            const mergedResult = mergeDistributionTasks(distributeTasks);
            console.log('🔍 [DEBUG] 合并后的任务:', mergedResult.task);

            setDistributionTask(mergedResult.task);

            // 如果任务完成、失败或部分失败，解析结果
            if (mergedResult.task.status === 'COMPLETED' || mergedResult.task.status === 'FAILED' || mergedResult.task.status === 'PARTIAL_FAILED') {
              let parsedResult = null;
              if (mergedResult.task.result) {
                try {
                  parsedResult = typeof mergedResult.task.result === 'string'
                    ? JSON.parse(mergedResult.task.result)
                    : mergedResult.task.result;
                  console.log('🔍 [DEBUG] 解析任务结果成功:', parsedResult);
                } catch (error) {
                  console.error('🔍 [DEBUG] 解析任务结果失败:', error);
                }
              }

              console.log('🔍 [DEBUG] 设置分发结果 - 任务状态:', mergedResult.task.status);
              console.log('🔍 [DEBUG] 解析的结果数据:', parsedResult);

              if (mergedResult.task.status === 'COMPLETED') {
                const resultToSet = {
                  code: 200,
                  message: t('distributionCompleted'),
                  data: parsedResult
                };
                console.log('🔍 [DEBUG] 即将设置的 distributionResult (COMPLETED):', resultToSet);
                setDistributionResult(resultToSet);
              } else if (mergedResult.task.status === 'FAILED') {
                const resultToSet = {
                  code: 500,
                  message: t('distributionFailed'),
                  data: parsedResult
                };
                console.log('🔍 [DEBUG] 即将设置的 distributionResult (FAILED):', resultToSet);
                setDistributionResult(resultToSet);
              } else if (mergedResult.task.status === 'PARTIAL_FAILED') {
                const resultToSet = {
                  code: 206, // 206 Partial Content
                  message: t('distributionPartialSuccess'),
                  data: parsedResult
                };
                console.log('🔍 [DEBUG] 即将设置的 distributionResult (PARTIAL_FAILED):', resultToSet);
                setDistributionResult(resultToSet);
              }
            }
          } else {
            console.log('📝 No DISTRIBUTE_TOKENS task found');
            setDistributionTask(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch distribution task:', error);
    }
  }, [agent.id]);

  // 轮询分发任务状态 - 只在 PENDING 或 PROCESSING 时轮询
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (distributionTask && (distributionTask.status === 'PENDING' || distributionTask.status === 'PROCESSING')) {
      console.log(`🔄 开始轮询任务状态: ${distributionTask.status}`);
      interval = setInterval(() => {
        console.log('📡 轮询获取任务状态...');
        fetchDistributionTask();
      }, 5000);
    } else if (distributionTask) {
      console.log(`⏹️ 停止轮询，任务状态: ${distributionTask.status}`);
    }

    return () => {
      if (interval) {
        console.log('🛑 清理轮询定时器');
        clearInterval(interval);
      }
    };
  }, [distributionTask?.status]); // 移除 fetchDistributionTask 依赖，避免不必要的重新渲染

  // 监听任务状态变化，仅在任务完成时触发主页面状态更新
  useEffect(() => {
    if (distributionTask) {
      // 只有任务完成时才触发主页面状态更新，避免重试时的不必要刷新
      if (distributionTask.status === 'COMPLETED') {
        console.log(`🔄 任务${distributionTask.status}，触发主页面状态更新`);
        onStatusUpdate?.();
      }
    }
  }, [distributionTask?.status]); // 移除 onStatusUpdate 依赖，避免无限循环

  // 当模态框打开时，获取任务状态
  useEffect(() => {
    if (isOpen) {
      fetchDistributionTask();
    }
  }, [isOpen]); // 移除 fetchDistributionTask 依赖，避免不必要的重新渲染

  // 辅助函数：检查具体步骤的状态
  const getStepStatusFromTransactions = (step: string, isProcessing: boolean = false) => {
    if (!distributionTask?.result?.transactions) {
      return null;
    }

    console.log(`🔍 [DEBUG] ${step} - 检查交易列表:`, distributionTask.result.transactions);

    // 对于 liquidity 步骤，可能有多个交易
    if (step === 'liquidity') {
      const liquidityTransactions = distributionTask.result.transactions.filter((tx: any) => tx.type === step);
      console.log(`🔍 [DEBUG] ${step} - 找到的流动性交易:`, liquidityTransactions);

      if (liquidityTransactions.length > 0) {
        const hasConfirmed = liquidityTransactions.some((tx: any) => tx.status === 'confirmed');
        const hasFailed = liquidityTransactions.some((tx: any) => tx.status === 'failed');
        const hasPending = liquidityTransactions.some((tx: any) => tx.status === 'pending');

        const status = {
          completed: hasConfirmed && !hasFailed,
          inProgress: isProcessing ? (!hasConfirmed && !hasFailed) || hasPending : hasPending,
          failed: hasFailed,
          text: hasConfirmed && !hasFailed ? t('completed') :
                hasFailed ? t('failed') :
                (isProcessing || hasPending) ? t('processing') : t('waiting')
        };
        console.log(`🔍 [DEBUG] ${step} - 流动性状态汇总:`, status);
        return status;
      }
    } else {
      // 其他步骤的处理
      const transaction = distributionTask.result.transactions.find((tx: any) => tx.type === step);
      console.log(`🔍 [DEBUG] ${step} - 找到的交易:`, transaction);
      if (transaction) {
        const status = {
          completed: transaction.status === 'confirmed',
          inProgress: isProcessing ? transaction.status === 'pending' : transaction.status === 'pending',
          failed: transaction.status === 'failed',
          text: transaction.status === 'confirmed' ? t('completed') :
                transaction.status === 'failed' ? t('failed') :
                (isProcessing || transaction.status === 'pending') ? t('processing') : t('waiting')
        };
        console.log(`🔍 [DEBUG] ${step} - 返回状态:`, status);
        return status;
      }
    }

    return null;
  };

  // 获取分发步骤状态
  const getDistributionStepStatus = (step: string) => {
    console.log(`🔍 [DEBUG] getDistributionStepStatus - step: ${step}`);
    console.log(`🔍 [DEBUG] distributionTask:`, distributionTask);
    console.log(`🔍 [DEBUG] distributionResult:`, distributionResult);
    console.log(`🔍 [DEBUG] isDistributing:`, isDistributing);

    // 如果有分发任务，优先根据任务状态判断
    if (distributionTask) {
      const isTaskProcessing = distributionTask.status === 'PENDING' || distributionTask.status === 'PROCESSING';
      const isTaskCompleted = distributionTask.status === 'COMPLETED';
      const isTaskFailed = distributionTask.status === 'FAILED';

      console.log(`🔍 [DEBUG] 任务状态判断 - step: ${step}`, {
        taskStatus: distributionTask.status,
        isTaskProcessing,
        isTaskCompleted,
        isTaskFailed
      });

      // 如果任务正在处理中，检查具体步骤的状态
      if (isTaskProcessing) {
        console.log(`🔍 [DEBUG] ${step} - 任务处理中，检查具体步骤状态`);

        const stepStatus = getStepStatusFromTransactions(step, true);
        if (stepStatus) {
          return stepStatus;
        }

        // 如果没有具体的交易信息，默认显示处理中
        return {
          completed: false,
          inProgress: true,
          failed: false,
          text: t('processing')
        };
      }

      // 如果任务失败或部分失败，检查具体步骤的状态
      if (isTaskFailed || distributionTask.status === 'PARTIAL_FAILED') {
        console.log(`🔍 [DEBUG] ${step} - 任务失败或部分失败状态:`, distributionTask.status);

        const stepStatus = getStepStatusFromTransactions(step, false);
        if (stepStatus) {
          return stepStatus;
        }

        // 如果没有具体的交易信息，根据任务状态显示
        if (distributionTask.status === 'PARTIAL_FAILED') {
          return {
            completed: false,
            inProgress: false,
            failed: false, // 部分失败时不全部标记为失败
            text: t('waiting')
          };
        } else {
          return {
            completed: false,
            inProgress: false,
            failed: true,
            text: t('failed')
          };
        }
      }

      // 如果任务完成，从结果中获取具体状态
      if (isTaskCompleted && distributionResult?.data?.transactions) {
        console.log(`🔍 [DEBUG] ${step} - 任务完成，查找交易信息`);
        console.log(`🔍 [DEBUG] ${step} - 交易列表:`, distributionResult.data.transactions);
        const transaction = distributionResult.data.transactions.find(tx =>
          tx.type === step
        );

        console.log(`🔍 [DEBUG] ${step} - 找到的交易:`, transaction);

        if (transaction) {
          const status = {
            completed: transaction.status === 'confirmed',
            inProgress: transaction.status === 'pending',
            failed: transaction.status === 'failed',
            text: transaction.status === 'confirmed' ? t('completed') :
                  transaction.status === 'pending' ? t('processing') :
                  transaction.status === 'failed' ? t('failed') : t('waiting')
          };
          console.log(`🔍 [DEBUG] ${step} - 返回状态:`, status);
          return status;
        } else {
          console.log(`🔍 [DEBUG] ${step} - 未找到对应交易`);
        }
      }
    }

    // 如果没有任务或任务未开始，根据agent状态判断
    if (step === 'creator' || step === 'airdrop' || step === 'mining') {
      return {
        completed: !!agent.tokensDistributed,
        inProgress: isDistributing && !distributionTask,
        failed: false,
        text: agent.tokensDistributed ? t('completed') :
              (isDistributing && !distributionTask) ? t('processing') : t('waiting')
      };
    }

    if (step === 'liquidity') {
      return {
        completed: !!agent.liquidityAdded,
        inProgress: false,
        failed: false,
        text: agent.liquidityAdded ? t('completed') : t('waiting')
      };
    }



    return {
      completed: false,
      inProgress: false,
      failed: false,
      text: t('waiting')
    };
  };



  // 分发比例配置
  const DISTRIBUTION_RATIOS = {
    CREATOR: 33,    // 33%
    IAO: 15,        // 15%
    LIQUIDITY: 10,  // 10% (自动添加到DBCSwap)
    AIRDROP: 2,     // 2%
    MINING: 40      // 40%
  };



  const handleDistribute = async () => {
    console.log('🔍 [DEBUG] handleDistribute 开始执行');
    console.log('🔍 [DEBUG] Agent 信息:', {
      id: agent.id,
      tokenAddress: agent.tokenAddress,
      totalSupply: agent.totalSupply
    });

    if (!agent.tokenAddress || !agent.totalSupply) {
      console.log('🔍 [DEBUG] 代币地址或总供应量未设置');
      toast({
        title: t('error'),
        description: t('tokenOrSupplyNotSet'),
        variant: 'destructive',
      });
      return;
    }

    setIsDistributing(true);
    setDistributionResult(null);

    try {
      console.log('🚀 [DEBUG] 开始代币分发请求...');

      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔍 [DEBUG] 未找到认证 token');
        toast({
          title: t('error'),
          description: t('walletAuthRequired'),
          variant: 'destructive',
        });
        return;
      }

      // 判断是重试还是新分发
      const isRetry = distributionTask && (distributionTask.status === 'FAILED' || distributionTask.status === 'PARTIAL_FAILED');

      let response;
      if (isRetry) {
        console.log('🔄 [DEBUG] 执行重试操作...');
        const requestBody = {
          taskId: distributionTask.id,
          agentId: agent.id,
        };
        console.log('🔍 [DEBUG] 重试请求体:', requestBody);

        response = await fetch('/api/token/distribute', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        console.log('🆕 [DEBUG] 执行新分发操作...');
        const requestBody = {
          agentId: agent.id,
          totalSupply: agent.totalSupply.toString(),
          tokenAddress: agent.tokenAddress,
        };
        console.log('🔍 [DEBUG] 新分发请求体:', requestBody);

        response = await fetch('/api/token/distribute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      }

      const result = await response.json();
      console.log('🔍 [DEBUG] 分发提交结果:', result);

      if (result.code === 200) {
        console.log('🔍 [DEBUG] ✅ 代币分发任务提交成功');
        toast({
          title: t('distributionTaskSubmitted'),
          description: t('taskProcessingInBackground'),
        });

        // 重置提交状态，让任务状态接管UI控制
        setIsDistributing(false);

        // 获取最新任务状态，开始轮询
        console.log('🔍 [DEBUG] 开始获取任务状态...');
        await fetchDistributionTask();
        console.log('🔍 [DEBUG] 📝 任务提交完成，开始轮询任务状态');
      } else {
        console.log('🔍 [DEBUG] ❌ 任务提交失败:', result);
        throw new Error(result.message || t('taskSubmissionFailed'));
      }
    } catch (error: any) {
      console.error('🔍 [DEBUG] ❌ 代币分发任务提交错误:', error);
      toast({
        title: t('distributionTaskSubmissionFailed'),
        description: error.message || t('networkError'),
        variant: 'destructive',
      });
      // 只有在出错时才设置 isDistributing 为 false
      setIsDistributing(false);
    }
  };

  const formatNumber = (value: string | number): string => {
    if (!value || value === '0') return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };

  const calculateAmount = (percentage: number): string => {
    if (!agent.totalSupply) return '0';
    const total = agent.totalSupply;
    return formatNumber((total * percentage / 100).toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!agent.tokenAddress || !agent.totalSupply}
        >
          {t('tokenDistribution')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden w-full">
        <DialogHeader>
          <DialogTitle>{t('tokenDistribution')}</DialogTitle>
          <DialogDescription>
            {t('distributeTokensAddLiquidity')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-2">
            <h4 className="font-medium">{t('basicInfo')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{t('agentName')}:</span>
                <span className="ml-2 font-medium">{agent.name}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('tokenSymbol')}:</span>
                <span className="ml-2 font-medium">{agent.symbol}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">{t('tokenAddress')}:</span>
                <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
                  {agent.tokenAddress}
                </code>
              </div>
              <div>
                <span className="text-gray-600">{t('totalSupply')}:</span>
                <span className="ml-2 font-medium">{formatNumber(agent.totalSupply || 0)}</span>
              </div>
            </div>
          </div>

          {/* 分发计划和进度 */}
          <div className="space-y-2">
            <h4 className="font-medium">{t('distributionPlan')}</h4>
            <div className="space-y-2 text-sm">
              {/* IAO合约分发 */}
              <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-white dark:text-black">🏦 {t('iaoContract')} ({DISTRIBUTION_RATIOS.IAO}%)</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    {t('autoCompleted')}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.IAO)}</span>
              </div>

              {/* 创建者分发 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('creator').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('creator').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('creator').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-white dark:text-black">👤 {t('creator')} ({DISTRIBUTION_RATIOS.CREATOR}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('creator').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('creator').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('creator').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('creator').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.CREATOR)}</span>
              </div>

              {/* 空投分发 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('airdrop').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('airdrop').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('airdrop').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-white dark:text-black">🎁 {t('airdropWallet')} ({DISTRIBUTION_RATIOS.AIRDROP}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('airdrop').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('airdrop').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('airdrop').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('airdrop').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.AIRDROP)}</span>
              </div>

              {/* AI挖矿分发 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('mining').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('mining').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('mining').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-white dark:text-black">⛏️ {t('aiMiningContract')} ({DISTRIBUTION_RATIOS.MINING}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('mining').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('mining').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('mining').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('mining').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.MINING)}</span>
              </div>

              {/* 流动性添加 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('liquidity').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('liquidity').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('liquidity').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-white dark:text-black">💧 {t('liquidity')} ({DISTRIBUTION_RATIOS.LIQUIDITY}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('liquidity').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('liquidity').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('liquidity').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('liquidity').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.LIQUIDITY)}</span>
              </div>
            </div>
          </div>

          {/* 分发进度和结果 */}
          {(isDistributing || distributionResult) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{t('distributionStatus')}</h4>
                <button
                  onClick={() => setIsResultExpanded(!isResultExpanded)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span>{isResultExpanded ? t('collapse') : t('expand')}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isResultExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* 简化状态摘要 - 折叠时显示 */}
              {!isResultExpanded && distributionResult && (
                <div className={`p-3 rounded-lg ${
                  distributionResult.code === 200 ? 'bg-green-50 border border-green-200' :
                  distributionResult.code === 206 ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${
                      distributionResult.code === 200 ? 'text-green-600' :
                      distributionResult.code === 206 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {distributionResult.code === 200 ? '✅' :
                       distributionResult.code === 206 ? '⚠️' : '❌'}
                    </span>
                    <span className="font-medium text-sm text-white dark:text-black">{distributionResult.message}</span>
                  </div>
                </div>
              )}

              {/* 可折叠的分发详情 */}
              {isResultExpanded && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* 分发进度指示器 */}
                  {isDistributing && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-600">{t('distributingTokens')}</span>
                      </div>

                      {distributionResult?.data?.currentStep && distributionResult?.data?.totalSteps && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{t('progress')}</span>
                            <span>{distributionResult.data.currentStep} / {distributionResult.data.totalSteps}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(distributionResult.data.currentStep / distributionResult.data.totalSteps) * 100}%`
                              }}
                            ></div>
                          </div>
                          {distributionResult.data.stepName && (
                            <div className="text-xs text-gray-600">
                              {t('currentStep')}: {distributionResult.data.stepName}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 分发结果 */}
                  {distributionResult && (
                    <div className={`p-4 rounded-lg ${
                      distributionResult.code === 200 ? 'bg-green-50 border border-green-200' :
                      distributionResult.code === 206 ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-lg ${
                          distributionResult.code === 200 ? 'text-green-600' :
                          distributionResult.code === 206 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {distributionResult.code === 200 ? '✅' :
                           distributionResult.code === 206 ? '⚠️' : '❌'}
                        </span>
                        <span className="font-medium">{distributionResult.message}</span>
                      </div>

                      {distributionResult.data?.transactions && (
                        <div className="space-y-3 w-full" style={{maxWidth: '100%', overflow: 'hidden'}}>
                          <div className="text-sm font-medium">{t('distributionDetails')}:</div>
                          {distributionResult.data.transactions.map((tx, index) => (
                            <div key={index} className="bg-white p-3 rounded border w-full" style={{maxWidth: '100%', overflow: 'hidden'}}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1" style={{minWidth: 0, maxWidth: '100%'}}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{tx.type}</span>
                                    {tx.percentage && (
                                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {tx.percentage}%
                                      </span>
                                    )}
                                  </div>
                                  {tx.description && (
                                    <div className="text-xs text-gray-600 mb-2">{tx.description}</div>
                                  )}
                                  <div className="text-xs text-gray-600">
                                    {t('amount')}: {formatNumber(tx.amount)}
                                  </div>
                                  <div className="text-xs text-gray-600" style={{wordBreak: 'break-all', maxWidth: '100%'}}>
                                    {t('address')}: <span className="font-mono">{tx.toAddress}</span>
                                  </div>
                                  <div className="text-xs text-gray-600" style={{wordBreak: 'break-all', maxWidth: '100%'}}>
                                    Hash: <span className="font-mono">{tx.txHash}</span>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                                  tx.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {tx.status === 'confirmed' ? t('confirmed') :
                                   tx.status === 'failed' ? t('failed') : t('processing')}
                                </span>
                              </div>
                              {tx.error && (
                                <div className="text-xs text-red-600 p-2 bg-red-50 rounded w-full" style={{maxWidth: '100%', overflow: 'hidden'}}>
                                  <div style={{wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}>❌ {tx.error}</div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* 分发汇总 */}
                          {distributionResult.data.totalDistributed && (
                            <div className="border-t pt-3 mt-3">
                              <div className="text-sm font-medium text-gray-700">
                                {t('totalDistributed')}: {formatNumber(distributionResult.data.totalDistributed)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('close')}
          </Button>

          <Button
            onClick={handleDistribute}
            disabled={
              isDistributing ||
              !agent.tokenAddress ||
              !agent.totalSupply ||
              (distributionTask && (distributionTask.status === 'PENDING' || distributionTask.status === 'PROCESSING')) ||
              distributionTask?.status === 'COMPLETED'
            }
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isDistributing
              ? t('submitting')
              : distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING'
              ? t('distributing')
              : distributionTask?.status === 'COMPLETED'
              ? t('completed')
              : distributionTask?.status === 'FAILED'
              ? t('retryDistribution')
              : distributionTask?.status === 'PARTIAL_FAILED'
              ? t('retryFailedSteps')
              : t('startDistribution')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
