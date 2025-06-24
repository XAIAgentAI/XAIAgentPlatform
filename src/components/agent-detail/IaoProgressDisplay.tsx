import React from 'react';

interface IaoProgressData {
  totalDeposited: string;
  investorCount: number;
  targetAmount: string;
  progressPercentage: string;
  remainingAmount: string;
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
}

export const IaoProgressDisplay: React.FC<IaoProgressDisplayProps> = ({
  iaoProgress,
  isIaoEnded,
  isIaoSuccessful,
  isCreator,
  startTime,
  endTime,
  isPoolInfoLoading
}) => {
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
          <span className="ml-2 text-sm text-gray-600">加载筹资信息中...</span>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-green-50 p-4 rounded-lg space-y-3 mb-4 mt-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">实时筹资进度</span>
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
          <span className="text-gray-600">已筹集:</span>
          <div className="font-semibold text-green-600">
            ${iaoProgress.currentUsdValue} USD
          </div>
          <div className="text-xs text-gray-500">
            {iaoProgress.totalDeposited} XAA
          </div>
        </div>
        <div>
          <span className="text-gray-600">目标:</span>
          <div className="font-semibold text-gray-800">
            ${iaoProgress.targetAmount} USD
          </div>
        </div>
        <div>
          <span className="text-gray-600">投资人数:</span>
          <div className="font-semibold text-blue-600">
            {iaoProgress.investorCount} 人
          </div>
        </div>
        <div>
          <span className="text-gray-600">还需:</span>
          <div className="font-semibold text-orange-600">
            ${iaoProgress.remainingAmount} USD
          </div>
        </div>
      </div>

      {/* 进度提示 */}
      <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
        💡 筹资进度每30秒自动更新，目标金额为 $1500 USD
      </div>
    </div>
  );
};
