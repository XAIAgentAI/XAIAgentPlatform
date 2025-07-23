'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Key, CheckCircle, AlertCircle, Crown, Pickaxe } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import type { LocalAgent } from '@/types/agent';

interface OwnershipTransferModalProps {
  agent: LocalAgent;
  onStatusUpdate?: () => void;
}

interface TaskStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL_SUCCESS';
  result?: any;
}

export default function OwnershipTransferModal({ agent, onStatusUpdate }: OwnershipTransferModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transferType, setTransferType] = useState<'token' | 'mining' | 'both'>('both');
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const { toast } = useToast();
  const t = useTranslations('common');

  // 执行Owner转移
  const handleTransferOwnership = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/agents/${agent.id}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          transferType,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        toast({
          title: t('success'),
          description: 'Owner转移任务已提交',
        });
        
        // 开始轮询任务状态
        setTaskStatus({ id: data.data.taskId, status: 'PENDING' });
        pollTaskStatus(data.data.taskId);
        setIsOpen(false);
      } else {
        throw new Error(data.message || t('operationFailed'));
      }
    } catch (error: any) {
      console.error('Transfer ownership failed:', error);
      toast({
        title: t('error'),
        description: error.message || t('operationFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    const maxAttempts = 60; // 最多轮询60次（5分钟）
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/agents/${agent.id}/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const response_data = await response.json();

        if (response_data.code === 200) {
          const task = response_data.data;
          setTaskStatus(task);

          if (task.status === 'COMPLETED') {
            toast({
              title: t('success'),
              description: 'Owner转移完成',
            });
            onStatusUpdate?.();
            return;
          } else if (task.status === 'FAILED') {
            toast({
              title: t('error'),
              description: 'Owner转移失败',
              variant: 'destructive',
            });
            return;
          } else if (task.status === 'PARTIAL_SUCCESS') {
            toast({
              title: t('warning'),
              description: '部分Owner转移成功',
              variant: 'destructive',
            });
            onStatusUpdate?.();
            return;
          }
        }

        // 继续轮询
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // 5秒后再次轮询
        }
      } catch (error) {
        console.error('Poll task status failed:', error);
      }
    };

    poll();
  };

  // 获取状态显示
  const getStatusDisplay = () => {
    const tokenTransferred = agent.ownerTransferred;
    const miningTransferred = agent.miningOwnerTransferred;

    if (tokenTransferred && miningTransferred) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          全部已转移
        </Badge>
      );
    }

    if (tokenTransferred || miningTransferred) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3" />
          部分已转移
        </Badge>
      );
    }

    if (taskStatus) {
      switch (taskStatus.status) {
        case 'PENDING':
          return (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
              <Loader2 className="w-3 h-3 animate-spin" />
              等待中
            </Badge>
          );
        case 'PROCESSING':
          return (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
              <Loader2 className="w-3 h-3 animate-spin" />
              转移中
            </Badge>
          );
        case 'FAILED':
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              失败
            </Badge>
          );
        case 'PARTIAL_SUCCESS':
          return (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
              <AlertCircle className="w-3 h-3" />
              部分成功
            </Badge>
          );
        default:
          return null;
      }
    }

    return (
      <Badge variant="secondary">
        未开始
      </Badge>
    );
  };

  // 检查是否可以转移Owner
  const canTransferOwnership = () => {
    // 必须先完成流动性添加和代币销毁
    if (!agent.liquidityAdded || !agent.tokensBurned) return false;
    
    // 检查是否已经全部转移
    if (agent.ownerTransferred && agent.miningOwnerTransferred) return false;
    
    // 正在处理中
    if (taskStatus && ['PENDING', 'PROCESSING'].includes(taskStatus.status)) return false;
    
    return true;
  };

  // 获取可用的转移选项
  const getAvailableOptions = () => {
    const options = [];
    
    if (!agent.ownerTransferred) {
      options.push({ value: 'token', label: '仅转移代币Owner', icon: Crown });
    }
    
    if (!agent.miningOwnerTransferred) {
      options.push({ value: 'mining', label: '仅转移挖矿合约Owner', icon: Pickaxe });
    }
    
    if (!agent.ownerTransferred && !agent.miningOwnerTransferred) {
      options.push({ value: 'both', label: '转移全部Owner', icon: Key });
    }
    
    return options;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Owner转移
        </CardTitle>
        <CardDescription>
          将代币和挖矿合约的控制权转移给项目方
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态显示 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">状态:</span>
          {getStatusDisplay()}
        </div>

        {/* 转移状态详情 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">代币Owner</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {agent.ownerTransferred ? "已转移" : "未转移"}
            </Badge>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Pickaxe className="w-4 h-4" />
              <span className="text-sm font-medium">挖矿合约Owner</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {agent.miningOwnerTransferred ? "已转移" : "未转移"}
            </Badge>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!canTransferOwnership()}
                className="flex-1"
              >
                {agent.ownerTransferred && agent.miningOwnerTransferred ? '已完成转移' : '转移Owner'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  转移Owner控制权
                </DialogTitle>
                <DialogDescription>
                  选择要转移的Owner类型，转移后平台将失去对合约的控制权。
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">转移类型</Label>
                  <Select value={transferType} onValueChange={(value: any) => setTransferType(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="选择转移类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableOptions().map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">📋 转移说明</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Owner将转移给项目创建者地址</li>
                    <li>• 转移后平台无法再控制合约</li>
                    <li>• 此操作标志着项目完全去中心化</li>
                    <li>• 转移操作不可逆转</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleTransferOwnership}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    确认转移
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 说明文字 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• 必须先完成流动性添加和代币销毁</p>
          <p>• 转移后项目方获得完全控制权</p>
          <p>• 此步骤完成项目的完全去中心化</p>
        </div>
      </CardContent>
    </Card>
  );
}
