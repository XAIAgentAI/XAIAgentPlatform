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
