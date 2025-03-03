"use client"

import { useEffect } from "react"
import AgentListDesktop from "@/components/AgentListDesktop"
import AgentListMobile from "@/components/AgentListMobile"
import { useDBCScan } from "@/hooks/useDBCScan"
import { useAgentStore } from "@/store/useAgentStore"
import { useDBCPrice } from "@/hooks/useDBCPrice"
import { useStakeContract } from "@/hooks/useStakeContract"
import { LocalAgent } from "@/types/agent"
import { agentAPI } from "@/services/api"

export default function Home() {
  const { tokens, loading, error } = useDBCScan()
  const { agents, updateAgentsWithTokens, setAgents } = useAgentStore()
  const { price: dbcPrice } = useDBCPrice()

  const {
    poolInfo,
    isLoading: isStakeLoading,
    isPoolInfoLoading,
    isUserStakeInfoLoading,
    stake,
    claimRewards,
    getUserStakeInfo
  } = useStakeContract();

  const formatNumber = (num: string | number | undefined, decimals: number = 6): string => {
    // 确保转换为数字类型
    const numValue = Number(num);

    // 检查是否为有效数字
    if (isNaN(numValue) || !isFinite(numValue)) return '0';
    if (numValue === 0) return '0';
    if (numValue < 0.000001) return numValue.toExponential(decimals);
    return numValue.toFixed(decimals).replace(/\.?0+$/, '');
  };

  useEffect(() => {
    updateAgentsWithTokens(tokens)
  }, [tokens, loading, updateAgentsWithTokens, dbcPrice,])

  useEffect(() => {
    // 请求接口获取所有的agents
    const fetchAgentsData = async () => {
      try {
        const response = await agentAPI.getAllAgents({ pageSize: 30 });
        console.log('data', response);
        if (response.code === 200 && response.data?.items) {
          const updatedAgents = response.data.items.map((item: any) => {
            // 转换数据格式以匹配组件期望的类型
            return {
              id: parseInt(item.id),
              name: item.name,
              description: item.description,
              longDescription: item.longDescription || item.description,
              category: item.category,
              avatar: item.avatar || '/images/default-avatar.png', // 提供默认头像
              status: item.status,
              capabilities: Array.isArray(item.capabilities) ? item.capabilities : [],
              rating: item.rating || 0,
              usageCount: item.usageCount || 0,
              marketCap: item.marketCap || "$0",
              change24h: item.change24h || "0%",
              volume24h: item.volume24h || "$0",
              creatorId: item.creatorAddress,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.createdAt),
              symbol: item.symbol || '',
              type: item.type || item.category || 'Unknown',
              tvl: item.tvl || "$0",
              holdersCount: item.holdersCount || 0,
              socialLinks: item.socialLinks || '',
              token: item.token || item.symbol || item.id,
            };
          });
          
          console.log('updatedAgents', updatedAgents);
          setAgents(updatedAgents);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };

    fetchAgentsData();


  }, [])

  if (error) {
    console.error('Failed to fetch DBC data:', error)
  }



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
