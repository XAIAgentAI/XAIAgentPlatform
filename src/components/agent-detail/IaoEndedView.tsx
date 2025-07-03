/**
 * IAO结束后的视图组件 - 简化版本
 */

'use client';

import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { IaoResultDisplay } from './IaoResultDisplay';
// import LiquidityManagement from './LiquidityManagement';
// import TokenBurnModal from './TokenBurnModal';
// import OwnershipTransferModal from './OwnershipTransferModal';
import { TokenDistributionModal } from './TokenDistributionModal';
import type { LocalAgent } from "@/types/agent";

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
                    <div className="text-xs text-gray-600">部署ERC20代币合约</div>
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

              {/* 步骤2: 代币分发（包含流动性和销毁） */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.tokensDistributed && agent.liquidityAdded && agent.tokensBurned ? 'bg-green-50 border-green-200' :
                distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING' ? 'bg-blue-50 border-blue-200' :
                distributionTask?.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                agent.tokenAddress ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">📤</span>
                  <div>
                    <div className="font-medium text-sm">2. 代币分发</div>
                    <div className="text-xs text-gray-600">分发代币、添加流动性、销毁代币</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.tokensDistributed && agent.liquidityAdded && agent.tokensBurned ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>
                  ) : distributionTask?.status === 'PENDING' || distributionTask?.status === 'PROCESSING' ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">分发中...</span>
                  ) : distributionTask?.status === 'FAILED' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">分发失败</span>
                      <TokenDistributionModal agent={agent} onStatusUpdate={onRefreshStatus} />
                    </div>
                  ) : distributionTask?.status === 'COMPLETED' ? (
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

              {/* 步骤3: 转移所有权 */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                agent.ownerTransferred ? 'bg-green-50 border-green-200' :
                (agent.tokensDistributed && agent.liquidityAdded && agent.tokensBurned) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔑</span>
                  <div>
                    <div className="font-medium text-sm">3. 转移所有权</div>
                    <div className="text-xs text-gray-600">转移合约控制权，完全去中心化</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agent.ownerTransferred ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>
                  ) : (agent.tokensDistributed && agent.liquidityAdded && agent.tokensBurned) ? (
                    <Button size="sm" variant="outline" disabled>
                      开发中
                    </Button>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">等待中</span>
                  )}
                </div>
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
        )}
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
