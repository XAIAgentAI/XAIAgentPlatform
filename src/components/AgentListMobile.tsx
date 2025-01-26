"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { CustomBadge } from "@/components/ui-custom/custom-badge"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui-custom/loading"

type SortField = "marketCap" | "holdersCount" | "tvl" | null
type SortDirection = "asc" | "desc"

interface AgentListProps {
  agents: Array<{
    id: number;
    name: string;
    avatar: string;
    symbol: string;
    type: string;
    marketCap: string;
    change24h: string;
    tvl: string;
    holdersCount: number;
    volume24h: string;
    status: string;
  }>;
  loading?: boolean;
}

const AgentListMobile = ({ agents, loading }: AgentListProps) => {
  const [sortField, setSortField] = useState<SortField>("marketCap")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const router = useRouter()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedAgents = [...agents].sort((a, b) => {
    if (!sortField) return 0

    let aValue: number, bValue: number;

    if (sortField === 'holdersCount') {
      aValue = a[sortField];
      bValue = b[sortField];
    } else {
      aValue = parseFloat(a[sortField].replace(/[^0-9.-]+/g, ""));
      bValue = parseFloat(b[sortField].replace(/[^0-9.-]+/g, ""));
    }

    return sortDirection === "asc"
      ? aValue - bValue
      : bValue - aValue
  })

  const handleRowClick = (id: number) => {
    router.push(`/agent-detail/${id}`)
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="sticky top-16 lg:top-20 z-10 bg-white dark:bg-card border-b border-[#E5E5E5] dark:border-white/10">
        <div className="flex items-center gap-4 p-4">
          <span className="text-muted-color text-xs">Sort by</span>
          <Tabs defaultValue="marketCap" className="w-auto">
            <TabsList className="bg-transparent border border-[#E5E5E5] dark:border-white/30 p-1">
              <TabsTrigger
                value="marketCap"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"
              >
                Market Cap
              </TabsTrigger>
              <TabsTrigger
                value="latest"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"
              >
                Latest
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loading />
        </div>
      ) : (
        <div className="flex-1 divide-y divide-[#E5E5E5] dark:divide-white/10">
          {sortedAgents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 bg-white dark:bg-card cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
              onClick={() => handleRowClick(agent.id)}
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-14 h-14 rounded-full">
                  <img src={agent.avatar} alt={agent.name} className="object-cover" />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-secondary-color text-base font-medium font-['Sora'] truncate">{agent.name}</h3>
                    <span className="text-muted-color text-sm font-normal font-['Sora'] shrink-0">
                      {agent.symbol}
                    </span>
                    <CustomBadge className="shrink-0">
                      {agent.type}
                    </CustomBadge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div className="space-y-1">
                  <span className="text-muted-color text-xs block">Market Cap</span>
                  <p className="text-secondary-color text-sm font-medium">{agent.marketCap}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-color text-xs block">24h Change</span>
                  <p className="text-[#5BFE42] text-sm font-medium">{agent.change24h}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-color text-xs block">TVL</span>
                  <p className="text-secondary-color text-sm font-medium">{agent.tvl}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-color text-xs block">Holders</span>
                  <p className="text-secondary-color text-sm font-medium">{agent.holdersCount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-color text-xs block">24h Volume</span>
                  <p className="text-secondary-color text-sm font-medium">{agent.volume24h}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-color text-xs block">Status</span>
                  <p className="text-secondary-color text-sm font-medium">{agent.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AgentListMobile 