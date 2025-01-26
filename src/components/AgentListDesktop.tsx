"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

const AgentListDesktop = ({ agents, loading }: AgentListProps) => {
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

  const handleRowClick = (id: number) => {
    router.push(`/agent-detail/${id}`)
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto rounded-[15px] p-6 bg-white dark:bg-card flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-6">
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

      <div className="overflow-x-auto hide-scrollbar">
        <div className="min-w-[1000px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    AI Agents
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div
                    className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]"
                    onClick={() => handleSort("marketCap")}
                  >
                    Market Cap
                    {getSortIcon("marketCap")}
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    24h
                  </div>
                </TableHead>
                <TableHead className="w-[200px]">
                  <div
                    className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]"
                    onClick={() => handleSort("tvl")}
                  >
                    Total Value Locked
                    {getSortIcon("tvl")}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div
                    className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]"
                    onClick={() => handleSort("holdersCount")}
                  >
                    Holders Count
                    {getSortIcon("holdersCount")}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    24h Vol
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    Status
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            {loading ? (
              <TableBody>
                <tr>
                  <td colSpan={7}>
                    <div className="flex items-center justify-center min-h-[400px]">
                      <Loading />
                    </div>
                  </td>
                </tr>
              </TableBody>
            ) : (
              <TableBody>
                {
                  sortedAgents.map((agent) => (
                    <TableRow
                      key={agent.id}
                      className="cursor-pointer hover:bg-[#F8F8F8] dark:hover:bg-[#222222]"
                      onClick={() => handleRowClick(agent.id)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-[60px] h-[60px] rounded-[100px]">
                            <img src={agent.avatar} alt={agent.name} className="object-cover" />
                          </Avatar>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">{agent.name}</h3>
                              <span className="text-muted-color text-[10px] font-normal font-['Sora'] leading-[10px]">
                                {agent.symbol}
                              </span>
                            </div>
                            <CustomBadge>
                              {agent.type}
                            </CustomBadge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-secondary-color text-sm font-normal font-['Sora']">
                        {agent.marketCap}
                      </TableCell>
                      <TableCell className="text-[#5BFE42] text-sm font-normal font-['Sora']">
                        {agent.change24h}
                      </TableCell>
                      <TableCell className="text-secondary-color text-sm font-normal font-['Sora']">
                        {agent.tvl}
                      </TableCell>
                      <TableCell className="text-secondary-color text-sm font-normal font-['Sora']">
                        {agent.holdersCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-secondary-color text-sm font-normal font-['Sora']">
                        {agent.volume24h}
                      </TableCell>
                      <TableCell className="text-secondary-color text-sm font-normal font-['Sora']">
                        {agent.status}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            )}
          </Table>
        </div>
      </div>
    </div>
  )
}

export default AgentListDesktop 