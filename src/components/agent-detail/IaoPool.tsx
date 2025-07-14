/**
 * 简化重构后的 IaoPool 组件
 * 只拆分了3个文件，保持简洁易维护
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
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

interface IaoPoolProps {
  agent: LocalAgent;
  onRefreshAgent?: () => void | Promise<void>;
}

export const IaoPool = ({ agent, onRefreshAgent }: IaoPoolProps) => {
  const t = useTranslations('iaoPool');
  const { toast } = useToast();
  const { ensureCorrectNetwork } = useNetwork();
  const [isCreating, setIsCreating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUpdateTimeModalOpen, setIsUpdateTimeModalOpen] = useState(false);

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

    if (Number(dbcAmount) > Number(maxDbcAmount)) {
      toast({
        title: t('error'),
        description: t('notEnoughBalance'),
      });
      return;
    }

    try {
      await ensureCorrectNetwork();
      const result = await stake(dbcAmount);
      
      if (result && (result as any).success) {
        toast({
          title: t('success'),
          description: t('stakeSuccess', {
            amount: dbcAmount,
            symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA'
          }),
        });
        
        // 刷新用户质押信息
        await fetchUserStakeInfo();
        
        // 清空输入
        setDbcAmount("");
      } else {
        throw new Error((result as any)?.error || t('stakeFailed'));
      }
    } catch (error: any) {
      console.error('质押失败:', error);
      toast({
        title: t('error'),
        description: error.message || t('stakeFailed'),
      });
    }
  }, [isAuthenticated, dbcAmount, maxDbcAmount, ensureCorrectNetwork, stake, agent, toast, t, fetchUserStakeInfo]);

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
    const availableAmount = Math.max(Number(agent.symbol === 'XAA' ? maxDbcAmount : maxXaaAmount) - reserveAmount, 0);
    setDbcAmount(availableAmount.toString());
  }, [maxDbcAmount, maxXaaAmount, agent.symbol]);

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
  const renderDbcSwapButton = () => (
    <div className="flex justify-end items-center mb-4">
      <Button
        variant="outline"
        className="relative flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#F47521] via-[#F47521]/90 to-[#F47521] text-white rounded-lg overflow-hidden transform hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(244,117,33,0.5)] transition-all duration-300 group animate-subtle-bounce text-sm sm:text-base"
        onClick={() => window.open('https://dbcswap.io/#/swap', '_blank')}
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

  // 检查是否可以领取
  const canClaim = !isClaiming &&
    !userStakeInfo.hasClaimed &&
    Number(userStakeInfo.userDeposited) > 0;

  return (
    <Card className="p-4 sm:p-6">
      {renderDbcSwapButton()}

      {isIAOEnded ? (
        <IaoEndedView
          agent={agent}
          poolInfo={poolInfo}
          iaoProgress={iaoProgress}
          userStakeInfo={userStakeInfo}
          isIaoSuccessful={isIaoSuccessful}
          isCreator={isCreator}
          tokenCreationTask={tokenCreationTask}
          distributionTask={distributionTask}
          isPoolInfoLoading={isPoolInfoLoading}
          onCreateToken={handleCreateToken}
          onPaymentModalOpen={handlePaymentModalOpen}
          onClaimRewards={handleClaimRewards}
          onRefreshStatus={handleRefreshData}
          isCreating={isCreating}
          isClaiming={isClaiming}
          canClaim={canClaim}
        />
      ) : (
        <IaoActiveView
          agent={agent}
          poolInfo={poolInfo}
          iaoProgress={iaoProgress}
          userStakeInfo={userStakeInfo}
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

      {/* 模态框 - 暂时注释支付合约和修改时间功能 */}
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
        onUpdateTimes={async (startTime: number, endTime: number) => {
          // 这里需要实现更新时间的逻辑
          console.log('Update times:', startTime, endTime);
        }}
        isLoading={false}
        isPoolInfoLoading={isPoolInfoLoading}
      />
    </Card>
  );
};
