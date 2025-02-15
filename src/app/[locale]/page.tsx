"use client"

import { useEffect } from "react"
import AgentListDesktop from "@/components/AgentListDesktop"
import AgentListMobile from "@/components/AgentListMobile"
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
