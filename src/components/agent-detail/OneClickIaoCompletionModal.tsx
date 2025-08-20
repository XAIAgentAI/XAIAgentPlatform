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
import { useTranslations } from 'next-intl';
import { copyToClipboard } from '@/lib/utils';

interface OneClickIaoCompletionModalProps {
  agent: LocalAgent;
  onStatusUpdate?: () => void;
  tokenCreationTask: any;
  distributionTask: any;
  isCreating: boolean;
  onCreateToken: () => void;
}

interface IaoStep {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export const OneClickIaoCompletionModal = ({ 
  agent, 
  onStatusUpdate,
  tokenCreationTask,
  distributionTask,
  isCreating,
  onCreateToken
}: OneClickIaoCompletionModalProps) => {
  const t = useTranslations('tokenDistribution');
  const tIao = useTranslations('iaoPool');
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<IaoStep[]>([
    {
      id: 'createToken',
      name: '创建代币',
      icon: '🪙',
      description: '部署DRC20代币合约',
      status: 'waiting'
    },
    {
      id: 'distributeTokens',
      name: '代币分发',
      icon: '📤',
      description: '分发代币到各个地址并添加流动性',
      status: 'waiting'
    },
    {
      id: 'burnTokens',
      name: '销毁代币',
      icon: '🔥',
      description: '销毁剩余的XAA代币',
      status: 'waiting'
    }
  ]);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const { toast } = useToast();

  // 检查当前状态并初始化步骤
  const initializeSteps = useCallback(() => {
    const newSteps = [...steps];
    
    // 步骤1: 创建代币
    if (agent.tokenAddress) {
      newSteps[0].status = 'completed';
    } else if (isCreating || tokenCreationTask?.status === 'PENDING' || tokenCreationTask?.status === 'PROCESSING') {
      newSteps[0].status = 'processing';
    } else if (tokenCreationTask?.status === 'FAILED') {
      newSteps[0].status = 'failed';
      newSteps[0].error = tokenCreationTask.result?.message || '代币创建失败';
    }

    // 步骤2: 代币分发
    if (agent.tokensDistributed && agent.liquidityAdded) {
      newSteps[1].status = 'completed';
    } else if (distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING') {
      newSteps[1].status = 'processing';
    } else if (distributionTask?.status === 'FAILED') {
      newSteps[1].status = 'failed';
      newSteps[1].error = distributionTask.result?.message || '代币分发失败';
    }

    // 步骤3: 销毁代币
    if (agent.tokensBurned) {
      newSteps[2].status = 'completed';
    }

    setSteps(newSteps);

    // 检查是否所有步骤都完成
    const allCompleted = newSteps.every(step => step.status === 'completed');
    setAllTasksCompleted(allCompleted);

    // 设置当前步骤
    const currentStepIndex = newSteps.findIndex(step => 
      step.status === 'waiting' || step.status === 'processing' || step.status === 'failed'
    );
    setCurrentStep(currentStepIndex === -1 ? newSteps.length : currentStepIndex);

  }, [agent, tokenCreationTask, distributionTask, isCreating]);

  // 监听任务状态变化
  useEffect(() => {
    initializeSteps();
  }, [initializeSteps]);

  // 监听模态框打开
  useEffect(() => {
    if (isOpen) {
      initializeSteps();
    }
  }, [isOpen, initializeSteps]);

  // 创建代币
  const executeCreateToken = async () => {
    if (agent.tokenAddress) return true;

    try {
      const newSteps = [...steps];
      newSteps[0].status = 'processing';
      setSteps(newSteps);
      setCurrentStep(0);

      // 调用创建代币函数
      await onCreateToken();
      
      // 等待任务完成
      return await waitForTokenCreation();
    } catch (error) {
      const newSteps = [...steps];
      newSteps[0].status = 'failed';
      newSteps[0].error = error instanceof Error ? error.message : '创建代币失败';
      setSteps(newSteps);
      return false;
    }
  };

  // 等待代币创建完成
  const waitForTokenCreation = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const maxAttempts = 60; // 最多等待5分钟
      let attempts = 0;

      const checkStatus = async () => {
        attempts++;
        
        try {
          // 调用状态更新函数
          onStatusUpdate?.();
          
          // 检查任务状态
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/agents/${agent.id}/tasks`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const taskData = await response.json();
            if (taskData.code === 200 && taskData.data?.tasks) {
              const creationTask = taskData.data.tasks.find((task: any) => 
                task.type === 'CREATE_TOKEN'
              );

              if (creationTask) {
                if (creationTask.status === 'COMPLETED') {
                  const newSteps = [...steps];
                  newSteps[0].status = 'completed';
                  setSteps(newSteps);
                  resolve(true);
                  return;
                }

                if (creationTask.status === 'FAILED') {
                  const newSteps = [...steps];
                  newSteps[0].status = 'failed';
                  newSteps[0].error = creationTask.result?.message || '代币创建失败';
                  setSteps(newSteps);
                  resolve(false);
                  return;
                }
              }
            }
          }

          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[0].status = 'failed';
            newSteps[0].error = '创建代币超时';
            setSteps(newSteps);
            resolve(false);
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[0].status = 'failed';
            newSteps[0].error = '检查代币创建状态失败';
            setSteps(newSteps);
            resolve(false);
          }
        }
      };

      checkStatus();
    });
  };

  // 分发代币
  const executeDistributeTokens = async () => {
    if (agent.tokensDistributed && agent.liquidityAdded) return true;

    try {
      const newSteps = [...steps];
      newSteps[1].status = 'processing';
      setSteps(newSteps);
      setCurrentStep(1);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('需要钱包认证');
      }

      // 调用代币分发API
      const response = await fetch('/api/token/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentId: agent.id,
          totalSupply: agent.totalSupply?.toString(),
          tokenAddress: agent.tokenAddress,
        }),
      });

      const result = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.message || '代币分发任务提交失败');
      }

      // 等待分发完成
      return await waitForTokenDistribution();
    } catch (error) {
      const newSteps = [...steps];
      newSteps[1].status = 'failed';
      newSteps[1].error = error instanceof Error ? error.message : '代币分发失败';
      setSteps(newSteps);
      return false;
    }
  };

  // 等待代币分发完成
  const waitForTokenDistribution = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const maxAttempts = 60; // 最多等待5分钟
      let attempts = 0;

      const checkStatus = async () => {
        attempts++;
        
        try {
          // 获取分发任务状态
          const response = await fetch(`/api/agents/${agent.id}/tasks`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.ok) {
            const taskData = await response.json();
            if (taskData.code === 200 && taskData.data?.tasks) {
              const distributeTasks = taskData.data.tasks.filter((task: any) => 
                task.type === 'DISTRIBUTE_TOKENS'
              );

              if (distributeTasks.length > 0) {
                const latestTask = distributeTasks[distributeTasks.length - 1];
                
                if (latestTask.status === 'COMPLETED') {
                  const newSteps = [...steps];
                  newSteps[1].status = 'completed';
                  setSteps(newSteps);
                  resolve(true);
                  return;
                }

                if (latestTask.status === 'FAILED') {
                  const newSteps = [...steps];
                  newSteps[1].status = 'failed';
                  newSteps[1].error = latestTask.result?.message || '代币分发失败';
                  setSteps(newSteps);
                  resolve(false);
                  return;
                }
              }
            }
          }

          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[1].status = 'failed';
            newSteps[1].error = '代币分发超时';
            setSteps(newSteps);
            resolve(false);
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[1].status = 'failed';
            newSteps[1].error = '检查代币分发状态失败';
            setSteps(newSteps);
            resolve(false);
          }
        }
      };

      checkStatus();
    });
  };

  // 销毁代币
  const executeBurnTokens = async () => {
    if (agent.tokensBurned) return true;

    try {
      const newSteps = [...steps];
      newSteps[2].status = 'processing';
      setSteps(newSteps);
      setCurrentStep(2);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('需要钱包认证');
      }

      // 调用销毁代币API
      const response = await fetch(`/api/agents/${agent.id}/burn-xaa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          iaoContractAddress: agent.iaoContractAddress,
        }),
      });

      const result = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.message || '销毁代币任务提交失败');
      }

      // 等待销毁完成
      return await waitForTokenBurn();
    } catch (error) {
      const newSteps = [...steps];
      newSteps[2].status = 'failed';
      newSteps[2].error = error instanceof Error ? error.message : '销毁代币失败';
      setSteps(newSteps);
      return false;
    }
  };

  // 等待代币销毁完成
  const waitForTokenBurn = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const maxAttempts = 60; // 最多等待5分钟
      let attempts = 0;

      const checkStatus = async () => {
        attempts++;
        
        try {
          // 调用状态更新函数
          onStatusUpdate?.();
          
          // 检查销毁任务状态
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/agents/${agent.id}/tasks`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const taskData = await response.json();
            if (taskData.code === 200 && taskData.data?.tasks) {
              const burnTask = taskData.data.tasks.find((task: any) => 
                task.type === 'BURN_XAA'
              );

              if (burnTask) {
                if (burnTask.status === 'COMPLETED') {
                  const newSteps = [...steps];
                  newSteps[2].status = 'completed';
                  setSteps(newSteps);
                  setAllTasksCompleted(true);
                  resolve(true);
                  return;
                }

                if (burnTask.status === 'FAILED') {
                  const newSteps = [...steps];
                  newSteps[2].status = 'failed';
                  newSteps[2].error = burnTask.result?.message || '销毁代币失败';
                  setSteps(newSteps);
                  resolve(false);
                  return;
                }
              }
            }
          }

          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[2].status = 'failed';
            newSteps[2].error = '销毁代币超时';
            setSteps(newSteps);
            resolve(false);
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[2].status = 'failed';
            newSteps[2].error = '检查代币销毁状态失败';
            setSteps(newSteps);
            resolve(false);
          }
        }
      };

      checkStatus();
    });
  };

  // 一键完成所有步骤
  const handleOneClickCompletion = async () => {
    if (allTasksCompleted) return;

    setIsProcessing(true);

    try {
      // 步骤1: 创建代币
      if (!agent.tokenAddress) {
        toast({
          title: '开始创建代币',
          description: '正在部署DRC20代币合约...',
        });

        const step1Success = await executeCreateToken();
        if (!step1Success) {
          toast({
            title: '创建代币失败',
            description: '请检查错误信息并重试',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: '代币创建成功',
          description: '代币合约部署完成',
        });
      }

      // 步骤2: 代币分发
      if (!agent.tokensDistributed || !agent.liquidityAdded) {
        toast({
          title: '开始代币分发',
          description: '正在分发代币并添加流动性...',
        });

        const step2Success = await executeDistributeTokens();
        if (!step2Success) {
          toast({
            title: '代币分发失败',
            description: '请检查错误信息并重试',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: '代币分发成功',
          description: '代币分发和流动性添加完成',
        });
      }

      // 步骤3: 销毁代币
      if (!agent.tokensBurned) {
        toast({
          title: '开始销毁代币',
          description: '正在销毁剩余的XAA代币...',
        });

        const step3Success = await executeBurnTokens();
        if (!step3Success) {
          toast({
            title: '销毁代币失败',
            description: '请检查错误信息并重试',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: '销毁代币成功',
          description: 'XAA代币销毁完成',
        });
      }

      // 所有步骤完成
      setAllTasksCompleted(true);
      toast({
        title: '🎉 IAO完成！',
        description: '所有步骤已成功执行，IAO流程完成',
      });

      // 刷新页面状态
      onStatusUpdate?.();

    } catch (error) {
      console.error('一键完成IAO失败:', error);
      toast({
        title: '执行失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 获取步骤状态颜色
  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'processing':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700';
    }
  };

  // 获取步骤状态文本
  const getStepStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: '已完成', color: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' };
      case 'processing':
        return { text: '处理中', color: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200' };
      case 'failed':
        return { text: '失败', color: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200' };
      default:
        return { text: '等待中', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-[#F47521] to-[#E56411] hover:from-[#E56411] hover:to-[#D55201] text-white font-medium shadow-lg"
          disabled={allTasksCompleted}
        >
          {allTasksCompleted ? '✅ IAO已完成' : '🚀 一键完成IAO'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            一键完成IAO流程
          </DialogTitle>
          <DialogDescription>
            自动执行代币创建、分发和销毁的完整流程，无需手动操作多个步骤
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-2">
            <h4 className="font-medium">Agent信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">名称:</span>
                <span className="ml-2 font-medium">{agent.name}</span>
              </div>
              <div>
                <span className="text-gray-600">符号:</span>
                <span className="ml-2 font-medium">{agent.symbol}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">总供应量:</span>
                <span className="ml-2 font-medium">{(agent.totalSupply || 0).toLocaleString()}</span>
              </div>
              {agent.tokenAddress && (
                <div className="col-span-2">
                  <span className="text-gray-600">代币地址:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all flex-1">
                      {agent.tokenAddress}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const ok = await copyToClipboard(agent.tokenAddress || '');
                        toast({
                          title: ok ? '已复制' : '复制失败',
                          duration: 2000,
                          variant: ok ? undefined : 'destructive',
                        });
                      }}
                    >
                      复制
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 执行步骤和进度 */}
          <div className="space-y-2">
            <h4 className="font-medium">执行进度</h4>
            <div className="space-y-3">
              {steps.map((step, index) => {
                const statusInfo = getStepStatusText(step.status);
                const isCurrentStep = currentStep === index && isProcessing;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getStepColor(step.status)} ${
                      isCurrentStep ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{step.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{step.name}</span>
                          {isCurrentStep && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-xs">执行中...</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">{step.description}</div>
                        {step.error && (
                          <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            ❌ {step.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 完成提示 */}
          {allTasksCompleted && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎉</span>
                <span className="font-medium text-green-800 dark:text-green-200">IAO流程已完成！</span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                所有步骤已成功执行，用户现在可以领取代币奖励。
              </div>
            </div>
          )}

          {/* 错误和重试提示 */}
          {steps.some(step => step.status === 'failed') && !isProcessing && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚠️</span>
                <span className="font-medium text-red-800 dark:text-red-200">部分步骤执行失败</span>
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                请检查失败原因，点击重试按钮继续执行剩余步骤。
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
            关闭
          </Button>
          
          {!allTasksCompleted && (
            <Button
              onClick={handleOneClickCompletion}
              disabled={isProcessing}
              className="bg-gradient-to-r from-[#F47521] to-[#E56411] hover:from-[#E56411] hover:to-[#D55201] text-white"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  执行中...
                </>
              ) : steps.some(step => step.status === 'failed') ? (
                '重试失败步骤'
              ) : (
                '开始执行'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};