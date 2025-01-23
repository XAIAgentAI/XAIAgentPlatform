"use client"

import { useEffect, useState } from "react"
import AgentList from "@/components/AgentList"
import { apiClient } from "@/lib/api-client"
import { localAgents } from "@/data/localAgents"

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
      <div className="container mx-auto py-15 flex-1 flex flex-col">
        <div className="text-foreground text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-5 flex-1 flex flex-col">
      <AgentList agents={localAgents} />
    </div>
  )
}
