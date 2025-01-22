"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AgentCard from "./AgentCard"
import Image from "next/image"
import { useState } from "react"

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
  }>
}

const AgentList = ({ agents }: AgentListProps) => {
  const [sortField, setSortField] = useState<SortField>("marketCap")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

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

  const getSortIcon = (field: SortField) => {
    return (
      <Image 
        src="/images/triangle.svg" 
        alt="Sort" 
        width={8} 
        height={4} 
        className={`transition-transform ${sortField === field && sortDirection === "asc" ? "rotate-180" : ""}`}
      />
    )
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto bg-white/10 rounded-[15px] p-6">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-white/50 text-xs">Sort by</span>
        <Tabs defaultValue="marketCap" className="w-auto">
          <TabsList className="bg-transparent border border-white/30">
            <TabsTrigger 
              value="marketCap"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Market Cap
            </TabsTrigger>
            <TabsTrigger 
              value="latest"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Latest
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-9 gap-4 px-4 py-2 text-white/80 text-[10px] border-b border-white/30">
            <div className="col-span-3 sticky left-0 bg-[#1a1a1a]">AI Agents</div>
            <div 
              className="flex items-center gap-1 cursor-pointer whitespace-nowrap"
              onClick={() => handleSort("marketCap")}
            >
              Market Cap
              {getSortIcon("marketCap")}
            </div>
            <div className="whitespace-nowrap">24h</div>
            <div 
              className="flex items-center gap-1 cursor-pointer whitespace-nowrap"
              onClick={() => handleSort("tvl")}
            >
              Total Value Locked
              {getSortIcon("tvl")}
            </div>
            <div className="whitespace-nowrap">Holders Count</div>
            <div className="whitespace-nowrap">24h Vol</div>
            <div className="whitespace-nowrap">Status</div>
          </div>

          {/* Content */}
          <div className="divide-y divide-white/10">
            {sortedAgents.map((agent) => (
              <AgentCard key={agent.id} {...agent} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentList 