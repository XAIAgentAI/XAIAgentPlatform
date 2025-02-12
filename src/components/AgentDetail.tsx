"use client";

import { AgentInfo } from "@/components/agent-detail/AgentInfo";
import { SwapCard } from "@/components/agent-detail/SwapCard";
import { TokenInfoCard } from "@/components/agent-detail/TokenInfoCard";
import { ConversationStarter } from "@/components/agent-detail/ConversationStarter";
import { IaoPool } from "@/components/agent-detail/IaoPool";
import { useAgentStore } from "@/store/useAgentStore";

interface AgentDetailProps {
  id: string;
}

export function AgentDetail({ id }: AgentDetailProps) {
  const { agents } = useAgentStore();
  const agent = agents.find(agent => agent.id === parseInt(id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧主要内容区域 */}
      <div className="lg:col-span-2 space-y-6 lg:space-y-0">
        {/* 移动端IaoPool */}
        <div className="md:hidden ">
          <IaoPool agent={agent as any} />
        </div>
        {/* Agent信息卡片 */}
        <AgentInfo agentId={id} />

        {/* 对话启动器 */}
        <ConversationStarter agentId={id} />
      </div>

      {/* 右侧区域 */}
      <div className="lg:col-span-1 space-y-6">
        {/* Swap卡片 */}
        {/* <SwapCard /> */}

        {/* pc端IaoPool */}
        <div className="md:block hidden">
          <IaoPool agent={agent as any} />
        </div>

        {/* 代币信息卡片 */}
        {id === "1" && <TokenInfoCard />}
      </div>
    </div>
  );
} 