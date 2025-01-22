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
const localAgents = [
  {
    id: 1,
    name: "XAIAgent",
    avatar: "/logo/XAIAgent.png",
    symbol: "$XAA",
    type: "Platform" as const,
    marketCap: "TBA",
    change24h: "0",
    tvl: "$0",
    holdersCount: 39596,
    volume24h: "$0",
    status: "IAO is about to begin.",
  },
  {
    id: 2,
    name: "SuperImage",
    avatar: "/logo/SuperImage.png",
    symbol: "$SIC",
    type: "Infrastructure" as const,
    marketCap: "TBA",
    change24h: "0",
    tvl: "$0",
    holdersCount: 30233,
    volume24h: "$0",
    status: "TBA",
  },
  {
    id: 3,
    name: "DecentralGPT",
    avatar: "/logo/DecentralGPT.png",
    symbol: "$DGC",
    type: "Infrastructure" as const,
    marketCap: "TBA",
    change24h: "0",
    tvl: "$0",
    holdersCount: 949586,
    volume24h: "$0",
    status: "TBA",
  },
  {
    id: 4,
    name: "XPersonity",
    avatar: "/logo/XPersonity.png",
    symbol: "$XPE",
    type: "AI Agent" as const,
    marketCap: "TBA",
    change24h: "0",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
  },
  {
    id: 5,
    name: "ASIXT",
    avatar: "/logo/ASIXT.png",
    symbol: "$ASIXT",
    type: "AI Agent" as const,
    marketCap: "TBA",
    change24h: "0",
    tvl: "$0",
    holdersCount: 0,
    volume24h: "$0",
    status: "TBA",
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
      <main className="min-h-screen bg-background">
        <div className="container mx-auto py-10">
          <div className="text-white text-center">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-10">
        <AgentList agents={localAgents} />
      </div>
    </main>
  )
}
