'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // 将Unix时间戳转换为本地日期时间字符串
  const formatDateTimeLocal = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm格式
  };

  // 将本地日期时间字符串转换为Unix时间戳
  const parseDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return 0;
    return Math.floor(new Date(dateTimeStr).getTime() / 1000);
  };

  // 初始化时间值
  useEffect(() => {
    if (isOpen) {
      setStartTime(formatDateTimeLocal(currentStartTime));
      setEndTime(formatDateTimeLocal(currentEndTime));
    }
  }, [isOpen, currentStartTime, currentEndTime]);

  const handleSubmit = async () => {
    const newStartTime = parseDateTime(startTime);
    const newEndTime = parseDateTime(endTime);

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
    setStartTime(formatDateTimeLocal(currentStartTime));
    setEndTime(formatDateTimeLocal(currentEndTime));
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
            <Label htmlFor="current-start">当前开始时间</Label>
            <div className="text-sm text-gray-600">
              {currentStartTime > 0 ? new Date(currentStartTime * 1000).toLocaleString() : '未设置'}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="current-end">当前结束时间</Label>
            <div className="text-sm text-gray-600">
              {currentEndTime > 0 ? new Date(currentEndTime * 1000).toLocaleString() : '未设置'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-time">新开始时间</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-time">新结束时间</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isLoading}
            />
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
            disabled={isLoading || !startTime || !endTime}
            className="bg-[#F47521] hover:bg-[#F47521]/90"
          >
            {isLoading ? '更新中...' : '确认更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
