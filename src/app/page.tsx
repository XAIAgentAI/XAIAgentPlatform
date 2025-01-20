"use client"

import Navbar from "@/components/Navbar"
import AgentList from "@/components/AgentList"

const mockAgents = [
  {
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
]

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto py-10">
        <AgentList agents={mockAgents} />
      </div>
    </main>
  )
}
