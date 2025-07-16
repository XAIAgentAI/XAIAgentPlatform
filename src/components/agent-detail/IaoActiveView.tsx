/**
 * IAO进行中的视图组件 - 简化版本
 */

'use client';

import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { Countdown } from "../ui-custom/countdown";
import { IaoProgressDisplay } from './IaoProgressDisplay';
import type { LocalAgent } from "@/types/agent";

interface IaoActiveViewProps {
  agent: LocalAgent;
  poolInfo: any;
  iaoProgress: any;
  userStakeInfo: any;
  dbcAmount: string;
  setDbcAmount: (amount: string) => void;
  maxDbcAmount: string;
  maxXaaAmount: string;
  xaaBalance: string;
  isCreator: boolean;
  isIaoSuccessful: boolean;
  isStakeLoading: boolean;
  isPoolInfoLoading: boolean;
  isUserStakeInfoLoading: boolean;
  isAuthenticated: boolean;
  isConnected: boolean;
  onStake: () => void;
  onSetMaxAmount: () => void;
  onRefresh?: () => void | Promise<void>;
  isContractOwner?: () => Promise<boolean>;
}

export const IaoActiveView = ({
  agent,
  poolInfo,
  iaoProgress,
  userStakeInfo,
  dbcAmount,
  setDbcAmount,
  maxDbcAmount,
  maxXaaAmount,
  xaaBalance,
  isCreator,
  isIaoSuccessful,
  isStakeLoading,
  isPoolInfoLoading,
  isUserStakeInfoLoading,
  isAuthenticated,
  isConnected,
  onStake,
  onSetMaxAmount,
  onRefresh,
  isContractOwner
}: IaoActiveViewProps) => {
  const t = useTranslations('iaoPool');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 处理刷新
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
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

  // 检查IAO是否已开始
  const isIaoStarted = poolInfo?.startTime ? Date.now() >= poolInfo.startTime * 1000 : false;
  
  // 检查IAO是否已结束
  const isIaoEnded = poolInfo?.endTime ? Date.now() >= poolInfo.endTime * 1000 : false;
  
  // 检查IAO是否活跃
  const isIaoActive = isIaoStarted && !isIaoEnded;

  // 根据代理符号获取当前使用的最大金额
  const currentMaxAmount = agent.symbol === 'XAA' ? maxDbcAmount : maxXaaAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 简单的输入验证
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDbcAmount(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 允许的按键
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter'];
    const disallowedKeys = ['-', 'e', 'E', '+'];
    
    if (allowedKeys.includes(e.key)) return;
    if (disallowedKeys.includes(e.key)) {
      e.preventDefault();
      return;
    }
    
    if (!/^[0-9.]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const getButtonText = (): string => {
    if (!isIaoStarted) return t('iaoNotStarted');
    if (!isAuthenticated) return t('connectWalletFirst');
    if (isStakeLoading) return t('processing');
    if (!isIaoActive) return t('stakeNotStarted');
    return t('send');
  };

  const isButtonDisabled = useMemo((): boolean => {
    const buttonState = {
      isAuthenticated,
      isIaoActive,
      isStakeLoading,
      isIaoStarted,
      dbcAmount,
      dbcAmountNumber: Number(dbcAmount),
      currentMaxAmount,
      currentMaxAmountNumber: Number(currentMaxAmount),
      isAmountValid: Number(dbcAmount) > 0,
      isAmountWithinLimit: Number(dbcAmount) <= Number(currentMaxAmount),
      disabled: !isAuthenticated ||
                !isIaoActive ||
                isStakeLoading ||
                !isIaoStarted ||
                !dbcAmount ||
                Number(dbcAmount) <= 0 ||
                Number(dbcAmount) > Number(currentMaxAmount)
    };

    console.warn("投资按钮状态:", buttonState);

    return buttonState.disabled;
  }, [isAuthenticated, isIaoActive, isStakeLoading, isIaoStarted, dbcAmount, currentMaxAmount]);

  const renderPoolInfo = () => (
    <div className="relative space-y-3 sm:space-y-4">
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

      {/* 状态指示器 */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          !poolInfo?.startTime ? 'bg-gray-500' :
          !isIaoStarted ? 'bg-blue-500' :
          isIaoActive ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className={`text-sm font-medium ${
          !poolInfo?.startTime ? 'text-gray-500' :
          !isIaoStarted ? 'text-blue-500' :
          isIaoActive ? 'text-green-500' : 'text-red-500'
        }`}>
          IAO {!poolInfo?.startTime ? t('notStarted') : !isIaoStarted ? t('comingSoon') : isIaoActive ? t('inProgress') : t('ended')}
        </span>
      </div>

      {/* 池子总量 */}
      <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-orange-50 p-3 rounded-lg">
        <span className="text-black font-medium">{t('totalInPool', { symbol: agent.symbol })}:</span>
        <span className="font-semibold text-[#F47521] break-all">
          {isPoolInfoLoading ? "--" : `${formatNumber(poolInfo?.totalReward || '0')} ${agent.symbol}`}
        </span>
      </div>

      {/* 当前质押总量 */}
      <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-blue-50 p-3 rounded-lg">
        <span className="text-black font-medium">
          {t('currentTotal', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
        </span>
        <span className="font-semibold text-[#F47521] break-all">
          {poolInfo?.startTime ? (
            isPoolInfoLoading ? "--" : formatNumber(iaoProgress.totalDeposited)
          ) : "0"}
        </span>
      </div>

      {/* 倒计时 */}
      <div className="text-sm sm:text-base flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2 bg-purple-50 p-3 rounded-lg">
        <span className="text-black font-medium">
          {!poolInfo?.startTime ? t('toBeAnnounced') : 
           Date.now() < poolInfo.startTime * 1000 ? t('startCountdown') : t('endCountdown')}:
        </span>
        {!poolInfo?.startTime ? (
          <span className="font-semibold text-[#F47521] break-all">{t('toBeAnnounced')}</span>
        ) : isPoolInfoLoading ? (
          <span className="font-semibold text-[#F47521] break-all">--</span>
        ) : Date.now() < poolInfo.startTime * 1000 ? (
          <Countdown
            remainingTime={Math.max(0, poolInfo.startTime * 1000 - Date.now())}
            className="font-semibold text-[#F47521] break-all text-sm sm:text-base"
          />
        ) : poolInfo.endTime ? (
          <Countdown
            remainingTime={Math.max(0, poolInfo.endTime * 1000 - Date.now())}
            className="font-semibold text-[#F47521] break-all text-sm sm:text-base"
          />
        ) : (
          <span className="font-semibold text-[#F47521] break-all">{t('toBeAnnounced')}</span>
        )}
      </div>
    </div>
  );

  const renderStakeForm = () => {
    if (isIaoEnded) return null;

    return (
      <div className="relative mt-0 pt-4 sm:pt-6 bg-muted rounded-lg">
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

        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('youSend')}</h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="font-medium text-sm sm:text-base min-w-fit">
            {agent.symbol === 'XAA' ? 'DBC' : 'XAA'}
          </div>
          
          <div className="flex-1 w-full relative">
            <Input
              type="number"
              value={dbcAmount}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              min="0"
              max={currentMaxAmount}
              step="any"
              className="pr-12 sm:pr-16 text-sm sm:text-base"
              placeholder="00.00"
              disabled={!isIaoActive || isStakeLoading || !isAuthenticated}
            />
            
            <button
              onClick={onSetMaxAmount}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 sm:px-2 py-1 text-xs font-semibold text-primary hover:text-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isAuthenticated || !isIaoActive || isStakeLoading}
            >
              {t('maxButton')}
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-1">
          {t('availableBalance')}: {`${formatNumber(currentMaxAmount)} ${agent.symbol === 'XAA' ? 'DBC' : 'XAA'}`}
        </div>

        <Button
          className="w-full text-sm sm:text-base py-2 sm:py-3 mt-4"
          style={{ backgroundColor: '#F47521', borderColor: '#F47521' }}
          onClick={onStake}
          disabled={isButtonDisabled}
        >
          {getButtonText()}
        </Button>
      </div>
    );
  };

  const renderUserStakeInfo = () => {
    if (!userStakeInfo.userDeposited || Number(userStakeInfo.userDeposited) <= 0) return null;

    return (
      <div className="relative space-y-3 mt-4">
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

        <div>
          <p className="text-sm text-muted-foreground">
            {t('stakedAmount', { symbol: agent.symbol === 'XAA' ? 'DBC' : 'XAA' })}:
            <span className="text-[#F47521] ml-1">
              {isUserStakeInfoLoading ? "--" : formatNumber(userStakeInfo.userDeposited)}
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderPoolInfo()}

      {/* IAO进度显示 - 仅创建者可见 */}
      {isCreator && (
        <IaoProgressDisplay
          iaoProgress={iaoProgress}
          isIaoEnded={isIaoEnded}
          isIaoSuccessful={isIaoSuccessful}
          isCreator={isCreator}
          startTime={poolInfo?.startTime}
          endTime={poolInfo?.endTime}
          isPoolInfoLoading={isPoolInfoLoading}
          isRefreshing={isRefreshing}
        />
      )}

      {renderStakeForm()}
      {renderUserStakeInfo()}
    </>
  );
};
