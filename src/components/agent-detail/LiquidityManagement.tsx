'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Droplets, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import type { LocalAgent } from '@/types/agent';

interface LiquidityManagementProps {
  agent: LocalAgent;
  onStatusUpdate?: () => void;
}

interface TaskStatus {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: any;
}

export default function LiquidityManagement({ agent, onStatusUpdate }: LiquidityManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const { toast } = useToast();
  const t = useTranslations('common');

  // 计算流动性数量（10%的总供应量）
  const calculateLiquidityAmount = () => {
    if (!agent.totalSupply) return '0';
    const totalSupply = Number(agent.totalSupply);
    const liquidityAmount = totalSupply * 0.1; // 10%
    return liquidityAmount.toString();
  };

  // 模拟XAA数量计算（实际应该从市场价格计算）
  const calculateXaaAmount = () => {
    // 这里应该根据实际的市场价格来计算对应的XAA数量
    // 暂时使用固定比例作为示例
    const liquidityAmount = calculateLiquidityAmount();
    return (Number(liquidityAmount) * 0.001).toString(); // 示例比例
  };

  // 添加流动性
  const handleAddLiquidity = async () => {
    try {
      setIsLoading(true);

      const liquidityAmount = calculateLiquidityAmount();
      const xaaAmount = calculateXaaAmount();

      const response = await fetch(`/api/agents/${agent.id}/add-liquidity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          liquidityAmount,
          xaaAmount,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        toast({
          title: t('success'),
          description: t('liquidityAdditionSubmitted'),
        });
        
        // 开始轮询任务状态
        setTaskStatus({ id: data.data.taskId, status: 'PENDING' });
        pollTaskStatus(data.data.taskId);
      } else {
        throw new Error(data.message || t('operationFailed'));
      }
    } catch (error: any) {
      console.error('Add liquidity failed:', error);
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
              description: t('liquidityAdditionCompleted'),
            });
            onStatusUpdate?.();
            return;
          } else if (task.status === 'FAILED') {
            toast({
              title: t('error'),
              description: t('liquidityAdditionFailed'),
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
    // if (agent.liquidityAdded) {
    //   return (
    //     <Badge variant="success" className="flex items-center gap-1">
    //       <CheckCircle className="w-3 h-3" />
    //       已添加流动性
    //     </Badge>
    //   );
    // }

    if (taskStatus) {
      switch (taskStatus.status) {
        case 'PENDING':
          return (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              等待中
            </Badge>
          );
        case 'PROCESSING':
          return (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              处理中
            </Badge>
          );
        case 'FAILED':
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {t('failed')}
            </Badge>
          );
        default:
          return null;
      }
    }

    return (
      <Badge variant="secondary">
        {t('notStarted')}
      </Badge>
    );
  };

  // 检查是否可以添加流动性
  const canAddLiquidity = () => {
    // 必须有代币地址且IAO已结束
    if (!agent.tokenAddress) return false;
    
    // 已经添加过流动性
    if (agent.liquidityAdded) return false;
    
    // 正在处理中
    if (taskStatus && ['PENDING', 'PROCESSING'].includes(taskStatus.status)) return false;
    
    // TODO: 检查IAO是否已结束
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="w-5 h-5" />
          {t('liquidityManagement')}
        </CardTitle>
        <CardDescription>
          {t('liquidityManagementDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态显示 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('status')}:</span>
          {getStatusDisplay()}
        </div>

        {/* 流动性信息 */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">{t('tokenAmount')}</div>
            <div className="font-medium">
              {calculateLiquidityAmount()} {agent.symbol}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('percentOfTotalSupply', { percent: '10%' })}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t('xaaAmount')}</div>
            <div className="font-medium">
              {calculateXaaAmount()} XAA
            </div>
            <div className="text-xs text-muted-foreground">
              {t('estimatedValue')}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddLiquidity}
            disabled={!canAddLiquidity() || isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {agent.liquidityAdded ? t('liquidityAdded') : t('addLiquidity')}
          </Button>
        </div>

        {/* 说明文字 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• {t('liquidityWillBeAddedToDBCSwap')}</p>
          <p>• {t('liquidityCannotBeRemoved')}</p>
          <p>• {t('lpTokensWillBeSentToBlackHole')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
