"use client";

import { useState, useEffect } from "react";
import { AgentInfo } from "@/components/agent-detail/AgentInfo";
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

// API响应类型
interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export function AgentDetail({ id }: AgentDetailProps) {
  const [agent, setAgent] = useState<LocalAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('agentDetail');

  const fetchAgent = async (showGlobalLoading = true) => {
    try {
      if (showGlobalLoading) {
        setIsLoading(true);
      }
      const res = await agentAPI.getAgentById((id)) as unknown as ApiResponse<LocalAgent>;

      console.log("fetchAgent res", res);
      const agent = await agentAPI.getAgentById((id));
      if (res.code === 200 && res.data) {
        console.log("res.data1", res.data);

        setAgent(res.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchError'));
    } finally {
      if (showGlobalLoading) {
        setIsLoading(false);
      }
    }
  };

  // 刷新代理数据（不显示全局加载）
  const refreshAgent = async () => {
    await fetchAgent(false);
  };

  useEffect(() => {
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
            {agent && <IaoPool agent={agent} onRefreshAgent={refreshAgent} />}
          </div>
          {/* Agent信息卡片 */}
          <AgentInfo agent={agent as any} currentPrice={0} />

          {/* 对话启动器 */}
          {agent && <ConversationStarter agent={agent} />}
        </div>

        {/* 右侧区域 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Swap卡片 */}
          {/* <SwapCard /> */}

          {/* pc端IaoPool */}
          <div className="md:block hidden">
            {agent && <IaoPool agent={agent} onRefreshAgent={refreshAgent} />}
          </div>

          {/* 代币信息卡片 */}
          {agent && <TokenInfoCard projectDescription={agent.projectDescription} />}
        </div>
      </div>
    </StateDisplay>
  );
} 