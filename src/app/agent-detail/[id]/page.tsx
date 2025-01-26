"use client";

import { AgentInfo } from "@/components/agent-detail/AgentInfo";
import { SwapCard } from "@/components/agent-detail/SwapCard";
import { TokenInfoCard } from "@/components/agent-detail/TokenInfoCard";
import { ConversationStarter } from "@/components/agent-detail/ConversationStarter";
import { IaoPool } from "@/components/agent-detail/IaoPool";
import { useAgentStore } from "@/store/useAgentStore";

interface AgentDetailPageProps {
  params: {
    id: string;
  };
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = params;
  const { agents } = useAgentStore();

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主要内容区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent信息卡片 */}
          <AgentInfo agentId={id} />
          
          {/* 对话启动器 */}
          <ConversationStarter agentId={id} />
        </div>

        {/* 右侧区域 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Swap卡片 */}
          {/* <SwapCard /> */}

          {/* IaoPool */}
          <IaoPool />
          
          {/* 代币信息卡片 */}
          {
            id === "1" && (
              <TokenInfoCard />
            )
          }
        </div>
      </div>
    </div>
  )
} 