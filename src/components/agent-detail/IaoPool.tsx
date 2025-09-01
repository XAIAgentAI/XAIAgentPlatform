/**
 * 简化重构后的 IaoPool 组件
 * 只拆分了3个文件，保持简洁易维护
 */

import React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { useNetwork } from '@/hooks/useNetwork';
// import { PaymentContractModal } from './PaymentContractModal';
// import { UpdateIaoTimeModal } from './UpdateIaoTimeModal';
import { IaoEndedView } from './IaoEndedView';
import { IaoActiveView } from './IaoActiveView';
import { useIaoPoolData } from './useIaoPoolData';
import type { LocalAgent } from "@/types/agent";
import { UpdateIaoTimeModal } from './UpdateIaoTimeModal';

/**
 * 安全解析capabilities字段
 * 可能是JSON字符串或逗号分隔的字符串
 */
const parseCapabilities = (capabilities: string | null | undefined): string[] => {
  if (!capabilities) return ['chat'];
  
  try {
    // 尝试解析为JSON
    const parsed = JSON.parse(capabilities);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    // 如果解析失败，假设它是逗号分隔的字符串
    return capabilities.split(',').map(item => item.trim());
  }
};

interface IaoPoolProps {
  agent: LocalAgent;
  onRefreshAgent?: () => void | Promise<void>;
}

