'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from 'next-intl';

interface UpdateIaoTimeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentStartTime: number;
  currentEndTime: number;
  agentId: string;
  onSuccess?: () => void;
  isLoading?: boolean;
  isPoolInfoLoading?: boolean;
}

export const UpdateIaoTimeModal = ({
  isOpen,
  onOpenChange,
  currentStartTime,
  currentEndTime,
  agentId,
  onSuccess,
  isLoading: externalLoading = false,
  isPoolInfoLoading = false
}: UpdateIaoTimeModalProps) => {
  const { toast } = useToast();
  const t = useTranslations('iaoPool.updateTimeModal');
  const [isLoading, setIsLoading] = useState(externalLoading);

  // 开始时间设置（从现在开始的天数和小时数）
  const [iaoStartDays, setIaoStartDays] = useState<number>(1);
  const [iaoStartHours, setIaoStartHours] = useState<number>(0);

  // 结束时间设置（从现在开始的天数和小时数）
  const [iaoEndDays, setIaoEndDays] = useState<number>(4);
  const [iaoEndHours, setIaoEndHours] = useState<number>(0);

  // 错误状态
  const [startTimeError, setStartTimeError] = useState<boolean>(false);
  const [endTimeError, setEndTimeError] = useState<boolean>(false);

  // 引用用于滚动到错误字段
  const startTimeInputRef = useRef<HTMLDivElement>(null);
  const endTimeInputRef = useRef<HTMLDivElement>(null);

  // 判断IAO状态
  const now = Math.floor(Date.now() / 1000);
  const isIaoStarted = currentStartTime > 0 && now >= currentStartTime;
  const isIaoEnded = currentEndTime > 0 && now >= currentEndTime;

  // 初始化时间值
  useEffect(() => {
    if (isOpen && currentStartTime > 0 && currentEndTime > 0) {
      const now = Math.floor(Date.now() / 1000);
      const startDiff = currentStartTime - now;
      const endDiff = currentEndTime - now;

      // 初始化开始时间（如果还未开始）
      if (startDiff > 0) {
        const startDays = Math.floor(startDiff / (24 * 3600));
        const startHours = Math.floor((startDiff % (24 * 3600)) / 3600);
        setIaoStartDays(Math.max(1, startDays));
        setIaoStartHours(startHours);
      } else {
        // 如果已经开始，设置为默认值
        setIaoStartDays(1);
        setIaoStartHours(0);
      }

      // 初始化结束时间
      if (endDiff > 0) {
        const endDays = Math.floor(endDiff / (24 * 3600));
        const endHours = Math.floor((endDiff % (24 * 3600)) / 3600);
        setIaoEndDays(Math.max(1, endDays));
        setIaoEndHours(endHours);
      } else {
        // 如果已经结束，设置为默认值
        setIaoEndDays(4);
        setIaoEndHours(0);
      }
    }
  }, [isOpen, currentStartTime, currentEndTime]);

  // 格式化时间显示
  const formatTimeDisplay = (timestamp: number, isStart: boolean = true) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;

    // 如果是开始时间，显示相对时间
    if (isStart) {
      if (diff <= 0) {
        // 已经开始，显示多久之前开始的
        const pastDiff = Math.abs(diff);
        const days = Math.floor(pastDiff / (24 * 3600));
        const hours = Math.floor((pastDiff % (24 * 3600)) / 3600);
        const minutes = Math.floor((pastDiff % 3600) / 60);

        if (days > 0) {
          return t('countdownFormats.startedDaysAgo', { days, hours });
        } else if (hours > 0) {
          return t('countdownFormats.startedHoursAgo', { hours });
        } else if (minutes > 0) {
          return t('countdownFormats.startedMinutesAgo', { minutes });
        } else {
          return t('countdownFormats.startedJustNow');
        }
      } else {
        // 未来开始时间，显示倒计时
        const days = Math.floor(diff / (24 * 3600));
        const hours = Math.floor((diff % (24 * 3600)) / 3600);
        return t('countdownFormats.startIn', { days, hours });
      }
    }

    // 如果是结束时间，显示倒计时格式
    if (diff <= 0) {
      return t('countdownFormats.ended');
    }

    const days = Math.floor(diff / (24 * 3600));
    const hours = Math.floor((diff % (24 * 3600)) / 3600);
    return t('countdownFormats.endIn', { days, hours });
  };

  // 计算预览信息
  const getPreviewInfo = () => {
    const now = Math.floor(Date.now() / 1000);
    const startDelaySeconds = (iaoStartDays * 24 + iaoStartHours) * 3600;
    const endDelaySeconds = (iaoEndDays * 24 + iaoEndHours) * 3600;

    const newStartTime = isIaoStarted ? currentStartTime : (now + startDelaySeconds);
    const newEndTime = now + endDelaySeconds;

    const durationHours = Math.floor((newEndTime - newStartTime) / 3600);

    if (isIaoStarted) {
      return t('previewInfo.endTimeOnly', {
        endHours: iaoEndDays * 24 + iaoEndHours,
        durationHours
      });
    } else {
      return t('previewInfo.full', {
        startHours: iaoStartDays * 24 + iaoStartHours,
        endHours: iaoEndDays * 24 + iaoEndHours,
        durationHours
      });
    }
  };


  const handleSubmit = async () => {
    // 重置错误状态
    setStartTimeError(false);
    setEndTimeError(false);

    // 计算新的开始时间和结束时间
    const now = Math.floor(Date.now() / 1000);
    const startDelaySeconds = (iaoStartDays * 24 + iaoStartHours) * 3600;
    const endDelaySeconds = (iaoEndDays * 24 + iaoEndHours) * 3600;

    // 如果IAO已经开始，使用当前开始时间；否则使用新设置的开始时间
    const newStartTime = isIaoStarted ? currentStartTime : (now + startDelaySeconds);
    const newEndTime = now + endDelaySeconds;

    let hasError = false;

    // 验证开始时间（只有在IAO未开始时才验证）
    if (!isIaoStarted && startDelaySeconds < 24 * 3600) {
      setStartTimeError(true);
      hasError = true;
      toast({
        title: t('validationErrors.startAfter24h'),
        description: t('startTimeHint'),
        variant: "destructive"
      });
      startTimeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 验证结束时间必须晚于开始时间
    if (newEndTime <= newStartTime) {
      setEndTimeError(true);
      hasError = true;
      toast({
        title: t('validationErrors.endAfterStart'),
        description: t('endTimeHint'),
        variant: "destructive"
      });
      endTimeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 验证持续时间（72-240小时）
    const durationSeconds = newEndTime - newStartTime;
    if (durationSeconds < 72 * 3600 || durationSeconds > 240 * 3600) {
      setEndTimeError(true);
      hasError = true;
      toast({
        title: t('validationErrors.durationRange'),
        description: t('endTimeHint'),
        variant: "destructive"
      });
      endTimeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (hasError) return;

    try {
      setIsLoading(true);
      
      // 获取认证令牌
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('error'),
          description: t('connectWalletFirst'),
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // 发送更新时间请求到后端API
      const response = await fetch(`/api/agents/${agentId}/update-iao-times`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          startTime: newStartTime, 
          endTime: newEndTime 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.code === 200) {
        // 关闭模态框
        onOpenChange(false);
        
        // 显示成功提示
        toast({
          title: t('successMessage'),
          description: t('successDetails'),
        });
        
        // 如果有成功回调，调用它
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data.message || t('errorDetails'));
      }
    } catch (error: any) {
      console.error('Failed to update IAO times:', error);
      toast({
        title: t('errorMessage'),
        description: error.message || t('errorDetails'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // 重置错误状态
    setStartTimeError(false);
    setEndTimeError(false);
    // 重置为默认值
    setIaoStartDays(1);
    setIaoStartHours(0);
    setIaoEndDays(4);
    setIaoEndHours(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t('title')}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:gap-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('iaoStartTime')}</Label>
            <div className="text-xs sm:text-sm text-muted-foreground p-2 bg-muted rounded">
              {isPoolInfoLoading ? (
                <span className="text-blue-500">{t('loading')}</span>
              ) : currentStartTime > 0 ? (
                formatTimeDisplay(currentStartTime, true)
              ) : (
                <span className="text-gray-400">--</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('iaoEndTime')}</Label>
            <div className="text-xs sm:text-sm text-muted-foreground p-2 bg-muted rounded">
              {isPoolInfoLoading ? (
                <span className="text-blue-500">{t('loading')}</span>
              ) : currentEndTime > 0 ? (
                formatTimeDisplay(currentEndTime, false)
              ) : (
                <span className="text-gray-400">--</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-4 mb-4">
            {/* IAO开始时间 - 只有在IAO未开始时才显示 */}
            {!isIaoStarted && (
              <div ref={startTimeInputRef}>
                <label className="block mb-1">
                  {t('newStartTime')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={iaoStartDays}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const clampedValue = Math.max(1, Math.min(30, value));
                        setIaoStartDays(clampedValue);
                        if (startTimeError) setStartTimeError(false);
                      }}
                      placeholder="1"
                      className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                      disabled={isLoading || isIaoEnded}
                    />
                    <span className="text-gray-500 text-sm">{t('days')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={iaoStartHours}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const clampedValue = Math.max(0, Math.min(23, value));
                        setIaoStartHours(clampedValue);
                        if (startTimeError) setStartTimeError(false);
                      }}
                      placeholder="0"
                      className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                      disabled={isLoading || isIaoEnded}
                    />
                    <span className="text-gray-500 text-sm">{t('hours')}</span>
                  </div>
                </div>
                <div className="text-gray-500 text-xs mt-1">{t('startTimeHint')}</div>
                {startTimeError && (
                  <div className="text-red-500 text-xs mt-1">{t('startTimeError')}</div>
                )}
              </div>
            )}

            {/* IAO结束时间 */}
            <div ref={endTimeInputRef}>
              <label className="block mb-1">
                {t('newEndTime')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={iaoEndDays}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const clampedValue = Math.max(1, Math.min(30, value));
                      setIaoEndDays(clampedValue);
                      if (endTimeError) setEndTimeError(false);
                    }}
                    placeholder="4"
                    className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                    disabled={isLoading || isIaoEnded}
                  />
                  <span className="text-gray-500 text-sm">{t('days')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={iaoEndHours}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const clampedValue = Math.max(0, Math.min(23, value));
                      setIaoEndHours(clampedValue);
                      if (endTimeError) setEndTimeError(false);
                    }}
                    placeholder="0"
                    className="w-16 bg-white dark:bg-[#1a1a1a] p-1.5 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10 text-center"
                    disabled={isLoading || isIaoEnded}
                  />
                  <span className="text-gray-500 text-sm">{t('hours')}</span>
                </div>
              </div>
              <div className="text-gray-500 text-xs mt-1">{t('endTimeHint')}</div>
              {endTimeError && (
                <div className="text-red-500 text-xs mt-1">{t('endTimeError')}</div>
              )}
            </div>
            <div className="text-red-500 text-xs mt-1">
                {getPreviewInfo()}
              </div>
          </div>
        </div>



        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto text-sm sm:text-base"
          >
            {isLoading ? t('updating') : t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
