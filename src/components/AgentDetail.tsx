"use client";

import { useState, useEffect } from "react";
import { AgentInfo } from "@/components/agent-detail/AgentInfo";
import { SwapCard } from "@/components/agent-detail/SwapCard";
import { TokenInfoCard } from "@/components/agent-detail/TokenInfoCard";
import ConversationStarter from "@/components/agent-detail/ConversationStarter";
import { IaoPool } from "@/components/agent-detail/IaoPool";
import { agentAPI } from "@/services/api";
import { LocalAgent } from "@/types/agent";
import { StateDisplay } from "@/components/ui-custom/state-display";
import { useTranslations } from 'next-intl';

interface AgentDetailProps {
  id: string;
}

export function AgentDetail({ id }: AgentDetailProps) {
  const [agent, setAgent] = useState<LocalAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('agentDetail');

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setIsLoading(true);
        const res: any = await agentAPI.getAgentById(parseInt(id));
        if(res.code === 200 && res.data){
          setAgent(res.data);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : t('fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [id, t]);

  return (
    <StateDisplay
      isLoading={isLoading}
      error={error}
      isEmpty={!agent}
      emptyMessage={t('agentNotFound')}
    >
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
    </StateDisplay>
  );
} 