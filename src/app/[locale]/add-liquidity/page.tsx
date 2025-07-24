'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function AddLiquidityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // 获取URL中的agentId参数
  const agentIdFromUrl = searchParams?.get('agentId') || '';
  
  const [agentId, setAgentId] = useState(agentIdFromUrl);
  const [tokenAddress, setTokenAddress] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [iaoContractAddress, setIaoContractAddress] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);

  // 加载Agent信息
  useEffect(() => {
    if (!agentId || agentId.trim() === '') return;
    
    const fetchAgentInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/agents/${agentId}`);
        if (!response.ok) {
          throw new Error('获取Agent信息失败');
        }
        
        const data = await response.json();
        if (data.code === 0 && data.data) {
          setAgentInfo(data.data);
          setTokenAddress(data.data.tokenAddress || '');
          setTotalSupply(data.data.totalSupply?.toString() || '');
        } else {
          throw new Error(data.message || '获取Agent信息失败');
        }
      } catch (err: any) {
        setError(err.message || '获取Agent信息失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgentInfo();
  }, [agentId]);

  // 检查流动性状态
  useEffect(() => {
    if (!agentId || agentId.trim() === '') return;
    
    const checkLiquidityStatus = async () => {
      try {
        const response = await fetch(`/api/token/distribute-liquidity?agentId=${agentId}`);
        if (!response.ok) {
          return; // 静默失败，可能是API还未实现
        }
        
        const data = await response.json();
        if (data.code === 0 && data.data) {
          setTaskStatus(data.data);
          
          // 如果已经添加过流动性，显示成功信息
          if (data.data.liquidityAdded) {
            setSuccess(`该Agent已经成功添加流动性，池子地址: ${data.data.poolAddress || '未知'}`);
          }
          
          // 如果有正在进行的任务，显示最新任务状态
          if (data.data.tasks && data.data.tasks.length > 0) {
            const latestTask = data.data.tasks[0];
            setTaskId(latestTask.id);
            
            if (latestTask.status === 'COMPLETED') {
              setSuccess(`流动性添加任务已完成，池子地址: ${latestTask.poolAddress || '未知'}`);
            } else if (latestTask.status === 'PROCESSING') {
              setSuccess(`流动性添加任务正在处理中，请稍后刷新查看结果`);
            } else if (latestTask.status === 'FAILED') {
              setError(`流动性添加任务失败: ${latestTask.error || '未知错误'}`);
            }
          }
        }
      } catch (err) {
        // 静默失败
        console.error('检查流动性状态失败:', err);
      }
    };
    
    checkLiquidityStatus();
    
    // 如果有任务ID，定期检查状态
    const intervalId = setInterval(() => {
      if (taskId) {
        checkLiquidityStatus();
      }
    }, 5000); // 每5秒检查一次
    
    return () => clearInterval(intervalId);
  }, [agentId, taskId]);

  // 提交添加流动性请求
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // 验证输入
      if (!agentId || !tokenAddress || !totalSupply) {
        throw new Error('请填写所有必填字段');
      }
      
      // 验证地址格式
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(tokenAddress)) {
        throw new Error('代币地址格式无效');
      }
      
      if (iaoContractAddress && !addressRegex.test(iaoContractAddress)) {
        throw new Error('IAO合约地址格式无效');
      }
      
      // 构建请求数据
      const requestData = {
        agentId,
        tokenAddress,
        totalSupply,
        ...(iaoContractAddress ? { iaoContractAddress } : {})
      };
      
      // 发送请求
      const response = await fetch('/api/token/distribute-liquidity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        setSuccess(data.message || '流动性添加任务已提交');
        setTaskId(data.data.taskId);
      } else {
        throw new Error(data.message || '提交失败');
      }
    } catch (err: any) {
      setError(err.message || '提交失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新状态
  const handleRefresh = () => {
    if (agentId) {
      setTaskId(null); // 重置任务ID以触发重新加载
      setError(null);
      setSuccess(null);
      
      // 重新加载页面
      router.refresh();
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>未登录</AlertTitle>
          <AlertDescription>
            请先登录后再使用此功能
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/')}>
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">添加流动性</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>为Agent添加流动性</CardTitle>
          <CardDescription>
            将代币添加到DBCSwap流动性池中，使用户可以交易您的代币
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>错误</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>成功</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {taskStatus && taskStatus.liquidityAdded && (
            <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>流动性已添加</AlertTitle>
              <AlertDescription>
                该Agent已经成功添加流动性，池子地址: {taskStatus.poolAddress || '未知'}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Agent ID <span className="text-red-500">*</span>
              </label>
              <Input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="输入Agent ID"
                required
                disabled={isLoading || !!taskId}
              />
            </div>
            
            {agentInfo && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p><strong>Agent名称:</strong> {agentInfo.name}</p>
                <p><strong>Agent符号:</strong> {agentInfo.symbol}</p>
                {agentInfo.liquidityAdded && (
                  <p className="text-green-600 font-medium">
                    该Agent已添加流动性
                  </p>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">
                代币地址 <span className="text-red-500">*</span>
              </label>
              <Input
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="输入代币地址 (0x...)"
                required
                disabled={isLoading || !!taskId || !!agentInfo?.tokenAddress}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                总供应量 <span className="text-red-500">*</span>
              </label>
              <Input
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                placeholder="输入代币总供应量"
                required
                disabled={isLoading || !!taskId || !!agentInfo?.totalSupply}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                IAO合约地址 <span className="text-gray-400">(可选)</span>
              </label>
              <Input
                value={iaoContractAddress}
                onChange={(e) => setIaoContractAddress(e.target.value)}
                placeholder="输入IAO合约地址 (0x...)"
                disabled={isLoading || !!taskId}
              />
              <p className="text-xs text-gray-500 mt-1">
                提供IAO合约地址可以获取更准确的价格范围
              </p>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                刷新中
              </>
            ) : '刷新状态'}
          </Button>
          
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !!taskId || !!agentInfo?.liquidityAdded}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中
              </>
            ) : taskId ? '任务已提交' : '添加流动性'}
          </Button>
        </CardFooter>
      </Card>
      
      {taskStatus && taskStatus.tasks && taskStatus.tasks.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>任务历史</CardTitle>
            <CardDescription>
              流动性添加任务的历史记录
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {taskStatus.tasks.map((task: any) => (
                <div key={task.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">任务ID: {task.id}</p>
                      <p className="text-sm text-gray-500">
                        创建时间: {new Date(task.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      {task.status === 'COMPLETED' && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          已完成
                        </span>
                      )}
                      {task.status === 'PROCESSING' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          处理中
                        </span>
                      )}
                      {task.status === 'FAILED' && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          失败
                        </span>
                      )}
                      {task.status === 'PENDING' && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          等待中
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {task.status === 'COMPLETED' && (
                    <div className="mt-3 text-sm">
                      <p><strong>池子地址:</strong> {task.poolAddress || '未知'}</p>
                      <p><strong>交易哈希:</strong> {task.txHash || '未知'}</p>
                      <p><strong>代币数量:</strong> {task.tokenAmount || '未知'}</p>
                      <p><strong>XAA数量:</strong> {task.xaaAmount || '未知'}</p>
                    </div>
                  )}
                  
                  {task.status === 'FAILED' && task.error && (
                    <div className="mt-3">
                      <p className="text-sm text-red-600">错误: {task.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 