import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

// 格式化大数字显示
const formatLargeNumber = (num: string | number): string => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '0';

  if (numValue >= 1000000000) {
    return (numValue / 1000000000).toFixed(1) + 'B';
  } else if (numValue >= 1000000) {
    return (numValue / 1000000).toFixed(1) + 'M';
  } else if (numValue >= 1000) {
    return (numValue / 1000).toFixed(1) + 'K';
  } else {
    return numValue.toFixed(0);
  }
};

interface IaoProgressData {
  totalDeposited: string;
  investorCount: number;
  targetAmount: string;
  targetXaaAmount: string; // 目标金额对应的XAA数量
  progressPercentage: string;
  remainingAmount: string;
  remainingXaaAmount: string; // 还差多少XAA
  currentUsdValue: string;
}

interface IaoResultDisplayProps {
  iaoProgress: IaoProgressData;
  isIaoEnded: boolean;
  isIaoSuccessful: boolean;
  isCreator: boolean;
  agentId?: string;
  startTime?: number;
  endTime?: number;
  isPoolInfoLoading?: boolean;
  userStakeInfo?: {
    userDeposited: string;
    hasClaimed: boolean;
  };
  onRefreshStatus?: () => void | Promise<void>;
}

export const IaoResultDisplay: React.FC<IaoResultDisplayProps> = ({
  iaoProgress,
  isIaoEnded,
  isIaoSuccessful,
  isCreator,
  agentId,
  startTime,
  endTime,
  isPoolInfoLoading,
  userStakeInfo,
  onRefreshStatus
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const t = useTranslations('iaoPool');
  const router = useRouter();
  const locale = useLocale();

  // 如果正在加载池信息，不显示
  if (isPoolInfoLoading) {
    return null;
  }

  // 如果没有获取到开始时间和结束时间，不显示组件
  if (!startTime || !endTime) {
    return null;
  }

  // 只在 IAO 结束后显示
  if (!isIaoEnded) {
    return null;
  }

  // 如果 IAO 成功，不显示此组件
  if (isIaoSuccessful) {
    return null;
  }

  const handleRefresh = async () => {
    if (onRefreshStatus) {
      setIsRefreshing(true);
      try {
        await onRefreshStatus();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleEditPrompt = () => {
    if (agentId) {
      router.push(`/${locale}/chat/edit/${agentId}`);
    }
  };

  const hasUserInvestment = userStakeInfo && Number(userStakeInfo.userDeposited) > 0;

  return (
    <div className={`p-4 rounded-lg space-y-4 ${
      isIaoSuccessful ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
    }`}>
      {/* 状态标题 */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{t('iaoStatusTitle')}</span>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isIaoSuccessful ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-sm font-semibold ${
            isIaoSuccessful ? 'text-green-600' : 'text-red-600'
          }`}>
            {isIaoSuccessful ? t('iaoSuccessful') : t('iaoFailed')}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isIaoSuccessful ? 'bg-green-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(Number(iaoProgress.progressPercentage), 100)}%` }}
        ></div>
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">{t('finalAmount')}:</span>
          <div className={`font-semibold ${
            isIaoSuccessful ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className="text-sm">{formatLargeNumber(iaoProgress.totalDeposited)}$XAA</div>
            <div className="text-xs text-gray-500">(${iaoProgress.currentUsdValue}USDT)</div>
          </div>
        </div>
        <div>
          <span className="text-gray-600">{t('targetAmount')}:</span>
          <div className="font-semibold text-gray-800">
            <div className="text-sm">{formatLargeNumber(iaoProgress.targetXaaAmount)}$XAA</div>
            <div className="text-xs text-gray-500">($1500USDT)</div>
          </div>
        </div>
        {/* <div>
          <span className="text-gray-600">{t('investorCount')}:</span>
          <div className="font-semibold text-blue-600">
            {iaoProgress.investorCount} 人
          </div>
        </div> */}
        <div>
          <span className="text-gray-600">
            {isIaoSuccessful ? t('overAchieved') : t('underAchieved')}:
          </span>
          <div className={`font-semibold ${
            isIaoSuccessful ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className="text-sm">{formatLargeNumber(iaoProgress.remainingXaaAmount)}$XAA</div>
            <div className="text-xs text-gray-500">(${Math.abs(Number(iaoProgress.remainingAmount))}USDT)</div>
          </div>
        </div>
      </div>

      {/* IAO 成功状态 */}
      {isIaoSuccessful && (
        <div className="p-3 bg-green-100 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800 mb-1">{t('iaoSuccessTitle')}</h4>
              <p className="text-xs text-green-700 mb-2">
                {t('iaoSuccessMessage', { isCreator: isCreator ? 'true' : 'other' })}
              </p>
              {!isCreator && (
                <p className="text-xs text-green-700">
                  {t('iaoSuccessCreatorTip')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* IAO 失败状态 */}
      {!isIaoSuccessful && isCreator && (
        <div className="p-3 bg-red-100 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-2">{t('iaoFailedTitle')}</h4>
              <p className="text-xs text-red-700 mb-3">
                {t('iaoFailedMessage')}
              </p>

              {/* 针对不同用户显示不同的提示 */}
              {isCreator ? (
                <div className="space-y-2">
                  <p className="text-xs text-red-700 font-medium">{t('creatorSuggestions')}</p>
                  <ul className="text-xs text-red-700 space-y-1 ml-4">
                    <li>{t('creatorSuggestionsList.analyze')}</li>
                    <li>{t('creatorSuggestionsList.community')}</li>
                    <li>
                      {agentId ? (
                        <button
                          onClick={handleEditPrompt}
                          className="text-red-700 hover:text-red-800 underline hover:no-underline transition-colors cursor-pointer"
                        >
                          {t('creatorSuggestionsList.editPrompt')}
                        </button>
                      ) : (
                        <span>{t('creatorSuggestionsList.editPrompt')}</span>
                      )}
                    </li>
                    <li>{t('creatorSuggestionsList.retry')}</li>
                  </ul>
                </div>
              ) : hasUserInvestment ? (
                <div className="space-y-2">
                  <p className="text-xs text-red-700 font-medium">{t('investmentRefund')}</p>
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-xs text-red-800">
                      {t('refundAutomatic')}
                    </p>
                    <p className="text-xs text-red-800">
                      {t('checkWallet')}
                    </p>
                    <p className="text-xs text-red-800">
                      {t('refreshIfNeeded')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-700">
                  {t('thankYouMessage')}
                </p>
              )}
            </div>
          </div>

          {/* 刷新状态按钮 */}
          {(hasUserInvestment || isCreator) && (
            <div className="mt-3 pt-2 border-t border-red-200">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full text-red-700 border-red-300 hover:bg-red-50"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('refreshingStatus')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    {t('refreshStatusButton')}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
