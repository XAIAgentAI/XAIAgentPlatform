"use client"

import { useEffect, useState } from "react"
import AgentListDesktop from "@/components/AgentListDesktop"
import AgentListMobile from "@/components/AgentListMobile"
import { fetchDBCTokens } from "@/hooks/useDBCScan"
import { LocalAgent } from "@/types/agent"
import { agentAPI } from "@/services/api"
import { transformToLocalAgent, updateAgentsWithPrices, updateAgentsWithTokens } from "@/services/agentService"

export default function Home() {
  const [agents, setAgents] = useState<LocalAgent[]>([])
  const [loading, setLoading] = useState(true)



  // 获取代理列表
  const fetchAgentsData = async () => {
    try {
      setLoading(true)
      // 并行获取 agents 和 tokens 数据
      const [response, tokens] = await Promise.all([
        agentAPI.getAllAgents({ pageSize: 30 }),
        fetchDBCTokens()
      ]);

      if (response.code === 200 && response.data?.items) {
        // 转换数据
        let agents = response.data.items.map(transformToLocalAgent);

        // 更新价格信息
        agents = await updateAgentsWithPrices(agents);


        // 更新代币持有者信息
        if (tokens.length > 0) {
          agents = updateAgentsWithTokens(agents, tokens);
        }

        setAgents(agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchAgentsData();
  }, []);

  return (
    <>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 hidden md:block">
        <AgentListDesktop agents={agents} loading={loading} />
      </div>
      <div className="container flex-1 flex flex-col container mx-auto px-4 py-2 md:hidden">
        <AgentListMobile agents={agents} loading={loading} />
      </div>
    </>
  )
}
