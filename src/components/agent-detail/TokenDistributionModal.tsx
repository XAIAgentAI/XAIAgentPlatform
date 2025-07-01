'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { LocalAgent } from '@/types/agent';

interface TokenDistributionModalProps {
  agent: LocalAgent;
  onStatusUpdate?: () => void;
}

interface DistributionTransaction {
  type: string;
  amount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  toAddress: string;
  error?: string;
  percentage?: number;
  description?: string;
}

interface DistributionResult {
  code: number;
  message: string;
  data?: {
    transactions: DistributionTransaction[];
    totalDistributed: string;
    currentStep?: number;
    totalSteps?: number;
    stepName?: string;
  };
}

export const TokenDistributionModal = ({ agent, onStatusUpdate }: TokenDistributionModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);
  const { toast } = useToast();

  // 获取分发步骤状态
  const getDistributionStepStatus = (step: string) => {
    // 从distributionResult中获取对应步骤的状态
    const transaction = distributionResult?.data?.transactions?.find(tx =>
      tx.type.toLowerCase().includes(step) ||
      (step === 'creator' && tx.type.includes('创建者')) ||
      (step === 'airdrop' && tx.type.includes('空投')) ||
      (step === 'mining' && tx.type.includes('挖矿')) ||
      (step === 'liquidity' && tx.type.includes('流动性')) ||
      (step === 'burn' && tx.type.includes('销毁'))
    );

    if (transaction) {
      return {
        completed: transaction.status === 'confirmed',
        inProgress: transaction.status === 'pending',
        failed: transaction.status === 'failed',
        text: transaction.status === 'confirmed' ? '已完成' :
              transaction.status === 'pending' ? '处理中' :
              transaction.status === 'failed' ? '失败' : '等待中'
      };
    }

    // 如果没有找到交易记录，根据agent状态判断
    if (step === 'creator' || step === 'airdrop' || step === 'mining') {
      return {
        completed: !!agent.tokensDistributed,
        inProgress: isDistributing,
        failed: false,
        text: agent.tokensDistributed ? '已完成' : isDistributing ? '处理中' : '等待中'
      };
    }

    if (step === 'liquidity') {
      return {
        completed: !!agent.liquidityAdded,
        inProgress: false,
        failed: false,
        text: agent.liquidityAdded ? '已完成' : '等待中'
      };
    }

    if (step === 'burn') {
      return {
        completed: !!agent.tokensBurned,
        inProgress: false,
        failed: false,
        text: agent.tokensBurned ? '已完成' : '等待中'
      };
    }

    return {
      completed: false,
      inProgress: false,
      failed: false,
      text: '等待中'
    };
  };



  // 分发比例配置
  const DISTRIBUTION_RATIOS = {
    CREATOR: 33,    // 33%
    IAO: 15,        // 15%
    LIQUIDITY: 10,  // 10% (自动添加到DBCSwap)
    AIRDROP: 2,     // 2%
    MINING: 40      // 40%
  };

  const handleDistribute = async () => {
    if (!agent.tokenAddress || !agent.totalSupply) {
      toast({
        title: '错误',
        description: '代币地址或总供应量未设置',
        variant: 'destructive',
      });
      return;
    }

    setIsDistributing(true);
    setDistributionResult(null);

    try {
      console.log('🚀 开始代币分发请求...');

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: '错误',
          description: '请先连接钱包并完成认证',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/token/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentId: agent.id,
          totalSupply: agent.totalSupply.toString(), // 发送原始数值，后端会处理 Wei 转换
          tokenAddress: agent.tokenAddress,
        }),
      });

      const result = await response.json();
      console.log('📝 分发结果:', result);
      
      setDistributionResult(result);

      if (result.code === 200) {
        toast({
          title: '代币分发成功',
          description: `已成功分发 ${result.data?.totalDistributed || '未知'} 代币`,
        });
        onStatusUpdate?.();
      } else {
        toast({
          title: '代币分发失败',
          description: result.message || '未知错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ 代币分发错误:', error);
      toast({
        title: '代币分发失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsDistributing(false);
    }
  };

  const formatNumber = (value: string | number): string => {
    if (!value || value === '0') return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    });
  };

  const calculateAmount = (percentage: number): string => {
    if (!agent.totalSupply) return '0';
    const total = agent.totalSupply;
    return formatNumber((total * percentage / 100).toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={!agent.tokenAddress || !agent.totalSupply}
        >
          代币分发
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>代币分发</DialogTitle>
          <DialogDescription>
            将代币按照预设比例分发给各个地址
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-2">
            <h4 className="font-medium">基本信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Agent名称:</span>
                <span className="ml-2 font-medium">{agent.name}</span>
              </div>
              <div>
                <span className="text-gray-600">代币符号:</span>
                <span className="ml-2 font-medium">{agent.symbol}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">代币地址:</span>
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded break-all">
                  {agent.tokenAddress}
                </code>
              </div>
              <div>
                <span className="text-gray-600">总供应量:</span>
                <span className="ml-2 font-medium">{formatNumber(agent.totalSupply || 0)}</span>
              </div>
            </div>
          </div>

          {/* 分发计划和进度 */}
          <div className="space-y-2">
            <h4 className="font-medium">分发计划和进度</h4>
            <div className="space-y-2 text-sm">
              {/* 创建者分发 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('creator').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('creator').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('creator').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span>👤 创建者 ({DISTRIBUTION_RATIOS.CREATOR}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('creator').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('creator').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('creator').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('creator').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.CREATOR)}</span>
              </div>

              {/* IAO合约分发 */}
              <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-2">
                  <span>🏦 IAO合约 ({DISTRIBUTION_RATIOS.IAO}%)</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    已自动完成
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.IAO)}</span>
              </div>

              {/* 空投分发 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('airdrop').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('airdrop').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('airdrop').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span>🎁 空投钱包 ({DISTRIBUTION_RATIOS.AIRDROP}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('airdrop').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('airdrop').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('airdrop').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('airdrop').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.AIRDROP)}</span>
              </div>

              {/* AI挖矿分发 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('mining').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('mining').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('mining').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span>⛏️ AI挖矿合约 ({DISTRIBUTION_RATIOS.MINING}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('mining').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('mining').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('mining').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('mining').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.MINING)}</span>
              </div>

              {/* 流动性添加 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('liquidity').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('liquidity').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('liquidity').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span>💧 流动性 ({DISTRIBUTION_RATIOS.LIQUIDITY}%)</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('liquidity').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('liquidity').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('liquidity').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('liquidity').text}
                  </span>
                </div>
                <span className="font-medium">{calculateAmount(DISTRIBUTION_RATIOS.LIQUIDITY)}</span>
              </div>

              {/* 代币销毁 */}
              <div className={`flex justify-between items-center p-2 rounded border ${
                getDistributionStepStatus('burn').completed ? 'bg-green-50 border-green-200' :
                getDistributionStepStatus('burn').inProgress ? 'bg-blue-50 border-blue-200' :
                getDistributionStepStatus('burn').failed ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span>🔥 销毁代币</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    getDistributionStepStatus('burn').completed ? 'bg-green-100 text-green-800' :
                    getDistributionStepStatus('burn').inProgress ? 'bg-blue-100 text-blue-800' :
                    getDistributionStepStatus('burn').failed ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getDistributionStepStatus('burn').text}
                  </span>
                </div>
                <span className="font-medium text-gray-500">创建者代币</span>
              </div>
            </div>
          </div>

          {/* 分发进度和结果 */}
          {(isDistributing || distributionResult) && (
            <div className="space-y-4">
              <h4 className="font-medium">分发状态</h4>

              {/* 分发进度指示器 */}
              {isDistributing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-blue-600">正在分发代币...</span>
                  </div>

                  {distributionResult?.data?.currentStep && distributionResult?.data?.totalSteps && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>进度</span>
                        <span>{distributionResult.data.currentStep} / {distributionResult.data.totalSteps}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(distributionResult.data.currentStep / distributionResult.data.totalSteps) * 100}%`
                          }}
                        ></div>
                      </div>
                      {distributionResult.data.stepName && (
                        <div className="text-xs text-gray-600">
                          当前步骤: {distributionResult.data.stepName}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 分发结果 */}
              {distributionResult && (
                <div className={`p-4 rounded-lg ${distributionResult.code === 200 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-lg ${distributionResult.code === 200 ? 'text-green-600' : 'text-red-600'}`}>
                      {distributionResult.code === 200 ? '✅' : '❌'}
                    </span>
                    <span className="font-medium">{distributionResult.message}</span>
                  </div>

                  {distributionResult.data?.transactions && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">分发详情:</div>
                      {distributionResult.data.transactions.map((tx, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{tx.type}</span>
                                {tx.percentage && (
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {tx.percentage}%
                                  </span>
                                )}
                              </div>
                              {tx.description && (
                                <div className="text-xs text-gray-600 mb-2">{tx.description}</div>
                              )}
                              <div className="text-xs text-gray-600">
                                数量: {formatNumber(tx.amount)}
                              </div>
                              <div className="text-xs text-gray-600 break-all">
                                地址: {tx.toAddress}
                              </div>
                              <div className="text-xs text-gray-600 break-all">
                                Hash: {tx.txHash}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                              tx.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tx.status === 'confirmed' ? '已确认' :
                               tx.status === 'failed' ? '失败' : '处理中'}
                            </span>
                          </div>
                          {tx.error && (
                            <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
                              ❌ {tx.error}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* 分发汇总 */}
                      {distributionResult.data.totalDistributed && (
                        <div className="border-t pt-3 mt-3">
                          <div className="text-sm font-medium text-gray-700">
                            总分发量: {formatNumber(distributionResult.data.totalDistributed)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            关闭
          </Button>
          <Button
            onClick={handleDistribute}
            disabled={isDistributing || !agent.tokenAddress || !agent.totalSupply}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isDistributing ? '分发中...' : '开始分发'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
