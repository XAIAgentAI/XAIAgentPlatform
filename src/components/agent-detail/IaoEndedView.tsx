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
import { UserStakeInfo } from '@/components/agent-detail/UserStakeInfo';

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
  const t = useTranslations('iaoPool');
  const { toast } = useToast();
  const [isBurning, setIsBurning] = useState(false);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);
  const [ownershipTaskId, setOwnershipTaskId] = useState<string | null>(null);
  const [ownershipTaskStatus, setOwnershipTaskStatus] = useState<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null>(null);

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
        title: t('error'),
        description: t('connectWalletFirst'),
      });
      return;
    }

    try {
      // 使用传入的isClaiming状态而不是自己创建
      // 直接调用传入的onClaimRewards函数，它会处理设置isClaiming的逻辑
      const result: any = await onClaimRewards();

      if (result?.success) {
        toast({
          title: t('claimSuccess'),
          description: t('refundSentToWallet'),
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
          title: '错误',
          description: '请先连接钱包并完成认证',
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
          title: 'XAA销毁任务已提交',
          description: '任务已提交，正在后台处理...',
        });

        // 刷新状态
        onRefreshStatus();
      } else {
        throw new Error(result.message || 'XAA销毁任务提交失败');
      }
    } catch (error) {
      console.error('销毁XAA失败:', error);
      toast({
        title: '销毁失败',
        description: error instanceof Error ? error.message : '未知错误',
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
              title: '所有权转移成功',
              description: '代币所有权已成功转移给创建者',
            });
            setIsTransferringOwnership(false);
            onRefreshStatus(); // 刷新整体状态
            return;
          } else if (task.status === 'FAILED') {
            console.log('❌ 所有权转移任务失败');
            toast({
              title: '所有权转移失败',
              description: task.result?.message || '转移过程中发生错误',
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
                title: '查询超时',
                description: '任务仍在处理中，请稍后手动刷新查看结果',
                variant: 'destructive',
              });
              setIsTransferringOwnership(false);
            }
          }
        } else {
          throw new Error(result.message || '查询任务状态失败');
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // 出错后也继续重试
        } else {
          toast({
            title: '查询失败',
            description: '无法获取任务状态，请稍后手动刷新',
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
          title: '错误',
          description: '请先连接钱包并完成认证',
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
          title: '代币所有权转移任务已提交',
          description: '任务已提交，正在后台处理...',
        });

        // 开始轮询任务状态
        pollOwnershipTaskStatus(taskId);
      } else {
        throw new Error(result.message || '代币所有权转移任务提交失败');
      }
    } catch (error) {
      console.error('转移代币所有权失败:', error);
      toast({
        title: '转移失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
      setIsTransferringOwnership(false);
    }
  };



  // 筹资结果展示 - 只负责渲染，不处理逻辑
  const FundraisingResults = () => (
    <div className="space-y-3 sm:space-y-4">
      {!isIaoSuccessful && !isCreator && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <h3 className="text-base font-medium text-amber-800">IAO未达成目标</h3>
          </div>
          <p className="text-sm text-amber-700">
            此IAO未达到筹资目标。所有参与者可以领取退款。
          </p>
        </div>
      )}

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
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('iaoCompletedData')}</h2>
      <div className="space-y-3 sm:space-y-4">
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-orange-50 p-3 rounded-lg">
          <span className="text-black font-medium">{t('iaoReleasedAmount', { symbol: agent.symbol })}:</span>
          <span className="font-semibold text-[#F47521] break-all">
            {formatNumber((agent.totalSupply || 0) * 0.15)}
          </span>
        </div>
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 p-3 rounded-lg">
          <span className="text-black font-medium">
            {t('iaoParticipatedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
          </span>
          <span className="font-semibold text-[#F47521] break-all">
            {isPoolInfoLoading ? "--" : formatNumber(poolInfo?.totalDeposited || '0')}
          </span>
        </div>
      </div>
    </div>
  );

  // LP池数据展示 - 只负责渲染，不处理逻辑
  const LpPoolData = () => (
    <div className="mt-6 sm:mt-8">
      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('lpPoolData')}</h3>
      <div className="space-y-3 sm:space-y-4">
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-purple-50 p-3 rounded-lg">
          <span className="text-black font-medium">{t('lpPoolTokenAmount', { symbol: agent.symbol })}:</span>
          <span className="font-semibold text-[#F47521] break-all">
            {formatNumber((agent as any).targetTokenAmountLp || 0)}
          </span>
        </div>
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-green-50 p-3 rounded-lg">
          <span className="text-black font-medium">{t('lpPoolBaseAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:</span>
          <span className="font-semibold text-[#F47521] break-all">
            {formatNumber((agent as any).baseTokenAmountLp || 0)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 管理面板和筹资结果 */}
      <div className="space-y-4">
        {/* IAO管理面板 - 简化版本直接集成 */}
        {isCreator && isIaoSuccessful && (
          <div className="bg-white rounded-lg border p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">IAO 管理流程</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">IAO 成功</span>
              </div>
            </div>

            {/* 简化的步骤进度 - 正确的3步流程 */}
            <div className="space-y-3">
              {/* 步骤1: 创建代币 */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.tokenAddress ? 'bg-green-50 border-green-200' :
                isCreating || tokenCreationTask?.status === 'PENDING' || tokenCreationTask?.status === 'PROCESSING' ? 'bg-blue-50 border-blue-200' :
                tokenCreationTask?.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🪙</span>
                  <div>
                    <div className="font-medium text-sm">1. 创建代币</div>
                    <div className="text-xs text-gray-600">部署Drc20代币合约</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.tokenAddress ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>
                  ) : isCreating || tokenCreationTask?.status === 'PENDING' || tokenCreationTask?.status === 'PROCESSING' ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">创建中...</span>
                  ) : tokenCreationTask?.status === 'FAILED' ? (
                    <Button size="sm" onClick={onCreateToken} variant="destructive">
                      重试创建
                    </Button>
                  ) : (
                    <Button size="sm" onClick={onCreateToken} disabled={isCreating}>
                      创建代币
                    </Button>
                  )}
                </div>
              </div>

              {/* 步骤2: 代币分发 */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.tokensDistributed && agent.liquidityAdded ? 'bg-green-50 border-green-200' :
                distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING' ? 'bg-blue-50 border-blue-200' :
                distributionTask?.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                agent.tokenAddress ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📤</span>
                  <div>
                    <div className="font-medium text-sm">2. 代币分发</div>
                    <div className="text-xs text-gray-600">分发代币、添加流动性</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.tokensDistributed && agent.liquidityAdded ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>
                  ) : distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING' ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">分发中...</span>
                  ) : distributionTask?.status === 'FAILED' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">分发失败</span>
                      <TokenDistributionModal agent={agent} onStatusUpdate={onRefreshStatus} />
                    </div>
                  ) : distributionTask?.status === 'COMPLETED' || (agent.tokensDistributed && agent.liquidityAdded) ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>
                  ) : agent.tokenAddress ? (
                    <div className="flex items-center gap-2">
                      <TokenDistributionModal agent={agent} onStatusUpdate={onRefreshStatus} />
                    </div>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">等待中</span>
                  )}
                </div>
              </div>
              {/* 步骤3: 销毁代币 */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.tokensBurned ? 'bg-green-50 border-green-200' :
                isBurning ? 'bg-blue-50 border-blue-200' :
                (agent.tokensDistributed && agent.liquidityAdded) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔥</span>
                  <div>
                    <div className="font-medium text-sm">3. 销毁代币</div>
                    <div className="text-xs text-gray-600">销毁IAO中5%的XAA代币</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.tokensBurned ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>
                  ) : isBurning ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">销毁中...</span>
                  ) : (agent.tokensDistributed && agent.liquidityAdded) ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleBurnTokens}
                      disabled={isBurning}
                    >
                      销毁代币
                    </Button>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">等待中</span>
                  )}
                </div>
              </div>

              {/* 代币地址显示 */}
              {agent.tokenAddress && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">代币地址:</div>
                  <div className="text-xs font-mono break-all">{agent.tokenAddress}</div>
                </div>
              )}

              {/* 完成状态 */}
              {agent.ownerTransferred && (
                <div className="mt-4 text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-600 mb-2">🎉</div>
                  <div className="text-sm font-medium text-green-800">
                    所有管理步骤已完成！项目已完全去中心化。
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <FundraisingResults />
      </div>

      {/* IAO完成数据 - 独立区域，样式与LP池数据一致 */}
      <IaoCompletedData />

      {/* LP池数据 - 独立区域 */}
      <LpPoolData />

      {/* 用户质押信息 - 独立区域 */}

      
      <UserStakeInfo 
        userStakeInfo={userStakeInfo}
        agent={agent}
        isIaoSuccessful={isIaoSuccessful}
        onClaimRewards={onClaimRewards}
        isClaiming={isClaiming}
        canClaim={canClaim}
        handleClaimRefund={handleClaimRefund}
        poolInfo={poolInfo}
        onRefreshStatus={onRefreshStatus}
        formatNumber={formatNumber}
      />
    </>
  );
};
