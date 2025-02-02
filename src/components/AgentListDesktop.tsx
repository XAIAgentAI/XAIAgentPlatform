"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { useState } from "react"
import { Avatar } from "@/components/ui/avatar"
import { CustomBadge } from "@/components/ui-custom/custom-badge"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui-custom/loading"
import { Button } from "@/components/ui/button"

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
    socialLinks?: string;
  }>;
  loading?: boolean;
}

const parseSocialLinks = (socialLinks?: string) => {
  if (!socialLinks) return { twitter: "", telegram: "", medium: "", github: "" };
  
  const links = socialLinks.split(",").map(link => link.trim());
  return {
    twitter: links.find(link => link.includes("x.com") || link.includes("twitter.com")) || "",
    telegram: links.find(link => link.includes("t.me")) || "",
    medium: links.find(link => link.includes("medium.com")) || "",
    github: links.find(link => link.includes("github.com")) || "",
  };
};

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

  const handleSocialClick = (e: React.MouseEvent<HTMLButtonElement>, url: string) => {
    e.stopPropagation();
    if (url) {
      window.open(url, "_blank");
    }
  };

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
                <TableHead className="w-[400px]">
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
                  sortedAgents.map((agent) => {
                    const socialLinks = parseSocialLinks(agent.socialLinks);
                    return (
                      <TableRow
                        key={agent.id}
                        className="cursor-pointer hover:bg-[#F8F8F8] dark:hover:bg-[#222222]"
                        onClick={() => handleRowClick(agent.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-[45px] h-[45px] rounded-[100px]">
                              <img src={agent.avatar} alt={agent.name} className="object-cover" />
                            </Avatar>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">{agent.name}</h3>
                                <span className="text-muted-color text-[10px] font-normal font-['Sora'] leading-[10px]">
                                  ${agent.symbol}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CustomBadge>
                                  {agent.type}
                                </CustomBadge>
                                {socialLinks.twitter && (
                                  <button
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-110 hover:-rotate-12"
                                    onClick={(e) => handleSocialClick(e, socialLinks.twitter)}
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-4 h-4 fill-current"
                                    >
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                  </button>
                                )}
                                {socialLinks.telegram && (
                                  <button
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-[#229ED9]/10 hover:text-[#229ED9] transition-all duration-200 hover:scale-110 hover:rotate-12"
                                    onClick={(e) => handleSocialClick(e, socialLinks.telegram)}
                                  >
                                    <svg
                                      viewBox="0 0 25 20"
                                      className="w-4 h-4 fill-current"
                                    >
                                      <path d="M22.8686 0.172433C22.8686 0.172433 25.1814 -0.673005 24.9886 1.38018C24.9243 2.22561 24.3462 5.18457 23.8965 8.38514L22.3547 17.8659C22.3547 17.8659 22.2262 19.2548 21.0698 19.4965C19.9135 19.738 18.179 18.6511 17.8578 18.4094C17.6008 18.2283 13.0398 15.5109 11.4337 14.1823C10.984 13.82 10.4701 13.0953 11.4979 12.2499L18.2433 6.21119C19.0141 5.48654 19.7851 3.7957 16.573 5.84887L7.57924 11.5857C7.57924 11.5857 6.55137 12.1895 4.62416 11.6461L0.448471 10.4383C0.448471 10.4383 -1.09332 9.53252 1.54054 8.62665C7.9647 5.78842 15.8664 2.88984 22.8686 0.172433Z" />
                                    </svg>
                                  </button>
                                )}
                                {socialLinks.medium && (
                                  <button
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-[#02B875]/10 hover:text-[#02B875] transition-all duration-200 hover:scale-110 hover:-rotate-12"
                                    onClick={(e) => handleSocialClick(e, socialLinks.medium)}
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-4 h-4 fill-current"
                                    >
                                      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                                    </svg>
                                  </button>
                                )}
                                {socialLinks.github && (
                                  <button
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-all duration-200 hover:scale-110 hover:-rotate-12"
                                    onClick={(e) => handleSocialClick(e, socialLinks.github)}
                                  >
                                    <svg
                                      viewBox="0 0 24 24"
                                      className="w-4 h-4 fill-current"
                                    >
                                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
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
                    );
                  })
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