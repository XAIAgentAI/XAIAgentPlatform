'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Flame, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import type { LocalAgent } from '@/types/agent';

interface TokenBurnModalProps {
  agent: LocalAgent;
  onStatusUpdate?: () => void;
}

interface TaskStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: any;
}

export default function TokenBurnModal({ agent, onStatusUpdate }: TokenBurnModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const { toast } = useToast();
  const t = useTranslations('common');

  // 计算销毁数量（5%的XAA）
  const calculateBurnAmount = () => {
    // 这里应该根据IAO中收集的XAA总量来计算5%
    // 暂时使用示例数值
    const totalXaaCollected = 1000; // 示例：IAO收集了1000 XAA
    const burnAmount = totalXaaCollected * 0.05; // 5%
    return burnAmount.toString();
  };

  // 执行代币销毁
  const handleBurnTokens = async () => {
    try {
      setIsLoading(true);

      const burnAmount = calculateBurnAmount();

      const response = await fetch(`/api/agents/${agent.id}/burn-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          burnAmount,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        toast({
          title: t('success'),
          description: '代币销毁任务已提交',
        });
        
        // 开始轮询任务状态
        setTaskStatus({ id: data.data.taskId, status: 'PENDING' });
        pollTaskStatus(data.data.taskId);
        setIsOpen(false);
      } else {
        throw new Error(data.message || t('operationFailed'));
      }
    } catch (error: any) {
      console.error('Burn tokens failed:', error);
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

        const data = await response.json();
        
        if (data.code === 200) {
          const task = data.data;
          setTaskStatus(task);

          if (task.status === 'COMPLETED') {
            toast({
              title: t('success'),
              description: '代币销毁完成',
            });
            onStatusUpdate?.();
            return;
          } else if (task.status === 'FAILED') {
            toast({
              title: t('error'),
              description: '代币销毁失败',
              variant: 'destructive',
            });
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
    // 暂时注释掉，等Prisma类型更新
    // if (agent.tokensBurned) {
    //   return (
    //     <Badge variant="default" className="flex items-center gap-1">
    //       <CheckCircle className="w-3 h-3" />
    //       已销毁代币
    //     </Badge>
    //   );
    // }

    if (taskStatus) {
      switch (taskStatus.status) {
        case 'PENDING':
          return (
            <Badge variant="warning" className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              等待中
            </Badge>
          );
        case 'PROCESSING':
          return (
            <Badge variant="warning" className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              销毁中
            </Badge>
          );
        case 'FAILED':
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              失败
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

  // 检查是否可以销毁代币
  const canBurnTokens = () => {
    // 必须先添加流动性
    if (!agent.liquidityAdded) return false;
    
    // 已经销毁过代币
    if (agent.tokensBurned) return false;
    
    // 正在处理中
    if (taskStatus && ['PENDING', 'PROCESSING'].includes(taskStatus.status)) return false;
    
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5" />
          代币销毁
        </CardTitle>
        <CardDescription>
          销毁5%的XAA代币，永久减少流通量
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态显示 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">状态:</span>
          {getStatusDisplay()}
        </div>

        {/* 销毁信息 */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">销毁数量</div>
          <div className="font-medium">
            {calculateBurnAmount()} XAA
          </div>
          <div className="text-xs text-muted-foreground">
            IAO收集XAA的5%
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!canBurnTokens()}
                className="flex-1"
              >
                {agent.tokensBurned ? '已销毁代币' : '销毁代币'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  确认销毁代币
                </DialogTitle>
                <DialogDescription>
                  此操作不可逆转，将永久销毁 {calculateBurnAmount()} XAA 代币。
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <h4 className="font-medium text-destructive mb-2">⚠️ 重要提醒</h4>
                  <ul className="text-sm space-y-1 text-destructive">
                    <li>• 销毁的代币将发送到黑洞地址，永远无法恢复</li>
                    <li>• 这将减少XAA的总流通量</li>
                    <li>• 销毁完成后才能转移代币Owner</li>
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
                    variant="destructive"
                    onClick={handleBurnTokens}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    确认销毁
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 说明文字 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• 销毁的代币将发送到黑洞地址 0x...dEaD</p>
          <p>• 销毁操作不可逆转，请谨慎操作</p>
          <p>• 必须先完成流动性添加才能销毁代币</p>
        </div>
      </CardContent>
    </Card>
  );
}