const IaoPool = React.memo(({ agent, onRefreshAgent }: IaoPoolProps) => {
  const t = useTranslations('iaoPool');
  const { toast } = useToast();
  const { ensureCorrectNetwork } = useNetwork();
  const [isCreating, setIsCreating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpdateTimeModalOpen, setIsUpdateTimeModalOpen] = useState(false);
  const [isDeployingIao, setIsDeployingIao] = useState(false);
  const [hasConfirmedRedeployment, setHasConfirmedRedeployment] = useState(false);

  // 使用数据管理Hook
  const {
    // 状态
    dbcAmount,
    setDbcAmount,
    maxDbcAmount,
    maxXaaAmount,
    xaaBalance,
    isIaoSuccessful,
    tokenCreationTask,
    distributionTask,
    redeployIaoTask,
    userStakeInfo,
    iaoProgress,
    poolInfo,
    isCreator,
    isIAOEnded,

    // 加载状态
    isStakeLoading,
    isPoolInfoLoading,
    isUserStakeInfoLoading,

    // 方法
    stake,
    claimRewards,
    isContractOwner,
    fetchUserStakeInfo,
    fetchTokenCreationTask,
    fetchIaoProgress,
    checkIaoStatus,
    fetchPoolInfo,

    // 便捷访问
    address,
    isConnected,
    isAuthenticated
  } = useIaoPoolData(agent);

  // 检查是否可以领取
  const canClaim = useMemo(() => {
    // 基本条件：未正在领取、未领取过、有质押金额
    const basicCondition = !isClaiming && 
      !userStakeInfo?.hasClaimed && 
      Number(userStakeInfo?.userDeposited || 0) > 0;
    
    if (!basicCondition) return false;
    
    // IAO成功情况，直接返回true
    if (isIaoSuccessful) return true;
    
    // IAO失败情况，需要判断是否已超过结束时间10分钟
    if (!isIaoSuccessful && poolInfo?.endTime) {
      const waitingTimeInMs = 10 * 60 * 1000; // 10分钟
      const iaoEndTimeMs = poolInfo.endTime * 1000;
      const now = Date.now();
      
      // 返回是否已经过了10分钟等待期
      return now >= (iaoEndTimeMs + waitingTimeInMs);
    }
    
    return false;
  }, [isClaiming, userStakeInfo, isIaoSuccessful, poolInfo]);
  
  // 检查是否可以重新部署IAO（IAO结束后需要等待7天）
  const canRedeployIao = useMemo(() => {
    if (!isIAOEnded || !poolInfo?.endTime) return false;
    
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000; // 7天的毫秒数
    const iaoEndTimeMs = poolInfo.endTime * 1000;
    const now = Date.now();
    
    // 返回是否已经过了7天等待期
    return now >= (iaoEndTimeMs + sevenDaysInMs);
  }, [isIAOEnded, poolInfo]);

  // 监控IAO重新部署任务状态
  useEffect(() => {
    if (redeployIaoTask) {
      if (redeployIaoTask.status === 'COMPLETED') {
        console.log('[IAO重新部署] 任务完成，准备刷新页面');
        toast({
          title: t('success'),
          description: t('iaoRedeploySuccess'),
        });
        setTimeout(() => window.location.reload(), 2000);
      } else if (redeployIaoTask.status === 'FAILED') {
        console.log('[IAO重新部署] 任务失败:', redeployIaoTask.result);
        const errorMsg = redeployIaoTask.result?.error || t('redeployIaoFailed');
        toast({
          title: t('error'),
          description: errorMsg,
          variant: "destructive"
        });
      } else if (redeployIaoTask.status === 'PROCESSING') {
        console.log('[IAO重新部署] 任务正在处理中...');
      }
    }
  }, [redeployIaoTask, toast, t]);

  /**
   * 处理质押
   */
  const handleStake = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: t('error'),
        description: t('connectWalletFirst'),
      });
      return;
    }

    if (!dbcAmount || Number(dbcAmount) <= 0) {
      toast({
        title: t('error'),
        description: t('enterValidAmount'),
      });
      return;
    }

    // 根据代币类型选择正确的最大可用余额进行比较
    const maxAvailableAmount = agent.symbol === 'XAA' ? maxDbcAmount : maxXaaAmount;
    
    if (Number(dbcAmount) > Number(maxAvailableAmount)) {
      toast({
        title: t('error'),
        description: t('notEnoughBalance'),
      });
      return;
    }

    try {
      await ensureCorrectNetwork();
      const result = await stake(dbcAmount, agent.symbol);
      
      if (result &&( (result as any)?.hash || result?.receipt?.status === 'success')) {
        toast({
          title: t('success'),
          description: t('investSuccess', {
            amount: dbcAmount,
            symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA'
          }),
        });
        
        // 刷新用户质押信息
        await fetchUserStakeInfo();
        
        // 清空输入
        setDbcAmount("");
      } else {
        throw new Error((result as any)?.error || t('investFailed'));
      }
    } catch (error: any) {
      console.error('质押失败:', error);
      toast({
        title: t('error'),
        description: error.message || t('investFailed'),
      });
    }
  }, [isAuthenticated, dbcAmount, maxDbcAmount, maxXaaAmount, ensureCorrectNetwork, stake, agent.symbol, toast, t, fetchUserStakeInfo]);

  /**
   * 处理创建代币
   */
  const handleCreateToken = useCallback(async () => {
    if (!isAuthenticated || !isCreator) {
      toast({
        title: t('error'),
        description: t('notAuthorized'),
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const response = await fetch(`/api/agents/${agent.id}/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: agent.name,
          symbol: agent.symbol || 'DBC',
        }),
      });

      const data = await response.json();

      if (response.ok && data.code === 200) {
        toast({
          title: t('success'),
          description: t('tokenCreationInitiated'),
        });

        // 刷新任务状态
        await fetchTokenCreationTask();
      } else if (data.code === 429 || data.message === 'DEPLOYMENT_IN_PROGRESS') {
        // 处理并发部署错误
        toast({
          title: t('deploymentQueue'),
          description: t('deploymentInProgress'),
          variant: "destructive"
        });
      } else {
        throw new Error(data.message || t('tokenCreationFailed'));
      }
    } catch (error: any) {
      console.error('创建代币失败:', error);
      toast({
        title: t('error'),
        description: error.message || t('tokenCreationFailed'),
      });
    } finally {
      setIsCreating(false);
    }
  }, [isAuthenticated, isCreator, agent.id, agent.name, agent.symbol, fetchTokenCreationTask, toast, t]);


  /**
   * 重新部署IAO合约
   * 修复IAO失败后数据状态未重置的问题，通过部署新的IAO合约
   */
  const handleRedeployIao = useCallback(async () => {
    if (!isAuthenticated || !isCreator) {
      toast({
        title: t('error'),
        description: t('notAuthorized'),
      });
      return;
    }

    // 检查是否已经过了7天等待期
    if (isIAOEnded && !isIaoSuccessful && !canRedeployIao) {
      // 计算剩余等待时间
      let remainingTimeText = '';
      if (poolInfo?.endTime) {
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        const iaoEndTimeMs = poolInfo.endTime * 1000;
        const now = Date.now();
        const remainingMs = (iaoEndTimeMs + sevenDaysInMs) - now;
        
        if (remainingMs > 0) {
          const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
          const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
          remainingTimeText = t('remainingWaitTime', {days: remainingDays, hours: remainingHours});
        }
      }

      toast({
        title: t('error'),
        description: t('waitSevenDaysAfterIaoEnd', {remainingTime: remainingTimeText}),
      });
      return;
    }

    try {
      setIsDeployingIao(true);
      
      // 显示确认对话框
      if (agent.iaoContractAddress && !window.confirm(t('redeployIaoConfirmation'))) {
        setIsDeployingIao(false);
        return;
      }

      // 调用重新部署IAO的API
      toast({
        title: t('deploying'),
        description: t('deployingNewIaoContract'),
      });

      const response = await fetch(`/api/agents/${agent.id}/redeploy-iao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      // 检查响应类型，避免解析HTML为JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`服务器返回了非JSON响应: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (response.ok && data.code === 200) {
        const taskId = data.data.taskId;
        
        toast({
          title: t('success'),
          description: t('iaoRedeployTaskSubmitted'),
        });

        // 重置确认状态
        setHasConfirmedRedeployment(false);
        
        // 刷新任务状态以开始监控
        await fetchTokenCreationTask();
      } else if (data.code === 429 || data.message === 'DEPLOYMENT_IN_PROGRESS') {
        // 处理并发部署错误
        toast({
          title: t('deploymentQueue'),
          description: t('deploymentInProgress'),
          variant: "destructive"
        });
      } else {
        throw new Error(data.message || t('redeployIaoFailed'));
      }
    } catch (error: any) {
      console.error(t('redeployIaoFailedLog'), error);
      toast({
        title: t('error'),
        description: error.message || t('redeployIaoFailed'),
      });
    } finally {
      setIsDeployingIao(false);
    }
  }, [isAuthenticated, isCreator, agent.id, agent.iaoContractAddress, toast, t, setHasConfirmedRedeployment, isIAOEnded, isIaoSuccessful, canRedeployIao, poolInfo]);


  /**
   * 处理领取奖励
   */
  const handleClaimRewards = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: t('error'),
        description: t('connectWalletFirst'),
      });
      return;
    }

    if (userStakeInfo.hasClaimed) {
      toast({
        title: t('error'),
        description: t('alreadyClaimed'),
      });
      return;
    }

    if (Number(userStakeInfo.userDeposited) <= 0) {
      toast({
        title: t('error'),
        description: t('noStakeToClaimFrom'),
      });
      return;
    }

    try {
      setIsClaiming(true);
      const result: any = await claimRewards();

      if (result?.success) {
        await fetchUserStakeInfo();

        toast({
          title: t('claimSuccess'),
          description: `${t('tokenSentToWallet')} ${t('importTokenAddress')}: ${agent.tokenAddress}`,
        });
      } else {
        throw new Error(result?.error || t('claimFailed'));
      }
    } catch (error: any) {
      const errorMessage = error.message || t('claimFailed');
      toast({
        title: t('error'),
        description: errorMessage,
      });
    } finally {
      setIsClaiming(false);
    }
  }, [isAuthenticated, userStakeInfo, claimRewards, fetchUserStakeInfo, agent.tokenAddress, toast, t]);

  /**
   * 设置最大金额
   */
  const handleSetMaxAmount = useCallback(() => {
    const reserveAmount = 0.01; // 保留gas费
    // 根据代币类型选择正确的最大可用余额
    const maxAmount = agent.symbol === 'XAA' ? maxDbcAmount : maxXaaAmount;
    const availableAmount = Math.max(Number(maxAmount) - reserveAmount, 0);
    setDbcAmount(availableAmount.toString());
  }, [maxDbcAmount, maxXaaAmount, agent.symbol, setDbcAmount]);

  /**
   * 刷新数据
   */
  const handleRefreshData = useCallback(async () => {
    // 首先刷新代理信息
    if (onRefreshAgent) {
      await onRefreshAgent();
    }

    // 然后刷新IAO相关数据
    fetchPoolInfo(); // 刷新池子信息（包含IAO时间、总奖励等）
    fetchUserStakeInfo();
    fetchIaoProgress();
    checkIaoStatus();
  }, [fetchPoolInfo, fetchUserStakeInfo, fetchIaoProgress, checkIaoStatus, onRefreshAgent]);

  /**
   * 处理支付模态框打开（暂时禁用）
   */
  const handlePaymentModalOpen = useCallback(() => {
    // 支付模态框功能暂时被注释，这里提供空实现
    console.log('支付模态框功能暂时禁用');
  }, []);

  /**
   * 渲染DBCSwap跳转按钮
   */
  const renderDbcSwapButton = () => {
    // 导入XAA地址
    const XAA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true" 
      ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a" 
      : "0x16d83F6B17914a4e88436251589194CA5AC0f452";
    
    // 构建dbcswap URL，自动填入代币地址
    const buildDbcSwapUrl = () => {
      const baseUrl = 'https://dbcswap.io/swap';
      const params = new URLSearchParams({
        chain: 'dbc',
        inputCurrency: XAA_TOKEN_ADDRESS,
        outputCurrency: agent.tokenAddress || ''
      });
      return `${baseUrl}?${params.toString()}`;
    };
    if(!isIAOEnded) {
      return null
    }

    return (
      <div className="flex justify-end items-center mb-4">
        <Button
          variant="outline"
          className="relative flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#F47521] via-[#F47521]/90 to-[#F47521] text-white rounded-lg overflow-hidden transform hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(244,117,33,0.5)] transition-all duration-300 group animate-subtle-bounce text-sm sm:text-base"
          onClick={() => window.open(buildDbcSwapUrl(), '_blank')}
          aria-label={t('goToDbcswap', { symbol: agent.symbol })}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 animate-wave" />
          <span className="relative z-10 font-medium">
            {t('goToDbcswap', { symbol: agent.symbol })}
          </span>
          <div className="relative z-10 flex items-center animate-arrow-move">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 sm:w-4 sm:h-4"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <div className="absolute left-0 w-5 h-5 bg-white/30 rounded-full blur-sm -z-10 animate-ping" />
          </div>
        </Button>
      </div>
    );
  };

  /**
   * 渲染IAO重新部署按钮（当IAO未部署成功时显示）
   */
  const renderIaoRedeploySection = () => {
    // 判断是否需要显示部署信息
    const shouldShowDeployInfo = 
      // 情况1: IAO合约不存在，需要部署
      !agent.iaoContractAddress || 
      // 情况2: IAO已结束且失败，需要重新部署
      (isIAOEnded && !isIaoSuccessful);
    
    if (!shouldShowDeployInfo) return null;

    // 部署状态相关判断 
    const isDeploying = agent.status === 'CREATING'
    const isDeployFailed = agent.status === 'FAILED'; // 部署失败
    const isIaoFailed = isIAOEnded && !isIaoSuccessful; // IAO结束且失败
    
    // 计算剩余等待时间（如果IAO已结束但未到7天）
    let remainingTimeText = '';
    if (isIaoFailed && !canRedeployIao && poolInfo?.endTime) {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const iaoEndTimeMs = poolInfo.endTime * 1000;
      const now = Date.now();
      const remainingMs = (iaoEndTimeMs + sevenDaysInMs) - now;
      
      if (remainingMs > 0) {
        const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
        const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        remainingTimeText = t('remainingWaitTime', {days: remainingDays, hours: remainingHours});
      }
    }

    // 根据不同状况显示不同的UI和提示信息
    let title = '';
    let description = '';
    let buttonText = '';
    let buttonClass = '';

    console.log("isDeploying", isDeploying);
    console.log("isDeployFailed", isDeployFailed);
    console.log("isIaoFailed", isIaoFailed);
    console.log("canRedeployIao", canRedeployIao);
    console.log("poolInfo", poolInfo);
    console.log("isCreator", isCreator);
    console.log("isDeployingIao", isDeployingIao);
    
    
    if (isDeploying) {
      title = t('iaoDeploying');
      description = isCreator 
        ? t('iaoDeployingDescCreator')
        : t('iaoDeployingDescUser');
    } else if (isDeployFailed) {
      title = t('iaoDeployFailed');
      description = isCreator 
        ? t('iaoDeployFailedDescCreator')
        : t('iaoDeployFailedDescUser');
      buttonText = t('redeployIaoFailed');
      buttonClass = 'bg-red-500 hover:bg-red-600';
    } else if (isIaoFailed) {
      title = t('iaoNotReached');
      
      if (!canRedeployIao) {
        description = isCreator 
          ? t('iaoNotReachedWaitDescCreator', {remainingTime: remainingTimeText})
          : t('iaoNotReachedWaitDescUser', {remainingTime: remainingTimeText});
        buttonText = t('waitForRedeployAfter7Days');
        buttonClass = 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed';
      } else {
        description = isCreator 
          ? t('iaoNotReachedCanRedeployDescCreator')
          : t('iaoNotReachedCanRedeployDescUser');
        
        // 根据确认状态显示不同的按钮文本
        buttonText = hasConfirmedRedeployment ? t('deployNewIaoContract') : t('confirmReadyToRedeploy');
        buttonClass = hasConfirmedRedeployment ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600';
      }
    } else {
      title = t('iaoDeployNotCompleted');
      description = isCreator 
        ? t('iaoDeployNotCompletedDescCreator')
        : t('iaoDeployNotCompletedDescUser');
      buttonText = t('redeployIao');
      buttonClass = 'bg-yellow-500 hover:bg-yellow-600';
    }

    // 处理确认按钮点击
    const handleConfirmButtonClick = () => {
      if (isIaoFailed && !canRedeployIao) {
        // 如果IAO失败但未到7天等待期，显示提示
        toast({
          title: t('cannotRedeploy'),
          description: t('waitSevenDaysAfterIaoEnd', {remainingTime: remainingTimeText}),
        });
        return;
      }
      
      if (isIaoFailed && canRedeployIao && !hasConfirmedRedeployment) {
        // 如果是IAO失败且已过7天等待期但未确认，则设置确认状态
        setHasConfirmedRedeployment(true);
        toast({
          title: t('confirmed'),
          description: t('confirmedReadyToRedeploy'),
        });
      } else {
        // 否则执行重新部署
        handleRedeployIao();
      }
    };
    
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">{title}</h4>
            <p className="text-xs text-yellow-700 mb-3">{description}</p>
            {!isDeploying && isCreator && (
              <Button
                className={`w-full text-sm py-2 ${buttonClass} text-white`}
                onClick={handleConfirmButtonClick}
                disabled={isDeployingIao || (isIaoFailed && !canRedeployIao)}
              >
                {isDeployingIao ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('deploying')}
                  </>
                ) : buttonText}
              </Button>
            )}
            
            {/* 添加额外的提示信息，强调不影响老用户退币 */}
            {isIaoFailed && isCreator && canRedeployIao && (
              <p className="text-xs text-green-700 mt-3 italic">
                {t('redeployNotAffectRefunds')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染标题栏
   */
  const renderTitleBar = () => (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 justify-between items-start sm:items-center">
      <h2 className="text-xl sm:text-2xl font-bold mb-0">
        {isIAOEnded ? (isIaoSuccessful ? t('iaoSuccessTitle') : t('iaoFailedTitle')) : t('title')}
      </h2>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* 仅在IAO未开始且用户是创建者时显示调整时间按钮 */}
        {isCreator && poolInfo?.startTime && Date.now() < poolInfo.startTime * 1000 && agent.iaoContractAddress && !isIAOEnded ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto bg-[#F47521] hover:bg-[#E56411] text-white flex items-center justify-center gap-2"
            onClick={() => setIsUpdateTimeModalOpen(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{t('updateIaoTime')}</span>
          </Button>
        ) : null}
        
        {/* 刷新按钮 */}
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-sm sm:text-base flex items-center justify-center gap-2"
          onClick={handleRefreshData}
          disabled={isPoolInfoLoading}
        >
          {isPoolInfoLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('refreshing')}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{t('refresh')}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  /**
   * 渲染模态框组件
   */
  const renderModals = () => (
    <>
      {/* <PaymentContractModal
        isOpen={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        agentId={agent.id}
        tokenAddress={agent.tokenAddress || ''}
        ownerAddress={agent.iaoContractAddress || ''}
        onSuccess={handleRefreshData}
      /> */}

      <UpdateIaoTimeModal
        isOpen={isUpdateTimeModalOpen}
        onOpenChange={setIsUpdateTimeModalOpen}
        currentStartTime={poolInfo?.startTime || 0}
        currentEndTime={poolInfo?.endTime || 0}
        agentId={agent.id}
        onSuccess={handleRefreshData}
        isPoolInfoLoading={isPoolInfoLoading}
      />
    </>
  );

  return (
    <Card className="p-4 sm:p-6">
      {renderTitleBar()}
      
      {/* 显示DBCSwap链接按钮 */}
      {renderDbcSwapButton()}
      
      {/* IAO重新部署提示区域 */}
      {renderIaoRedeploySection()}
      
      {/* 根据IAO状态显示不同的视图 */}
      {isIAOEnded ? (
        <IaoEndedView
          agent={agent}
          poolInfo={poolInfo}
          userStakeInfo={userStakeInfo}
          iaoProgress={iaoProgress}
          isIaoSuccessful={isIaoSuccessful}
          isCreator={isCreator}
          tokenCreationTask={tokenCreationTask}
          distributionTask={distributionTask}
          isPoolInfoLoading={isPoolInfoLoading}
          onCreateToken={handleCreateToken}
          onClaimRewards={handleClaimRewards}
          onRefreshStatus={handleRefreshData}
          onPaymentModalOpen={handlePaymentModalOpen}
          isCreating={isCreating}
          isClaiming={isClaiming}
          canClaim={canClaim}
        />
      ) : (
        <IaoActiveView
          agent={agent}
          poolInfo={poolInfo}
          userStakeInfo={userStakeInfo}
          iaoProgress={iaoProgress}
          dbcAmount={dbcAmount}
          setDbcAmount={setDbcAmount}
          maxDbcAmount={maxDbcAmount}
          maxXaaAmount={maxXaaAmount}
          xaaBalance={xaaBalance}
          isCreator={isCreator}
          isIaoSuccessful={isIaoSuccessful}
          isStakeLoading={isStakeLoading}
          isPoolInfoLoading={isPoolInfoLoading}
          isUserStakeInfoLoading={isUserStakeInfoLoading}
          isAuthenticated={isAuthenticated}
          isConnected={isConnected}
          onStake={handleStake}
          onSetMaxAmount={handleSetMaxAmount}
          onRefresh={handleRefreshData}
          isContractOwner={isContractOwner}
        />
      )}
      
      {/* 模态框组件 */}
      {renderModals()}
    </Card>
  );
});

export default IaoPool;
