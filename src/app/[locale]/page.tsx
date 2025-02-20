"use client"

import { useEffect } from "react"
import AgentListDesktop from "@/components/AgentListDesktop"
import AgentListMobile from "@/components/AgentListMobile"
import { useDBCScan } from "@/hooks/useDBCScan"
import { useAgentStore } from "@/store/useAgentStore"
import { useDBCPrice } from "@/hooks/useDBCPrice"
import { useStakeContract } from "@/hooks/useStakeContract"

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
    if (!loading && agents && agents.length > 0) {
      const agentsWithPrices = agents.map(agent => {
        const dbcNum = agent.name === "XAIAgent" ? poolInfo.totalDeposited : 0;
        console.log("xaiagent poolInfo信息", poolInfo);

        const totalSupply = Number(agent.totalSupply?.split(' ')[0].replace(/,/g, '') || 0);
        console.log("totalSupply", agent.totalSupply, totalSupply);
        

        // 确保dbcPrice是数字类型
        const dbcPriceNum = Number(dbcPrice);
        const tokenPrice = (dbcNum * dbcPriceNum) / totalSupply;
        const marketCap = dbcPriceNum * dbcNum;

        console.log(`Agent: ${agent.name || 'Unknown'}`);
        console.log(`池子中DBC个数: ${formatNumber(dbcNum)} DBC`);
        console.log(`DBC单价: $${formatNumber(dbcPriceNum)}`);
        console.log(`计算出的token单价: $${formatNumber(tokenPrice)}`);
        console.log(`计算出的市场总值: $${formatNumber(marketCap)}`);
        console.log('------------------------');

        return {
          ...agent,
          tokenPrice: formatNumber(tokenPrice),
          marketCap: formatNumber(marketCap)
        };
      });


      const newAgents = agents.map(agent => {
        const matchingAgent = agentsWithPrices.find(a => a.id === agent.id);
        if (matchingAgent) {
          return {
            ...agent,
            tvl: `$${matchingAgent.tokenPrice}`,
            marketCap: `$${Number(matchingAgent.marketCap).toFixed(2)}`
          }
        }
        return agent;
      });
      console.log("agentsWithPrices", agentsWithPrices, newAgents);

      setAgents(newAgents);
    }
  }, [poolInfo])

  if (error) {
    console.error('Failed to fetch DBC data:', error)
  }

  console.log("页面的agents", agents);


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
