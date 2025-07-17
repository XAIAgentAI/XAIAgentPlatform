'use client';

import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { Countdown } from "@/components/ui-custom/countdown";
import type { LocalAgent } from "@/types/agent";

interface UserStakeInfoProps {
  userStakeInfo: any;
  agent: LocalAgent;
  isIaoSuccessful: boolean;
  onClaimRewards: () => void;
  isClaiming: boolean;
  canClaim: boolean;
  handleClaimRefund: () => void;
  poolInfo: any;
  onRefreshStatus: () => void;
  formatNumber: (value: string | number, decimals?: number) => string;
}

export const UserStakeInfo = ({
  userStakeInfo,
  agent,
  isIaoSuccessful,
  onClaimRewards,
  isClaiming,
  canClaim,
  handleClaimRefund,
  poolInfo,
  onRefreshStatus,
  formatNumber
}: UserStakeInfoProps) => {
  const t = useTranslations('iaoPool');

  console.log("123321", {
    userStakeInfo,
    userDeposited: userStakeInfo.userDeposited
  });
  

  // 如果用户没有质押，不显示此部分
  if (!userStakeInfo || !userStakeInfo.userDeposited || Number(userStakeInfo.userDeposited) <= 0) {
    return null;
  }

  return (
    <div className="mt-6 sm:mt-8">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{t('yourStakeInfo')}</h2>
      <div className="space-y-3 sm:space-y-4">
        <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 p-3 rounded-lg">
          <span className="text-black font-medium">{t('yourStake', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:</span>
          <span className="font-semibold text-[#F47521] break-all">
            {formatNumber(userStakeInfo.userDeposited)}
          </span>
        </div>

        {/* 只处理成功的IAO，显示领取代币按钮 */}
        {isIaoSuccessful ? (
          <div className="flex justify-center">
            <Button
              className={`w-full sm:w-auto px-8 ${
                userStakeInfo.hasClaimed || !canClaim
                  ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed'
                  : 'bg-[#F47521] hover:bg-[#E56411]'
              }`}
              onClick={onClaimRewards}
              disabled={isClaiming || userStakeInfo.hasClaimed || !canClaim}
            >
              {isClaiming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('claiming')}
                </>
              ) : userStakeInfo.hasClaimed ? (
                t('rewardClaimed')
              ) : (
                t('claimRewards')
              )}
            </Button>
          </div>
        ) : (
          // 失败的IAO，显示领取退款按钮
          <div className="flex flex-col items-center"> 
            {/* 如果无法领取且未领取过，显示等待提示 */}
            {!canClaim && !userStakeInfo.hasClaimed && Number(userStakeInfo.userDeposited) > 0 && !isClaiming && poolInfo?.endTime && (
              <div className="mb-3 w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-sm font-medium text-yellow-700">
                    {t('waitingForRefund')}
                  </span>
                </div>
                <div className="flex items-center text-yellow-600">
                  <span className="text-xs mr-1">剩余时间:</span>
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
                  {t('claiming')}
                </>
              ) : userStakeInfo.hasClaimed ? (
                t('refundClaimed')
              ) : !canClaim && Number(userStakeInfo.userDeposited) > 0 && !isClaiming ? (
                t('waitingToClaimRefund')
              ) : (
                t('claimRefund')
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 