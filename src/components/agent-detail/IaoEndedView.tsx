/**
 * IAO结束后的视图组件 - 简化版本
 */

'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { IaoResultDisplay } from './IaoResultDisplay';
// import LiquidityManagement from './LiquidityManagement';
// import TokenBurnModal from './TokenBurnModal';
import { TokenDistributionModal } from './TokenDistributionModal';
import type { LocalAgent } from "@/types/agent";
import { Countdown } from "@/components/ui-custom/countdown";
import { copyToClipboard } from '@/lib/utils';

interface IaoEndedViewProps {
  agent: LocalAgent;
  poolInfo: any;
  iaoProgress: any;
  userStakeInfo: any;
  isIaoSuccessful: boolean;
  isCreator: boolean;
  tokenCreationTask: any;
  distributionTask: any;
  isPoolInfoLoading: boolean;
  onCreateToken: () => void;
  onPaymentModalOpen: () => void;
  onClaimRewards: () => void;
  onRefreshStatus: () => void;
  isCreating: boolean;
  isClaiming: boolean;
  canClaim: boolean;
}

export const IaoEndedView = ({
  agent,
  poolInfo,
  iaoProgress,
  userStakeInfo,
  isIaoSuccessful,
  isCreator,
  tokenCreationTask,
  distributionTask,
  isPoolInfoLoading,
  onCreateToken,
  onClaimRewards,
  onRefreshStatus,
  isCreating,
  isClaiming,
  canClaim
}: IaoEndedViewProps) => {
  const tTokenDistribution = useTranslations('tokenDistribution');
  const tIaoPool = useTranslations('iaoPool');
  const { toast } = useToast();
  const [isBurning, setIsBurning] = useState(false);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);
  const [ownershipTaskId, setOwnershipTaskId] = useState<string | null>(null);
  const [ownershipTaskStatus, setOwnershipTaskStatus] = useState<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null>(null);

  // 添加shouldShowClaimButton函数
  const shouldShowClaimButton = () => {
    return isIaoSuccessful && agent.tokenAddress && !userStakeInfo.hasClaimed && canClaim;
  };

  const formatNumber = (value: string | number, decimals: number = 2): string => {
    if (!value || value === '0') return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  };

  // 处理手动领取退款（IAO失败时）
  const handleClaimRefund = async () => {
    // Assuming isAuthenticated is available in the context or passed as a prop
    // For now, we'll assume it's true for demonstration purposes
    const isAuthenticated = true; // Placeholder for actual authentication check

    if (!isAuthenticated) {
      toast({
        title: tIaoPool('error'),
        description: tIaoPool('connectWalletFirst'),
      });
      return;
    }

    try {
      // 使用传入的isClaiming状态而不是自己创建
      // 直接调用传入的onClaimRewards函数，它会处理设置isClaiming的逻辑
      const result: any = await onClaimRewards();

      if (result?.success) {
        toast({
          title: tIaoPool('claimSuccess'),
          description: tIaoPool('refundSentToWallet'),
        });
      } else {
        throw new Error(result?.error || tIaoPool('claimFailed'));
      }
    } catch (error: any) {
      const errorMessage = error.message || tIaoPool('claimFailed');
      toast({
        title: tIaoPool('error'),
        description: errorMessage,
      });
    }
  };

  // 销毁代币处理函数
  const handleBurnTokens = async (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 阻止事件冒泡

    try {
      setIsBurning(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: tTokenDistribution('error'),
          description: tTokenDistribution('walletAuthRequired'),
          variant: 'destructive',
        });
        return;
      }

      console.log('🔥 [DEBUG] 调用销毁XAA接口...');

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
      console.log('🔥 [DEBUG] 销毁XAA提交结果:', result);

      if (result.code === 200) {
        toast({
          title: tTokenDistribution('burnTaskSubmitted'),
          description: tTokenDistribution('taskSubmitted'),
        });

        // 刷新状态
        onRefreshStatus();
      } else {
        throw new Error(result.message || tTokenDistribution('burnFailed'));
      }
    } catch (error) {
      console.error('销毁XAA失败:', error);
      toast({
        title: tTokenDistribution('burnFailed'),
        description: error instanceof Error ? error.message : tTokenDistribution('unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsBurning(false);
    }
  };

  // 轮询任务状态
  const pollOwnershipTaskStatus = async (taskId: string) => {
    const maxAttempts = 60; // 最多轮询60次（5分钟）
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        console.log(`🔄 [DEBUG] 轮询所有权转移任务状态 (${attempts}/${maxAttempts}): ${taskId}`);

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();
        console.log(`📊 [DEBUG] 任务状态查询结果:`, result);

        if (result.code === 200 && result.data) {
          const task = result.data;
          setOwnershipTaskStatus(task.status);

          if (task.status === 'COMPLETED') {
            console.log('✅ 所有权转移任务完成');
            toast({
              title: tIaoPool('ownershipTransferSuccess'),
              description: tIaoPool('ownershipTransferredToCreator'),
            });
            setIsTransferringOwnership(false);
            onRefreshStatus(); // 刷新整体状态
            return;
          } else if (task.status === 'FAILED') {
            console.log('❌ 所有权转移任务失败');
            toast({
              title: tIaoPool('ownershipTransferFailed'),
              description: task.result?.message || tIaoPool('transferError'),
              variant: 'destructive',
            });
            setIsTransferringOwnership(false);
            return;
          } else if (task.status === 'PROCESSING' || task.status === 'PENDING') {
            // 继续轮询
            if (attempts < maxAttempts) {
              setTimeout(poll, 5000); // 5秒后再次查询
            } else {
              console.log('⏰ 轮询超时');
              toast({
                title: tIaoPool('queryTimeout'),
                description: tIaoPool('taskStillProcessing'),
                variant: 'destructive',
              });
              setIsTransferringOwnership(false);
            }
          }
        } else {
          throw new Error(result.message || tIaoPool('queryFailed'));
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // 出错后也继续重试
        } else {
          toast({
            title: tIaoPool('queryFailed'),
            description: tIaoPool('cannotGetTaskStatus'),
            variant: 'destructive',
          });
          setIsTransferringOwnership(false);
        }
      }
    };

    poll();
  };

  // 转移代币所有权处理函数
  const handleTransferOwnership = async () => {
    try {
      setIsTransferringOwnership(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: tIaoPool('error'),
          description: tIaoPool('walletAuthRequired'),
          variant: 'destructive',
        });
        setIsTransferringOwnership(false);
        return;
      }

      console.log('🔑 [DEBUG] 调用转移代币所有权接口...');

      const response = await fetch(`/api/agents/${agent.id}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log('🔑 [DEBUG] 转移代币所有权提交结果:', result);

      if (result.code === 200) {
        const taskId = result.data.taskId;
        setOwnershipTaskId(taskId);
        setOwnershipTaskStatus('PENDING');

        toast({
          title: tIaoPool('ownershipTransferTaskSubmitted'),
          description: tIaoPool('taskSubmitted'),
        });

        // 开始轮询任务状态
        pollOwnershipTaskStatus(taskId);
      } else {
        throw new Error(result.message || tIaoPool('ownershipTransferFailed'));
      }
    } catch (error) {
      console.error('转移代币所有权失败:', error);
      toast({
        title: tIaoPool('ownershipTransferFailed'),
        description: error instanceof Error ? error.message : tIaoPool('unknownError'),
        variant: 'destructive',
      });
      setIsTransferringOwnership(false);
    }
  };



  // 筹资结果展示 - 只负责渲染，不处理逻辑
  const FundraisingResults = () => (
    <div className="space-y-3 sm:space-y-4">
      <IaoResultDisplay
        iaoProgress={iaoProgress}
        isIaoEnded={true}
        isIaoSuccessful={isIaoSuccessful}
        isCreator={isCreator}
        agentId={agent.id}
        startTime={poolInfo?.startTime}
        endTime={poolInfo?.endTime}
        isPoolInfoLoading={isPoolInfoLoading}
        userStakeInfo={userStakeInfo}
        onRefreshStatus={onRefreshStatus}
      />
    </div>
  );

  // IAO完成数据展示 - 只负责渲染，不处理逻辑
  const IaoCompletedData = () => (
    <div className="mt-6 sm:mt-8">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{tIaoPool('iaoCompletedData')}</h2>
      <div className="space-y-3 sm:space-y-4">
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
          <span className="text-black dark:text-white font-medium">{tIaoPool('iaoReleasedAmount', { symbol: agent.symbol })}:</span>
          <span className="font-semibold text-[#F47521] dark:text-orange-400 break-all">
            {formatNumber((agent.totalSupply || 0) * 0.15)}
          </span>
        </div>
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <span className="text-black dark:text-white font-medium">
            {tIaoPool('iaoParticipatedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
          </span>
          <span className="font-semibold text-[#F47521] dark:text-orange-400 break-all">
            {isPoolInfoLoading ? "--" : formatNumber(poolInfo?.totalDeposited || '0')}
          </span>
        </div>
      </div>
    </div>
  );

  // LP池数据展示 - 只负责渲染，不处理逻辑
  const LpPoolData = () => (
    <div className="mt-6 sm:mt-8">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{tIaoPool('lpPoolData')}</h3>
      <div className="space-y-3 sm:space-y-4">
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <span className="text-black dark:text-white font-medium">{tIaoPool('lpPoolTokenAmount', { symbol: agent.symbol })}:</span>
          <span className="font-semibold text-[#F47521] dark:text-orange-400 break-all">
            {formatNumber((agent as any).targetTokenAmountLp || 0)}
          </span>
        </div>
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <span className="text-black dark:text-white font-medium">{tIaoPool('lpPoolBaseAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:</span>
          <span className="font-semibold text-[#F47521] dark:text-orange-400 break-all">
            {formatNumber((agent as any).baseTokenAmountLp || 0)}
          </span>
        </div>
      </div>
    </div>
  );

  // 用户质押信息 - 只负责渲染，不处理逻辑
  const UserStakeInfo = () => {
    // 如果用户没有质押，不显示此部分
    if (!userStakeInfo || !userStakeInfo.userDeposited || Number(userStakeInfo.userDeposited) <= 0) {
      return null;
    }

    // 计算总可领取金额
    const totalClaimable = (parseFloat(userStakeInfo.rewardForOrigin || '0') || 0) + 
                          (parseFloat(userStakeInfo.rewardForNFT || '0') || 0);

    return (
      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{tIaoPool('yourStakeInfo')}</h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <span className="text-black dark:text-white font-medium">{tIaoPool('yourStake', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:</span>
            <span className="font-semibold text-[#F47521] dark:text-orange-400 break-all">
              {formatNumber(userStakeInfo.userDeposited)}
            </span>
          </div>
          
          {/* 添加可领取/已领取金额显示 */}
          <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <span className="text-black dark:text-white font-medium">
              {userStakeInfo.hasClaimed ? 
                tIaoPool('claimedAmount', { symbol: agent.symbol }) : 
                tIaoPool('claimableAmount', { symbol: agent.symbol })}:
            </span>
            <span className="font-semibold text-[#F47521] dark:text-orange-400 break-all">
              {formatNumber(userStakeInfo.hasClaimed ? 
                userStakeInfo.claimedAmount || '0' : 
                totalClaimable.toString())}
            </span>
          </div>

          {/* 根据IAO状态和用户情况显示不同按钮 */}
          {isIaoSuccessful ? (
            // 成功的IAO，显示领取代币按钮
            <div className="flex justify-center flex-col">
              {!agent.tokenAddress ? (
                <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm font-medium text-yellow-700">
                      {tIaoPool('waitingForTokenCreation')}
                    </span>
                  </div>
                </div>
              ) : !agent.tokensDistributed || !agent.liquidityAdded ? (
                <div className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg mb-3">
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm font-medium text-orange-700">
                      {tIaoPool('waitingForTokenDistribution')}
                    </span>
                  </div>
                  <div className="text-xs text-orange-600">
                    {tIaoPool('creatorIncompleteProcess')}
                  </div>
                </div>
              ) : !agent.tokensBurned ? (
                <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm font-medium text-red-700">
                      {tIaoPool('waitingForTokenBurn')}
                    </span>
                  </div>
                  <div className="text-xs text-red-600">
                    {tIaoPool('creatorIncompleteBurnProcess')}
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    className={`w-full sm:w-auto px-8 ${
                      userStakeInfo.hasClaimed || !canClaim || !agent.tokensDistributed || !agent.liquidityAdded || !agent.tokensBurned
                        ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed'
                        : 'bg-[#F47521] hover:bg-[#E56411]'
                    }`}
                    onClick={onClaimRewards}
                    disabled={isClaiming || userStakeInfo.hasClaimed || !canClaim || !agent.tokenAddress || !agent.tokensDistributed || !agent.liquidityAdded || !agent.tokensBurned}
                  >
                    {isClaiming ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {tIaoPool('claiming')}
                      </>
                    ) : userStakeInfo.hasClaimed ? (
                      tIaoPool('rewardClaimed')
                    ) : !agent.tokensDistributed || !agent.liquidityAdded ? (
                      tIaoPool('waitingForTokenDistribution')
                    ) : !agent.tokensBurned ? (
                      tIaoPool('waitingForTokenBurn')
                    ) : (
                      tIaoPool('claimRewards')
                    )}
                  </Button>

                  {/* 添加代币地址复制功能 */}
                  {userStakeInfo.hasClaimed && agent.tokenAddress && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">{tIaoPool('importTokenAddress')}</p>
                      <div className="relative">
                        <code className="block p-2 bg-black/10 dark:bg-white/10 rounded text-xs break-all pr-24">
                          {agent.tokenAddress}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={async () => {
                            const ok = await copyToClipboard(agent.tokenAddress || '');
                            toast({
                              title: ok ? tIaoPool('copied') : tIaoPool('copyFailed'),
                              duration: 2000,
                              variant: ok ? undefined : 'destructive',
                            });
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </svg>
                          {tIaoPool('copy')}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // 失败的IAO，显示领取退款按钮
            <div className="flex flex-col items-center"> 
              {/* 如果无法领取且未领取过，显示等待提示 */}
              {!canClaim && !userStakeInfo.hasClaimed && Number(userStakeInfo.userDeposited) > 0 && !isClaiming && poolInfo?.endTime && (
                <div className="mb-3 w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-1 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                      {tIaoPool('waitingForRefund')}
                    </span>
                  </div>
                  <div className="flex items-center text-yellow-600">
                    <span className="text-xs mr-1">{tIaoPool('remainingTime')}:</span>
                    {poolInfo?.endTime && (
                      <Countdown 
                        remainingTime={(poolInfo.endTime * 1000) + (10 * 60 * 1000) - Date.now()}
                        mode="compact"
                        color="warning"
                        className="text-xs"
                        onEnd={onRefreshStatus}
                      />
                    )}
                  </div>
                </div>
              )}
                          
              <Button
                className={`w-full sm:w-auto px-8 ${
                  userStakeInfo.hasClaimed || (!canClaim && !isClaiming)
                    ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed'
                    : 'bg-[#F47521] hover:bg-[#E56411]'
                }`}
                onClick={handleClaimRefund}
                disabled={isClaiming || userStakeInfo.hasClaimed || (!canClaim && !isClaiming)}
              >
                {isClaiming ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {tIaoPool('claiming')}
                  </>
                ) : userStakeInfo.hasClaimed ? (
                  tIaoPool('refundClaimed')
                ) : !canClaim && Number(userStakeInfo.userDeposited) > 0 && !isClaiming ? (
                  tIaoPool('waitingToClaimRefund')
                ) : (
                  tIaoPool('claimRefund')
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 管理面板和筹资结果 */}
      <div className="space-y-4">
        {/* IAO管理面板 - 简化版本直接集成 */}
        {isCreator && isIaoSuccessful && (
          <div className="bg-background/5 dark:bg-[#161616] rounded-lg border border-border/10 dark:border-white/[0.1] p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{tTokenDistribution('iaoManagement')}</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500/80 rounded-full"></div>
                <span className="text-sm text-green-500/90 font-medium">{tTokenDistribution('iaoSuccessful')}</span>
              </div>
            </div>

            {/* 简化的步骤进度 - 正确的3步流程 */}
            <div className="space-y-3">
              {/* 步骤1: 创建代币 */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.tokenAddress ? 'bg-green-500/[0.08] dark:bg-green-500/[0.03] border-green-500/20' :
                isCreating || tokenCreationTask?.status === 'PENDING' || tokenCreationTask?.status === 'PROCESSING' ? 'bg-blue-500/[0.08] dark:bg-blue-500/[0.03] border-blue-500/20' :
                tokenCreationTask?.status === 'FAILED' ? 'bg-red-500/[0.08] dark:bg-red-500/[0.03] border-red-500/20' :
                'bg-orange-500/[0.08] dark:bg-orange-500/[0.03] border-orange-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🪙</span>
                  <div>
                    <div className="font-medium text-sm">1. {tTokenDistribution('createToken')}</div>
                    <div className="text-xs text-gray-600">{tTokenDistribution('deployDrc20Contract')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.tokenAddress ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{tTokenDistribution('completed')}</span>
                  ) : isCreating || tokenCreationTask?.status === 'PENDING' || tokenCreationTask?.status === 'PROCESSING' ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{tTokenDistribution('creating')}</span>
                  ) : tokenCreationTask?.status === 'FAILED' ? (
                    <Button size="sm" onClick={onCreateToken} variant="destructive">
                      {tTokenDistribution('retryCreation')}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={onCreateToken} disabled={isCreating}>
                      {tTokenDistribution('createToken')}
                    </Button>
                  )}
                </div>
              </div>

              {/* 步骤2: 代币分发 */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.tokensDistributed && agent.liquidityAdded ? 'bg-green-500/[0.08] dark:bg-green-500/[0.03] border-green-500/20' :
                distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING' ? 'bg-blue-500/[0.08] dark:bg-blue-500/[0.03] border-blue-500/20' :
                distributionTask?.status === 'FAILED' ? 'bg-red-500/[0.08] dark:bg-red-500/[0.03] border-red-500/20' :
                agent.tokenAddress ? 'bg-orange-500/[0.08] dark:bg-orange-500/[0.03] border-orange-500/20' : 'bg-background/5 dark:bg-white/[0.02] border-border/20'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📤</span>
                  <div>
                    <div className="font-medium text-sm">2. {tTokenDistribution('tokenDistribution')}</div>
                    <div className="text-xs text-gray-600">{tTokenDistribution('distributeTokensAddLiquidity')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.tokensDistributed && agent.liquidityAdded ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{tTokenDistribution('completed')}</span>
                  ) : distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING' ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{tTokenDistribution('distributing')}</span>
                  ) : distributionTask?.status === 'FAILED' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{tTokenDistribution('distributionFailed')}</span>
                      <TokenDistributionModal agent={agent} onStatusUpdate={onRefreshStatus} />
                    </div>
                  ) : distributionTask?.status === 'FAILED' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{tTokenDistribution('distributionFailed')}</span>
                      <TokenDistributionModal agent={agent} onStatusUpdate={onRefreshStatus} />
                    </div>
                  ) : agent.tokenAddress ? (
                    <TokenDistributionModal agent={agent} onStatusUpdate={onRefreshStatus} />
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{tTokenDistribution('waiting')}</span>
                  )}
                </div>
              </div>

              {/* 步骤3: 销毁代币 */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.tokensBurned ? 'bg-green-500/[0.08] dark:bg-green-500/[0.03] border-green-500/20' :
                isBurning ? 'bg-blue-500/[0.08] dark:bg-blue-500/[0.03] border-blue-500/20' :
                agent.tokensDistributed && agent.liquidityAdded ? 'bg-orange-500/[0.08] dark:bg-orange-500/[0.03] border-orange-500/20' : 'bg-background/5 dark:bg-white/[0.02] border-border/20'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔥</span>
                  <div>
                    <div className="font-medium text-sm">3. {tTokenDistribution('burnTokens')}</div>
                    <div className="text-xs text-gray-600">{tTokenDistribution('burnXaaTokens')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.tokensBurned ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{tTokenDistribution('completed')}</span>
                  ) : isBurning ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{tTokenDistribution('burning')}</span>
                  ) : agent.tokensDistributed && agent.liquidityAdded ? (
                    <Button size="sm" onClick={handleBurnTokens} disabled={isBurning}>
                      {tTokenDistribution('burnTokens')}
                    </Button>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{tTokenDistribution('waiting')}</span>
                  )}
                </div>
              </div>

              {/* 步骤4: 转移所有权（可选） */}
              {/* {agent.tokenAddress && agent.tokensDistributed && agent.liquidityAdded && agent.xaaBurnt && !agent.ownershipTransferred && (
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  agent.ownershipTransferred ? 'bg-green-50 border-green-200' :
                  isTransferringOwnership ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔑</span>
                    <div>
                      <div className="font-medium text-sm">4. {tIaoPool('transferOwnership')}</div>
                      <div className="text-xs text-gray-600">{tIaoPool('transferTokenOwnership')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.ownershipTransferred ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{tTokenDistribution('completed')}</span>
                    ) : isTransferringOwnership ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{tTokenDistribution('transferring')}</span>
                    ) : (
                      <Button size="sm" onClick={handleTransferOwnership} disabled={isTransferringOwnership}>
                        {tIaoPool('transferOwnership')}
                      </Button>
                    )}
                  </div>
                </div>
              )} */}

              {/* 代币地址显示 */}
              {agent.tokenAddress && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                  <span className="font-medium text-foreground/80">{tTokenDistribution('tokenAddress')}:</span>
                  <code className="bg-background/10 dark:bg-white/[0.05] px-2 py-1 rounded text-xs break-all flex-1 text-foreground/90">
                    {agent.tokenAddress}
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      const ok = await copyToClipboard(agent.tokenAddress || '');
                      toast({
                        title: ok ? tIaoPool('copied') : tIaoPool('copyFailed'),
                        duration: 2000,
                        variant: ok ? undefined : 'destructive',
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    {tIaoPool('copy')}
                  </Button>
                </div>
              )}

              {/* 全部完成提示 */}
              {agent.tokenAddress && agent.tokensDistributed && agent.liquidityAdded && agent.tokensBurned && agent.ownerTransferred && (
                <div className="mt-4 p-3 bg-green-500/[0.08] dark:bg-green-500/[0.03] border border-green-500/20 rounded-lg text-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-500/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-foreground/90">{tTokenDistribution('managementCompleted')}</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 筹资结果展示 */}
        <FundraisingResults />

  
      </div>

            {/* IAO完成数据展示 */}
            {isIaoSuccessful && <IaoCompletedData />}

{/* LP池数据展示 */}
{isIaoSuccessful && agent.tokenAddress && agent.tokensDistributed && agent.liquidityAdded && <LpPoolData />}

{/* 用户质押信息 */}
<UserStakeInfo />
    </>
  );
};
