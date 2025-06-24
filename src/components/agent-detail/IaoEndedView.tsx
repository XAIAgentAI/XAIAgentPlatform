/**
 * IAO结束后的视图组件 - 简化版本
 */

'use client';

import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { IaoResultDisplay } from './IaoResultDisplay';
import type { LocalAgent } from "@/types/agent";

interface IaoEndedViewProps {
  agent: LocalAgent;
  poolInfo: any;
  iaoProgress: any;
  userStakeInfo: any;
  isIaoSuccessful: boolean;
  isCreator: boolean;
  tokenCreationTask: any;
  isPoolInfoLoading: boolean;
  onCreateToken: () => void;
  onPaymentModalOpen: () => void;
  onTimeModalOpen: () => void;
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
  isPoolInfoLoading,
  onCreateToken,
  onPaymentModalOpen,
  onTimeModalOpen,
  onClaimRewards,
  onRefreshStatus,
  isCreating,
  isClaiming,
  canClaim
}: IaoEndedViewProps) => {
  const t = useTranslations('iaoPool');

  const formatNumber = (value: string | number, decimals: number = 2): string => {
    if (!value || value === '0') return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  };

  // 检查是否在领取延迟期内
  const shouldShowClaimButton = (): boolean => {
    if (!userStakeInfo.userDeposited || Number(userStakeInfo.userDeposited) <= 0) return false;

    const claimDelayMs = 7 * 24 * 60 * 60 * 1000; // 7天
    const canClaimAfter = (poolInfo?.endTime || 0) * 1000 + claimDelayMs;

    return Date.now() >= canClaimAfter;
  };

  // 管理面板 - 只负责渲染，不处理逻辑
  const CreatorManagementPanel = () => {
    if (!isCreator) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">IAO 管理面板</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isIaoSuccessful ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">{isIaoSuccessful ? 'IAO 成功' : 'IAO 失败'}</span>
          </div>
        </div>

        {isIaoSuccessful ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Token创建 */}
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">代币创建</span>
                  {agent.tokenAddress ? (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">已完成</span>
                  ) : tokenCreationTask ? (
                    <span className={`text-xs px-2 py-1 rounded ${tokenCreationTask.status === 'FAILED' ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100'
                      }`}>
                      {tokenCreationTask.status === 'FAILED' ? '失败' : '进行中'}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">待创建</span>
                  )}
                </div>
                {!agent.tokenAddress && (
                  <Button
                    size="sm"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={onCreateToken}
                    disabled={isCreating}
                  >
                    {isCreating ? '创建中...' : tokenCreationTask?.status === 'FAILED' ? '重试创建' : '创建代币'}
                  </Button>
                )}
              </div>

              {/* 支付合约 */}
              <div className="border rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">支付合约</span>
                  {agent.paymentContractAddress ? (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">已部署</span>
                  ) : (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">待部署</span>
                  )}
                </div>
                {!agent.paymentContractAddress && (
                  <Button
                    size="sm"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={onPaymentModalOpen}
                  >
                    部署支付合约
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={onTimeModalOpen}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                修改 IAO 时间
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <p className="text-gray-600 text-sm">IAO 未达到成功标准，无法进行代币创建和合约部署</p>
          </div>
        )}
      </div>
    );
  };

  // 筹资结果展示 - 只负责渲染，不处理逻辑
  const FundraisingResults = () => (
    <div className="space-y-3 sm:space-y-4">


      <IaoResultDisplay
        iaoProgress={iaoProgress}
        isIaoEnded={true}
        isIaoSuccessful={isIaoSuccessful}
        isCreator={isCreator}
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
            {formatNumber(poolInfo?.totalReward || '0')}
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

  // 用户质押信息 - 只负责渲染，不处理逻辑
  const UserStakeInfo = () => {
    if (!userStakeInfo.userDeposited || Number(userStakeInfo.userDeposited) <= 0) return null;

    const totalClaimable = (parseFloat(userStakeInfo.rewardForOrigin) || 0) + (parseFloat(userStakeInfo.rewardForNFT) || 0);

    return (
      <div className="space-y-3 mt-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
            <span className="text-[#F47521] ml-1">{formatNumber(userStakeInfo.userDeposited)}</span>
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {userStakeInfo.hasClaimed ? t('claimedAmount', { symbol: agent.symbol }) : t('claimableAmount', { symbol: agent.symbol })}:
            <span className="text-[#F47521] ml-1">
              {formatNumber(userStakeInfo.hasClaimed ? userStakeInfo.claimedAmount : totalClaimable.toString())}
            </span>
          </p>
        </div>

        {shouldShowClaimButton() && !userStakeInfo.hasClaimed && (
          <Button
            className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white"
            onClick={onClaimRewards}
            disabled={isClaiming || !canClaim}
          >
            {isClaiming ? t('claiming') : t('claim')}
          </Button>
        )}

        {userStakeInfo.hasClaimed && agent.tokenAddress && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">{t('importTokenAddress')}</p>
            <div className="relative">
              <code className="block p-2 bg-black/10 rounded text-xs break-all pr-24">
                {agent.tokenAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => navigator.clipboard.writeText(agent.tokenAddress || '')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                {t('copy')}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 管理面板和筹资结果 - 合并在标题上方 */}
      <div className="space-y-4 mb-6">


        <CreatorManagementPanel />
        <FundraisingResults />


      </div>

      {/* IAO完成数据 - 独立区域，样式与LP池数据一致 */}
      <IaoCompletedData />

      {/* LP池数据 - 独立区域 */}
      <LpPoolData />

      {/* 用户质押信息 - 独立区域 */}
      <UserStakeInfo />
    </>
  );
};
