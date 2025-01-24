"use client"

import { useEffect, useState } from "react"
import AgentList from "@/components/AgentList"
import { localAgents } from "@/data/localAgents"
import { useDBCScan } from "@/hooks/useDBCScan"

export default function Home() {
  const [agents, setAgents] = useState(localAgents)
  const { tokens, loading, error } = useDBCScan()

  useEffect(() => {
    if (tokens && tokens.length > 0) {
      const updatedAgents = agents.map(agent => {
        const tokenData = tokens.find(token => token.address === agent.tokens)
        if (tokenData) {
          return {
            ...agent,
            holdersCount: parseInt(tokenData.holders)
          }
        }
        return agent
      })
      setAgents(updatedAgents)
    }
  }, [tokens])

  if (loading) {
    return (
      <div className="container mx-auto py-15 flex-1 flex flex-col">
        <div className="text-foreground text-center">Loading...</div>
      </div>
    )
  }

  if (error) {
    console.error('Failed to fetch DBC data:', error)
  }

  return (
    <div className="container mx-auto py-5 flex-1 flex flex-col">
      <AgentList agents={agents} />
    </div>
  )
}
