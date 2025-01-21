"use client"

import { useEffect, useState } from "react"
import AgentList from "@/components/AgentList"
import { apiClient } from "@/lib/api-client"

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar: string;
  status: string;
  capabilities: string[];
  rating: number;
  usageCount: number;
  creatorAddress: string;
  reviewCount: number;
  createdAt: string;
}
const mockAgents = [
  {
    id: 1,
    name: "XAIAgent",
    symbol: "CONVO",
    type: "Productivity" as const,
    marketCap: "$96.6m",
    change24h: "+5.64%",
    tvl: "$19m",
    holdersCount: 108080,
    volume24h: "$8.5m",
    inferences: 1225393,
    avatar: "/logo.png"
  },
  {
    id: 2,
    name: "AIAssistant",
    symbol: "AIAS",
    type: "Entertainment" as const,
    marketCap: "$145.2m",
    change24h: "-2.34%",
    tvl: "$28.5m",
    holdersCount: 156420,
    volume24h: "$12.3m",
    inferences: 2458962,
    avatar: "/ai-assistant.png"
  },
  {
    id: 3,
    name: "CreativeAI",
    symbol: "CRAI",
    type: "Entertainment" as const,
    marketCap: "$78.9m",
    change24h: "+8.92%",
    tvl: "$15.6m",
    holdersCount: 89654,
    volume24h: "$6.8m",
    inferences: 986574,
    avatar: "/creative-ai.png"
  },
  {
    id: 4,
    name: "DataAnalyst",
    symbol: "DANA",
    type: "Productivity" as const,
    marketCap: "$234.5m",
    change24h: "+12.45%",
    tvl: "$45.2m",
    holdersCount: 198765,
    volume24h: "$18.9m",
    inferences: 3567891,
    avatar: "/data-analyst.png"
  },
  {
    id: 5,
    name: "CodeMaster",
    symbol: "CODE",
    type: "Productivity" as const,
    marketCap: "$167.8m",
    change24h: "-1.23%",
    tvl: "$32.1m",
    holdersCount: 145632,
    volume24h: "$15.4m",
    inferences: 1789456,
    avatar: "/code-master.png"
  },
  {
    id: 6,
    name: "HealthBot",
    symbol: "HEAL",
    type: "Productivity" as const,
    marketCap: "$89.4m",
    change24h: "+3.78%",
    tvl: "$17.8m",
    holdersCount: 76543,
    volume24h: "$7.2m",
    inferences: 945678,
    avatar: "/health-bot.png"
  },
  {
    id: 7,
    name: "FinanceGPT",
    symbol: "FGPT",
    type: "Entertainment" as const,
    marketCap: "$312.6m",
    change24h: "+15.67%",
    tvl: "$67.9m",
    holdersCount: 256789,
    volume24h: "$25.6m",
    inferences: 4567890,
    avatar: "/finance-gpt.png"
  },
]

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await apiClient.getAgents()
        setAgents(response.items)
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-black">
        <div className="container mx-auto py-10">
          <div className="text-white text-center">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto py-10">
        <AgentList agents={agents} />
      </div>
    </main>
  )
}
