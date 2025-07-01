'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LiquidityManagement from '@/components/agent-detail/LiquidityManagement';
import TokenBurnModal from '@/components/agent-detail/TokenBurnModal';
import OwnershipTransferModal from '@/components/agent-detail/OwnershipTransferModal';
import type { LocalAgent } from '@/types/agent';

// 模拟Agent数据
const mockAgent: LocalAgent = {
  id: 'test-agent-1',
  name: 'Test Agent',
  description: 'Test Agent for Owner Management',
  category: 'AI',
  avatar: '',
  status: 'ACTIVE',
  capabilities: '["test"]',
  rating: 5,
  usageCount: 100,
  marketCap: '$1000000',
  change24h: '5.2',
  volume24h: '$50000',
  creatorId: 'test-creator',
  createdAt: new Date(),
  updatedAt: new Date(),
  type: 'AI Agent',
  tvl: '$500000',
  holdersCount: 1000,
  symbol: 'TEST',
  tokenAddress: '0x1234567890123456789012345678901234567890',
  iaoContractAddress: '0x0987654321098765432109876543210987654321',
  totalSupply: 1000000000,
  // Owner管理状态
  ownerTransferred: false,
  liquidityAdded: false,
  tokensBurned: false,
  miningOwnerTransferred: false,
};

export default function TestOwnerManagementPage() {
  const handleStatusUpdate = () => {
    console.log('Status updated');
    // 这里可以重新获取Agent数据
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Owner管理功能测试</CardTitle>
          <CardDescription>
            测试代币Owner管理的完整流程：流动性添加 → 代币销毁 → Owner转移
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">测试Agent信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Agent ID:</span>
                  <span className="ml-2">{mockAgent.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">代币符号:</span>
                  <span className="ml-2">{mockAgent.symbol}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">代币地址:</span>
                  <span className="ml-2 font-mono text-xs">{mockAgent.tokenAddress}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">总供应量:</span>
                  <span className="ml-2">{mockAgent.totalSupply?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2 text-blue-800">当前状态</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${mockAgent.liquidityAdded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>流动性添加: {mockAgent.liquidityAdded ? '已完成' : '未完成'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${mockAgent.tokensBurned ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>代币销毁: {mockAgent.tokensBurned ? '已完成' : '未完成'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${mockAgent.ownerTransferred ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>代币Owner转移: {mockAgent.ownerTransferred ? '已完成' : '未完成'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${mockAgent.miningOwnerTransferred ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>挖矿Owner转移: {mockAgent.miningOwnerTransferred ? '已完成' : '未完成'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 流动性管理 */}
        <LiquidityManagement 
          agent={mockAgent} 
          onStatusUpdate={handleStatusUpdate}
        />

        {/* 代币销毁 */}
        <TokenBurnModal 
          agent={mockAgent} 
          onStatusUpdate={handleStatusUpdate}
        />

        {/* Owner转移 */}
        <OwnershipTransferModal 
          agent={mockAgent} 
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API端点测试</CardTitle>
          <CardDescription>
            可以使用以下API端点进行测试
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">流动性添加</h4>
              <code className="text-sm">POST /api/agents/{mockAgent.id}/add-liquidity</code>
              <pre className="mt-2 text-xs bg-black text-green-400 p-2 rounded">
{JSON.stringify({
  liquidityAmount: "100000000", // 10%的总供应量
  xaaAmount: "1000" // 对应的XAA数量
}, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">代币销毁</h4>
              <code className="text-sm">POST /api/agents/{mockAgent.id}/burn-tokens</code>
              <pre className="mt-2 text-xs bg-black text-green-400 p-2 rounded">
{JSON.stringify({
  burnAmount: "50" // 5%的XAA
}, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Owner转移</h4>
              <code className="text-sm">POST /api/agents/{mockAgent.id}/transfer-ownership</code>
              <pre className="mt-2 text-xs bg-black text-green-400 p-2 rounded">
{JSON.stringify({
  transferType: "both" // "token" | "mining" | "both"
}, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. <strong>流动性添加</strong>: 将10%的代币和对应XAA添加到DBCSwap流动性池</p>
            <p>2. <strong>代币销毁</strong>: 销毁5%的XAA代币，必须先完成流动性添加</p>
            <p>3. <strong>Owner转移</strong>: 将代币和挖矿合约的控制权转移给项目方，必须先完成前两步</p>
            <p>4. 所有操作都是异步的，会创建任务并可以查询状态</p>
            <p>5. 每个步骤完成后会更新Agent的状态字段</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
