"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AgentCard from "./AgentCard"
import Image from "next/image"
import { useState } from "react"

type SortField = "rating" | "usageCount" | null
type SortDirection = "asc" | "desc"

interface AgentListProps {
  agents: Array<{
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
  }>
}

const AgentList = ({ agents }: AgentListProps) => {
  const [sortField, setSortField] = useState<"rating" | "usageCount" | null>("rating")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: "rating" | "usageCount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedAgents = [...agents].sort((a, b) => {
    if (!sortField) return 0
    return sortDirection === "asc" 
      ? a[sortField] - b[sortField] 
      : b[sortField] - a[sortField]
  })

  const getSortIcon = (field: "rating" | "usageCount") => {
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
        <Tabs defaultValue="rating" className="w-auto">
          <TabsList className="bg-transparent border border-white/30">
            <TabsTrigger 
              value="rating"
              className="data-[state=active]:bg-white data-[state=active]:text-black"
            >
              Rating
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

      <div className="grid grid-cols-9 gap-4 px-4 py-2 text-white/80 text-[10px] border-b border-white/30">
        <div className="col-span-2">AI Agents</div>
        <div 
          className="flex items-center gap-1 cursor-pointer whitespace-nowrap"
          onClick={() => handleSort("rating")}
        >
          Rating
          {getSortIcon("rating")}
        </div>
        <div className="whitespace-nowrap">Category</div>
        <div 
          className="flex items-center gap-1 cursor-pointer whitespace-nowrap"
          onClick={() => handleSort("usageCount")}
        >
          Usage Count
          {getSortIcon("usageCount")}
        </div>
        <div className="whitespace-nowrap">Reviews</div>
        <div className="whitespace-nowrap">Status</div>
        <div className="whitespace-nowrap">Creator</div>
        <div></div>
      </div>

      <div className="divide-y divide-white/10">
        {sortedAgents.map((agent) => (
          <AgentCard key={agent.id} {...agent} />
        ))}
      </div>
    </div>
  )
}

export default AgentList 