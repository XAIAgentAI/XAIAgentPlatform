"use client";

import { useParams } from "next/navigation";
import { AgentInfo } from "@/components/agent-detail/AgentInfo";
import { SwapCard } from "@/components/agent-detail/SwapCard";
import { TokenInfoCard } from "@/components/agent-detail/TokenInfoCard";
import { ConversationStarter } from "@/components/agent-detail/ConversationStarter";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主要内容区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent信息卡片 */}
          <AgentInfo agentId={agentId} />
          
          {/* 对话启动器 */}
          <ConversationStarter />
        </div>

        {/* 右侧区域 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Swap卡片 */}
          <SwapCard />
          
          {/* 代币信息卡片 */}
          <TokenInfoCard />
        </div>
      </div>
    </div>
  );
} 