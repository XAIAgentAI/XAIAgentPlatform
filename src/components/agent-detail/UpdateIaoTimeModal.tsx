'use client';

import { useState, useEffect } from 'react';
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
import { ModalDateTimePicker } from "@/components/ui/modal-date-time-picker";
import { useTranslations } from 'next-intl';

interface UpdateIaoTimeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentStartTime: number;
  currentEndTime: number;
  onUpdateTimes: (startTime: number, endTime: number) => Promise<void>;
  isLoading?: boolean;
}

export const UpdateIaoTimeModal = ({
  isOpen,
  onOpenChange,
  currentStartTime,
  currentEndTime,
  onUpdateTimes,
  isLoading = false
}: UpdateIaoTimeModalProps) => {
  const { toast } = useToast();
  const t = useTranslations('iaoPool');

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [sharedTimezone, setSharedTimezone] = useState<string>('Asia/Shanghai');

  // 初始化时间值
  useEffect(() => {
    if (isOpen) {
      if (currentStartTime > 0) {
        setStartDate(new Date(currentStartTime * 1000));
      }
      if (currentEndTime > 0) {
        setEndDate(new Date(currentEndTime * 1000));
      }
    }
  }, [isOpen, currentStartTime, currentEndTime]);

  const handleTimezoneChange = (timezone: string) => {
    setSharedTimezone(timezone);
  };



  const handleSubmit = async () => {
    const newStartTime = Math.floor(startDate.getTime() / 1000);
    const newEndTime = Math.floor(endDate.getTime() / 1000);

    // 验证时间
    if (newStartTime <= 0 || newEndTime <= 0) {
      toast({
        title: "错误",
        description: "请选择有效的时间",
        variant: "destructive"
      });
      return;
    }

    if (newStartTime >= newEndTime) {
      toast({
        title: "错误",
        description: "开始时间必须早于结束时间",
        variant: "destructive"
      });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (newEndTime <= now) {
      toast({
        title: "错误",
        description: "结束时间必须晚于当前时间",
        variant: "destructive"
      });
      return;
    }

    try {
      await onUpdateTimes(newStartTime, newEndTime);
      onOpenChange(false);
      toast({
        title: "成功",
        description: "IAO时间已更新",
      });
    } catch (error) {
      console.error('Failed to update IAO times:', error);
      toast({
        title: "错误",
        description: "更新IAO时间失败",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // 重置为当前值
    if (currentStartTime > 0) {
      setStartDate(new Date(currentStartTime * 1000));
    }
    if (currentEndTime > 0) {
      setEndDate(new Date(currentEndTime * 1000));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>修改IAO时间</DialogTitle>
          <DialogDescription>
            修改IAO的开始时间和结束时间。只有合约所有者可以执行此操作。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>当前开始时间</Label>
            <div className="text-sm text-muted-foreground">
              {currentStartTime > 0 ? new Date(currentStartTime * 1000).toLocaleString() : '未设置'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>当前结束时间</Label>
            <div className="text-sm text-muted-foreground">
              {currentEndTime > 0 ? new Date(currentEndTime * 1000).toLocaleString() : '未设置'}
            </div>
          </div>

          <div className="space-y-2">
            <Label>新开始时间</Label>
            <div suppressHydrationWarning>
              <ModalDateTimePicker
                value={startDate}
                onChange={(timestamp: number) => {
                  setStartDate(new Date(timestamp));
                }}
                timezone={sharedTimezone}
                onTimezoneChange={handleTimezoneChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>新结束时间</Label>
            <div suppressHydrationWarning>
              <ModalDateTimePicker
                value={endDate}
                onChange={(timestamp: number) => {
                  setEndDate(new Date(timestamp));
                }}
                timezone={sharedTimezone}
                onTimezoneChange={handleTimezoneChange}
                showTimezone={false}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !startDate || !endDate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? '更新中...' : '确认更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
