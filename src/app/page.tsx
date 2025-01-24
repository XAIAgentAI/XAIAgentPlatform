"use client"

import { useEffect } from "react"
import AgentList from "@/components/AgentList"
import { useDBCScan } from "@/hooks/useDBCScan"
import { useAgentStore } from "@/store/useAgentStore"

export default function Home() {
  const { tokens, loading, error } = useDBCScan()
  const { agents, updateAgentsWithTokens } = useAgentStore()

  useEffect(() => {
    if (!loading && tokens && tokens.length > 0) {
      updateAgentsWithTokens(tokens)
    }
  }, [tokens, loading, updateAgentsWithTokens])

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
