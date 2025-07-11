import React from 'react';
import { useTranslations } from 'next-intl';

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

interface IaoProgressDisplayProps {
  iaoProgress: IaoProgressData;
  isIaoEnded: boolean;
  isIaoSuccessful: boolean;
  isCreator: boolean;
  startTime?: number;
  endTime?: number;
  isPoolInfoLoading?: boolean;
  isRefreshing?: boolean;
}

export const IaoProgressDisplay: React.FC<IaoProgressDisplayProps> = ({
  iaoProgress,
  isIaoEnded,
  isIaoSuccessful,
  isCreator,
  startTime,
  endTime,
  isPoolInfoLoading,
  isRefreshing
}) => {
  const t = useTranslations('iaoPool');
  // 如果没有获取到开始时间和结束时间，不显示组件
  if (!startTime || !endTime) {
    return null;
  }

  // 检查IAO是否已经开始
  const now = Math.floor(Date.now() / 1000);
  const isIaoStarted = startTime > 0 && now >= startTime;

  // 如果IAO还没有开始，不显示组件
  if (!isIaoStarted) {
    return null;
  }

  // 如果IAO已经结束，不显示组件
  if (isIaoEnded) {
    return null;
  }

  // 如果正在加载池信息，显示加载状态
  if (isPoolInfoLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4 mt-4">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          <span className="ml-2 text-sm text-gray-600">{t('loadingFundingInfo')}</span>
        </div>
      </div>
    );
  }



  return (
    <div className="relative bg-green-50 p-4 rounded-lg space-y-3 mb-4 mt-4">
      {/* 刷新状态覆盖层 */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{t('updatingData')}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{t('realTimeFundingProgress')}</span>
        <span className="text-sm font-semibold text-green-600">
          {iaoProgress.progressPercentage}%
        </span>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-green-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(Number(iaoProgress.progressPercentage), 100)}%` }}
        ></div>
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">{t('raised')}:</span>
          <div className="font-semibold text-green-600">
            <div className="text-sm">{formatLargeNumber(iaoProgress.totalDeposited)}$XAA</div>
            <div className="text-xs text-gray-500">(${iaoProgress.currentUsdValue}USDT)</div>
          </div>
        </div>
        <div>
          <span className="text-gray-600">{t('target')}:</span>
          <div className="font-semibold text-gray-800">
            <div className="text-sm">{formatLargeNumber(iaoProgress.targetXaaAmount)}$XAA</div>
            <div className="text-xs text-gray-500">($1500USDT)</div>
          </div>
        </div>
        <div>
          <span className="text-gray-600">{t('investors')}:</span>
          <div className="font-semibold text-blue-600">
            {iaoProgress.investorCount} {t('people')}
          </div>
        </div>
        <div>
          <span className="text-gray-600">{t('remaining')}:</span>
          <div className="font-semibold text-orange-600">
            <div className="text-sm">{formatLargeNumber(iaoProgress.remainingXaaAmount)}$XAA</div>
            <div className="text-xs text-gray-500">(${iaoProgress.remainingAmount}USDT)</div>
          </div>
        </div>
      </div>

      {/* 进度提示 */}
      <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
        💡 {t('progressTip')}
      </div>
    </div>
  );
};
