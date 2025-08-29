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
  miningDeploymentTask?: any;
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
  miningDeploymentTask,
  isCreating,
  onCreateToken
}: OneClickIaoCompletionModalProps) => {
  const t = useTranslations('tokenDistribution');
  const tIao = useTranslations('iaoPool');
  const tOneClick = useTranslations('oneClickIaoCompletion');
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<IaoStep[]>([]);

  // Initialize steps with translations
  const initializeStepsWithTranslations = useCallback(() => {
    return [
      {
        id: 'createToken',
        name: tOneClick('createToken'),
        icon: '🪙',
        description: tOneClick('deployDrc20Contract'),
        status: 'waiting' as const
      },
      {
        id: 'deployMining',
        name: tOneClick('deployMiningContract'),
        icon: '⛏️',
        description: tOneClick('createMiningContractAndRegister'),
        status: 'waiting' as const
      },
      {
        id: 'distributeTokens',
        name: tOneClick('tokenDistribution'),
        icon: '📤',
        description: tOneClick('distributeTokensToAddresses'),
        status: 'waiting' as const
      },
      {
        id: 'burnTokens',
        name: tOneClick('burnTokens'),
        icon: '🔥',
        description: tOneClick('burnRemainingXaaTokens'),
        status: 'waiting' as const
      }
    ];
  }, [tOneClick]);

  // Initialize steps when translations are available
  useEffect(() => {
    if (steps.length === 0) {
      setSteps(initializeStepsWithTranslations());
    }
  }, [initializeStepsWithTranslations, steps.length]);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);
  const { toast } = useToast();

  // 检查当前状态并初始化步骤
  const initializeSteps = useCallback(() => {
    // 如果steps为空，先初始化
    if (steps.length === 0) {
      return;
    }
    
    const newSteps = [...steps];
    
    // 步骤1: 创建代币
    if (agent.tokenAddress) {
      newSteps[0].status = 'completed';
    } else if (isCreating || tokenCreationTask?.status === 'PENDING' || tokenCreationTask?.status === 'PROCESSING') {
      newSteps[0].status = 'processing';
    } else if (tokenCreationTask?.status === 'FAILED') {
      newSteps[0].status = 'failed';
      newSteps[0].error = tokenCreationTask.result?.message || tOneClick('tokenCreationFailed');
    }

    // 步骤2: 部署挖矿合约
    if ((agent as any).miningContractAddress) {
      newSteps[1].status = 'completed';
    } else {
      // 检查是否存在挖矿合约部署任务
      if (miningDeploymentTask?.status === 'COMPLETED') {
        newSteps[1].status = 'completed';
      } else if (miningDeploymentTask?.status === 'PENDING' || miningDeploymentTask?.status === 'PROCESSING') {
        newSteps[1].status = 'processing';
      } else if (miningDeploymentTask?.status === 'FAILED') {
        newSteps[1].status = 'failed';
        newSteps[1].error = miningDeploymentTask.result?.error || tOneClick('miningContractDeploymentFailed');
      }
    }

    // 步骤3: 代币分发
    if (agent.tokensDistributed && agent.liquidityAdded) {
      newSteps[2].status = 'completed';
    } else if (distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING') {
      newSteps[2].status = 'processing';
    } else if (distributionTask?.status === 'FAILED') {
      newSteps[2].status = 'failed';
      newSteps[2].error = distributionTask.result?.message || tOneClick('tokenDistributionFailed');
    }

    // 步骤4: 销毁代币
    if (agent.tokensBurned) {
      newSteps[3].status = 'completed';
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

  }, [agent, tokenCreationTask, distributionTask, miningDeploymentTask, isCreating]);

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
      if (newSteps.length === 0) return false;
      newSteps[0].status = 'processing';
      setSteps(newSteps);
      setCurrentStep(0);

      // 调用创建代币函数
      await onCreateToken();
      
      // 等待任务完成
      return await waitForTokenCreation();
    } catch (error) {
      const newSteps = [...steps];
      if (newSteps.length > 0) {
        newSteps[0].status = 'failed';
        newSteps[0].error = error instanceof Error ? error.message : tOneClick('tokenCreationFailed');
      }
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
                  if (newSteps.length > 0) {
                    newSteps[0].status = 'completed';
                  }
                  setSteps(newSteps);
                  resolve(true);
                  return;
                }

                if (creationTask.status === 'FAILED') {
                  const newSteps = [...steps];
                  if (newSteps.length > 0) {
                    newSteps[0].status = 'failed';
                    newSteps[0].error = creationTask.result?.message || tOneClick('tokenCreationFailed');
                  }
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
            if (newSteps.length > 0) {
              newSteps[0].status = 'failed';
              newSteps[0].error = tOneClick('tokenCreationTimeout');
            }
            setSteps(newSteps);
            resolve(false);
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            if (newSteps.length > 0) {
              newSteps[0].status = 'failed';
              newSteps[0].error = tOneClick('checkTokenCreationStatusFailed');
            }
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
      if (newSteps.length === 0) return false;
      newSteps[2].status = 'processing';
      setSteps(newSteps);
      setCurrentStep(2);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(tOneClick('walletAuthRequired'));
      }

      // 在执行分发前，先获取最新的Agent信息确保tokenAddress已更新
      let currentTokenAddress = agent.tokenAddress;
      if (!currentTokenAddress) {
        console.log('Token address not found in agent, fetching latest agent data...');
        const agentResponse = await fetch(`/api/agents/${agent.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          if (agentData.code === 200 && agentData.data?.tokenAddress) {
            currentTokenAddress = agentData.data.tokenAddress;
            console.log('Updated token address:', currentTokenAddress);
          }
        }
      }

      if (!currentTokenAddress) {
        throw new Error(tOneClick('tokenAddressNotFound'));
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
          tokenAddress: currentTokenAddress,
        }),
      });

      const result = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.message || tOneClick('tokenDistributionFailed'));
      }

      // 等待分发完成
      return await waitForTokenDistribution();
    } catch (error) {
      const newSteps = [...steps];
      if (newSteps.length > 2) {
        newSteps[2].status = 'failed';
        newSteps[2].error = error instanceof Error ? error.message : tOneClick('tokenDistributionFailed');
      }
      setSteps(newSteps);
      return false;
    }
  };

  // 部署挖矿合约
  const executeDeployMining = async () => {
    // TODO: 等数据库模型添加miningContractAddress字段后检查是否已部署
    // if (agent.miningContractAddress) return true;

    try {
      const newSteps = [...steps];
      if (newSteps.length === 0) return false;
      newSteps[1].status = 'processing';
      setSteps(newSteps);
      setCurrentStep(1);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(tOneClick('walletAuthRequired'));
      }

      // 获取最新的代币地址（可能来自数据库或之前的步骤）
      let currentTokenAddress = agent.tokenAddress;
      if (!currentTokenAddress) {
        console.log('Token address not found for mining contract, fetching latest agent data...');
        const agentResponse = await fetch(`/api/agents/${agent.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (agentResponse.ok) {
          const agentData = await agentResponse.json();
          if (agentData.code === 200 && agentData.data?.tokenAddress) {
            currentTokenAddress = agentData.data.tokenAddress;
            console.log('Updated token address for mining:', currentTokenAddress);
          }
        }
      }

      if (!currentTokenAddress) {
        throw new Error(tOneClick('tokenAddressNotFound'));
      }

      // 准备挖矿合约部署参数
      const deploymentParams = {
        nft: currentTokenAddress, // 使用创建的代币地址作为NFT地址
        owner: (agent as any).creator?.address || agent.creatorId, // 使用Agent创建者地址作为拥有者
        project_name: agent.name, // 使用Agent名称作为项目名称
        reward_token: currentTokenAddress, // 使用创建的代币作为奖励代币
      };

      // 调用挖矿合约部署API
      const response = await fetch(`/api/agents/${agent.id}/deploy-mining`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(deploymentParams),
      });

      const result = await response.json();
      
      if (result.code !== 200) {
        throw new Error(result.message || tOneClick('miningContractDeploymentFailed'));
      }

      // 等待部署完成
      return await waitForMiningDeployment();
    } catch (error) {
      const newSteps = [...steps];
      if (newSteps.length > 1) {
        newSteps[1].status = 'failed';
        newSteps[1].error = error instanceof Error ? error.message : tOneClick('miningContractDeploymentFailed');
      }
      setSteps(newSteps);
      return false;
    }
  };

  // 等待挖矿合约部署完成
  const waitForMiningDeployment = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const maxAttempts = 60; // 最多等待5分钟
      let attempts = 0;

      const checkStatus = async () => {
        attempts++;
        
        try {
          // 获取部署任务状态
          const response = await fetch(`/api/agents/${agent.id}/tasks`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.ok) {
            const taskData = await response.json();
            if (taskData.code === 200 && taskData.data?.tasks) {
              const miningTasks = taskData.data.tasks.filter((task: any) => 
                task.type === 'DEPLOY_MINING'
              );

              if (miningTasks.length > 0) {
                const latestTask = miningTasks[miningTasks.length - 1];
                
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
                  newSteps[1].error = latestTask.result?.error || tOneClick('miningContractDeploymentFailed');
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
            newSteps[1].error = tOneClick('miningContractDeploymentTimeout');
            setSteps(newSteps);
            resolve(false);
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[1].status = 'failed';
            newSteps[1].error = tOneClick('checkMiningDeploymentStatusFailed');
            setSteps(newSteps);
            resolve(false);
          }
        }
      };

      checkStatus();
    });
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
                  newSteps[2].status = 'completed';
                  setSteps(newSteps);
                  resolve(true);
                  return;
                }

                if (latestTask.status === 'FAILED') {
                  const newSteps = [...steps];
                  newSteps[2].status = 'failed';
                  newSteps[2].error = latestTask.result?.message || tOneClick('tokenDistributionFailed');
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
            newSteps[2].error = tOneClick('tokenDistributionTimeout');
            setSteps(newSteps);
            resolve(false);
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[2].status = 'failed';
            newSteps[2].error = tOneClick('checkTokenDistributionStatusFailed');
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
      if (newSteps.length === 0) return false;
      newSteps[3].status = 'processing';
      setSteps(newSteps);
      setCurrentStep(3);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(tOneClick('walletAuthRequired'));
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
        throw new Error(result.message || tOneClick('tokenBurnFailed'));
      }

      // 等待销毁完成
      return await waitForTokenBurn();
    } catch (error) {
      const newSteps = [...steps];
      if (newSteps.length > 3) {
        newSteps[3].status = 'failed';
        newSteps[3].error = error instanceof Error ? error.message : tOneClick('tokenBurnFailed');
      }
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
                  newSteps[3].status = 'completed';
                  setSteps(newSteps);
                  setAllTasksCompleted(true);
                  resolve(true);
                  return;
                }

                if (burnTask.status === 'FAILED') {
                  const newSteps = [...steps];
                  newSteps[3].status = 'failed';
                  newSteps[3].error = burnTask.result?.message || tOneClick('tokenBurnFailed');
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
            newSteps[3].status = 'failed';
            newSteps[3].error = tOneClick('tokenBurnTimeout');
            setSteps(newSteps);
            resolve(false);
          }
        } catch (error) {
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000);
          } else {
            const newSteps = [...steps];
            newSteps[3].status = 'failed';
            newSteps[3].error = tOneClick('checkTokenBurnStatusFailed');
            setSteps(newSteps);
            resolve(false);
          }
        }
      };

      checkStatus();
    });
  };

  // 检查是否有任务正在处理中
  const hasTasksProcessing = useCallback(() => {
    const processingStatuses = ['PENDING', 'PROCESSING'];
    
    return (
      isCreating ||
      (tokenCreationTask && processingStatuses.includes(tokenCreationTask.status)) ||
      (distributionTask && processingStatuses.includes(distributionTask.status)) ||
      (miningDeploymentTask && processingStatuses.includes(miningDeploymentTask.status)) ||
      steps.some(step => step.status === 'processing')
    );
  }, [isCreating, tokenCreationTask, distributionTask, miningDeploymentTask, steps]);

  // 检查是否有任何任务已经开始过（包括已完成、失败或正在进行）
  const hasAnyTaskStarted = useCallback(() => {
    const startedStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    
    return (
      agent.tokenAddress || // 代币已创建
      agent.tokensDistributed || // 代币已分发
      agent.liquidityAdded || // 流动性已添加
      agent.tokensBurned || // 代币已销毁
      (agent as any).miningContractAddress || // 挖矿合约已部署
      isCreating ||
      (tokenCreationTask && startedStatuses.includes(tokenCreationTask.status)) ||
      (distributionTask && startedStatuses.includes(distributionTask.status)) ||
      (miningDeploymentTask && startedStatuses.includes(miningDeploymentTask.status)) ||
      steps.some(step => step.status !== 'waiting')
    );
  }, [agent, isCreating, tokenCreationTask, distributionTask, miningDeploymentTask, steps]);

  // 一键完成所有步骤
  const handleOneClickCompletion = async () => {
    if (allTasksCompleted || hasTasksProcessing()) return;

    setIsProcessing(true);

    try {
      // 步骤1: 创建代币
      if (!agent.tokenAddress) {
        toast({
          title: tOneClick('startTokenCreation'),
          description: tOneClick('deployingDrc20Contract'),
        });

        const step1Success = await executeCreateToken();
        if (!step1Success) {
          toast({
            title: tOneClick('tokenCreationFailed'),
            description: tOneClick('checkErrorAndRetry'),
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: '代币创建成功',
          description: tOneClick('tokenContractDeployed'),
        });
      }

      // 步骤2: 部署挖矿合约
      if (!(agent as any).miningContractAddress) {
        toast({
          title: tOneClick('startDeployMiningContract'),
          description: tOneClick('creatingMiningContract'),
        });

        const step2Success = await executeDeployMining();
        if (!step2Success) {
          toast({
            title: tOneClick('miningContractDeploymentFailed'),
            description: tOneClick('checkErrorAndRetry'),
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: '挖矿合约部署成功',
          description: tOneClick('miningContractCreationCompleted'),
        });
      }

      // 步骤3: 代币分发
      if (!agent.tokensDistributed || !agent.liquidityAdded) {
        toast({
          title: '开始代币分发',
          description: tOneClick('distributingTokensAndLiquidity'),
        });

        const step3Success = await executeDistributeTokens();
        if (!step3Success) {
          toast({
            title: tOneClick('tokenDistributionFailed'),
            description: tOneClick('checkErrorAndRetry'),
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: '代币分发成功',
          description: tOneClick('tokenDistributionAndLiquidityCompleted'),
        });
      }

      // 步骤4: 销毁代币
      if (!agent.tokensBurned) {
        toast({
          title: tOneClick('startTokenBurn'),
          description: tOneClick('burningRemainingXaa'),
        });

        const step4Success = await executeBurnTokens();
        if (!step4Success) {
          toast({
            title: tOneClick('tokenBurnFailed'),
            description: tOneClick('checkErrorAndRetry'),
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        toast({
          title: '销毁代币成功',
          description: tOneClick('xaaTokenBurnCompleted'),
        });
      }

      // 所有步骤完成
      setAllTasksCompleted(true);
      toast({
        title: '🎉 IAO完成！',
        description: tOneClick('allStepsExecutedIaoCompleted'),
      });

      // 刷新页面状态
      onStatusUpdate?.();

    } catch (error) {
      console.error('One-click IAO completion failed:', error);
      toast({
        title: tOneClick('executionFailed'),
        description: error instanceof Error ? error.message : tOneClick('unknownError'),
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
        return { text: tOneClick('completed'), color: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' };
      case 'processing':
        return { text: tOneClick('processing'), color: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200' };
      case 'failed':
        return { text: tOneClick('failed'), color: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200' };
      default:
        return { text: tOneClick('waiting'), color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-gradient-to-r from-[#F47521] to-[#E56411] hover:from-[#E56411] hover:to-[#D55201] text-white font-medium shadow-lg"
          disabled={allTasksCompleted || hasTasksProcessing()}
        >
          {allTasksCompleted ? tOneClick('iaoCompleted') : 
           hasTasksProcessing() ? tOneClick('taskInProgress') : 
           hasAnyTaskStarted() ? tOneClick('viewDeploymentProgress') : 
           tOneClick('oneClickCompleteIao')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            {tOneClick('oneClickTitle')}
          </DialogTitle>
          <DialogDescription>
            {tOneClick('autoExecuteDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-2">
            <h4 className="font-medium">{tOneClick('agentInfo')}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">{tOneClick('name')}:</span>
                <span className="ml-2 font-medium">{agent.name}</span>
              </div>
              <div>
                <span className="text-gray-600">{tOneClick('symbol')}:</span>
                <span className="ml-2 font-medium">{agent.symbol}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">{tOneClick('totalSupply')}:</span>
                <span className="ml-2 font-medium">{(agent.totalSupply || 0).toLocaleString()}</span>
              </div>
              {agent.tokenAddress && (
                <div className="col-span-2">
                  <span className="text-gray-600">{tOneClick('tokenAddress')}:</span>
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
                          title: ok ? tIao('copied') : tIao('copyFailed'),
                          duration: 2000,
                          variant: ok ? undefined : 'destructive',
                        });
                      }}
                    >
                      {tOneClick('copy')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 执行步骤和进度 */}
          <div className="space-y-2">
            <h4 className="font-medium">{tOneClick('executionProgress')}</h4>
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
                              <span className="text-xs">{tOneClick('executing')}</span>
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
                <span className="font-medium text-green-800 dark:text-green-200">{tOneClick('iaoProcessCompleted')}</span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {tOneClick('allStepsExecutedSuccessfully')}
              </div>
            </div>
          )}

          {/* 错误和重试提示 */}
          {steps.some(step => step.status === 'failed') && !isProcessing && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚠️</span>
                <span className="font-medium text-red-800 dark:text-red-200">{tOneClick('someStepsFailed')}</span>
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                {tOneClick('checkFailureReason')}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
            {tOneClick('close')}
          </Button>
          
          {!allTasksCompleted && (
            <Button
              onClick={handleOneClickCompletion}
              disabled={isProcessing || hasTasksProcessing()}
              className="bg-gradient-to-r from-[#F47521] to-[#E56411] hover:from-[#E56411] hover:to-[#D55201] text-white"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {tOneClick('executing')}
                </>
              ) : hasTasksProcessing() ? (
                tOneClick('taskInProgress')
              ) : steps.some(step => step.status === 'failed') ? (
                tOneClick('retryFailedSteps')
              ) : hasAnyTaskStarted() ? (
                tOneClick('continueExecution')
              ) : (
                tOneClick('startExecution')
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};