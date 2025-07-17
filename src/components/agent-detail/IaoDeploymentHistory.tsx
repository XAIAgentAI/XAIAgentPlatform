/**
 * IAO部署历史记录组件
 * 显示当前agent的所有失败IAO部署历史，用于退款领取
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { formatDistance } from 'date-fns';
import { zhCN, enUS, ja, ko } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { useNetwork } from '@/hooks/useNetwork';
import { ethers } from 'ethers';

// IAO合约ABI（简化版，仅包含领取奖励相关函数）
const IAO_ABI = [
  {
    "inputs": [],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

interface IaoDeploymentHistoryProps {
  agentId: string;
  showOnlyFailed?: boolean; // 新增参数：是否只显示失败的IAO
  compact?: boolean; // 新增参数：是否使用紧凑模式显示
}

interface DeploymentRecord {
  id: string;
  startTime: number;
  endTime: number;
  stakedAmount: string;
  status: string;
  completedAt: string;
  hasClaimed: boolean;
  contractAddress: string; // IAO合约地址
}

export const IaoDeploymentHistory = ({ 
  agentId, 
  showOnlyFailed = true, // 默认只显示失败的IAO
  compact = false // 默认使用标准模式
}: IaoDeploymentHistoryProps) => {
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const t = useTranslations('iaoPool.deploymentHistory');
  const locale = useLocale();
  const { ensureCorrectNetwork } = useNetwork();

  // 获取适当的日期格式化区域设置
  const getDateLocale = () => {
    switch (locale) {
      case 'zh': return zhCN;
      case 'ja': return ja;
      case 'ko': return ko;
      default: return enUS;
    }
  };

  // 格式化日期显示
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 加载部署历史记录
  const loadDeploymentHistory = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: t('error'),
          description: t('authRequired'),
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`/api/agents/${agentId}/deployment-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("IAO部署历史", data);
      
      if (data.code === 200 && Array.isArray(data.data)) {
        // 确保每条记录都有contractAddress字段
        let processedData = data.data.map((record: any) => ({
          ...record,
          contractAddress: record.contractAddress || (record.deploymentDetails && record.deploymentDetails.newContractAddress) || ''
        }));
        
        // 如果只显示失败的IAO，过滤数据
        if (showOnlyFailed) {
          processedData = processedData.filter((record: DeploymentRecord) => record.status === 'FAILED');
        }
        
        setDeploymentHistory(processedData);
      } else {
        throw new Error(data.message || t('loadError'));
      }
    } catch (error) {
      console.error('Failed to load deployment history:', error);
      toast({
        title: t('error'),
        description: t('loadError'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理退款领取 - 直接调用智能合约的claimRewards方法
  const handleClaimRefund = async (record: DeploymentRecord) => {
    if (!record.contractAddress) {
      toast({
        title: t('error'),
        description: t('noContractAddress'),
        variant: "destructive"
      });
      return;
    }

    setIsClaiming(prev => ({ ...prev, [record.id]: true }));
    
    try {
      // 确保连接到正确的网络
      const isCorrectNetwork = await ensureCorrectNetwork();
      if (!isCorrectNetwork) {
        toast({
          title: t('error'),
          description: t('wrongNetwork'),
          variant: "destructive"
        });
        setIsClaiming(prev => ({ ...prev, [record.id]: false }));
        return;
      }

      // 获取以太坊提供者和签名者
      if (!window.ethereum) {
        throw new Error(t('noWalletFound'));
      }
      
      // 使用ethers v6的正确语法
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // 创建合约实例
      const iaoContract = new ethers.Contract(record.contractAddress, IAO_ABI, signer);
      
      // 调用合约的claimRewards函数
      const tx = await iaoContract.claimRewards();
      
      // 等待交易确认
      toast({
        title: t('processing'),
        description: t('waitingForConfirmation'),
      });
      
      await tx.wait();
      
      // 交易成功
      toast({
        title: t('success'),
        description: t('claimSuccess')
      });
      
      // 更新记录状态
      setDeploymentHistory(prev => 
        prev.map(item => 
          item.id === record.id 
            ? { ...item, hasClaimed: true } 
            : item
        )
      );
      
    } catch (error: any) {
      console.error('Failed to claim refund:', error);
      toast({
        title: t('error'),
        description: error.message || t('claimError'),
        variant: "destructive"
      });
    } finally {
      setIsClaiming(prev => ({ ...prev, [record.id]: false }));
    }
  };

  // 初始化加载
  useEffect(() => {
    if (agentId) {
      loadDeploymentHistory();
    }
  }, [agentId]);

  // 如果没有历史记录，不显示组件
  if (deploymentHistory.length === 0 && !isLoading) {
    return null;
  }

  // 紧凑模式的UI
  if (compact) {
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold">{t('failedIaoHistory')}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadDeploymentHistory} 
            disabled={isLoading}
            className="h-8 px-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 12a9 9 0 0 0 15 6.7L21 16"></path>
                <path d="M21 22v-6h-6"></path>
              </svg>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="space-y-2">
            {deploymentHistory.map((record) => (
              <div key={record.id} className="p-3 bg-gray-50 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{formatDate(record.startTime)}</div>
                  <div className="text-xs text-gray-500">{parseFloat(record.stakedAmount).toLocaleString()} XAA</div>
                </div>
                <div>
                  {!record.hasClaimed && record.contractAddress ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isClaiming[record.id]}
                      onClick={() => handleClaimRefund(record)}
                      className="w-full sm:w-auto"
                    >
                      {isClaiming[record.id] ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('claiming')}
                        </>
                      ) : t('claimRefund')}
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">{t('refundClaimed')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 标准模式的UI
  return (
    <Card className="p-4 sm:p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold">{showOnlyFailed ? t('failedIaoHistory') : t('title')}</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadDeploymentHistory} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('loading')}
            </>
          ) : t('refresh')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-2 text-left">{t('date')}</th>
                <th className="py-2 px-2 text-right">{t('stakedAmount')}</th>
                <th className="py-2 px-2 text-center">{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {deploymentHistory.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="py-3 px-2">
                    <div>{formatDate(record.startTime)}</div>
                    <div className="text-xs text-gray-500">
                      {formatDistance(
                        new Date(record.completedAt), 
                        new Date(), 
                        { addSuffix: true, locale: getDateLocale() }
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {parseFloat(record.stakedAmount).toLocaleString()} XAA
                  </td>
                  <td className="py-3 px-2 text-center">
                    {!record.hasClaimed && record.contractAddress ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isClaiming[record.id]}
                        onClick={() => handleClaimRefund(record)}
                      >
                        {isClaiming[record.id] ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('claiming')}
                          </>
                        ) : t('claimRefund')}
                      </Button>
                    ) : record.hasClaimed ? (
                      <span className="text-gray-500">{t('refundClaimed')}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}; 