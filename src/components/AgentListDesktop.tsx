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
import { useTranslations, useLocale } from 'next-intl';
import { AgentStatus, STATUS_VARIANT_MAP, type AgentListProps } from "@/types/agent"
import { formatPriceChange } from '@/lib/utils';
import { SocialLinks } from "@/components/ui/social-links"

type SortField = "marketCap" | "holdersCount" | "tvl" | null
type SortDirection = "asc" | "desc"

const parseSocialLinks = (socialLinks?: string) => {
  if (!socialLinks) return { twitter: [], telegram: [], medium: [], github: [] };

  const links = socialLinks.split(",").map(link => link.trim());
  return {
    twitter: links.filter(link => link.includes("x.com") || link.includes("twitter.com")),
    telegram: links.filter(link => link.includes("t.me")),
    medium: links.filter(link => link.includes("medium.com")),
    github: links.filter(link => link.includes("github.com")),
  };
};

const AgentListDesktop = ({ agents, loading }: AgentListProps) => {
  const t = useTranslations('agentList');
  const [sortField, setSortField] = useState<SortField>("marketCap")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const router = useRouter()
  const locale = useLocale();

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

  // const sortedAgents = [...agents].sort((a, b) => {
  //   if (!sortField) return 0

  //   let aValue: number, bValue: number;

  //   if (sortField === 'holdersCount') {
  //     aValue = a[sortField];
  //     bValue = b[sortField];
  //   } else {
  //     aValue = parseFloat(a[sortField].replace(/[^0-9.-]+/g, ""));
  //     bValue = parseFloat(b[sortField].replace(/[^0-9.-]+/g, ""));
  //   }

  //   return sortDirection === "asc"
  //     ? aValue - bValue
  //     : bValue - aValue
  // })

  const sortedAgents = [...agents]

  console.log("sortedAgents", sortedAgents);
  



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
    router.push(`/${locale}/agent-detail/${id}`)
  }


  return (
    <div className="w-full max-w-[1400px] mx-auto rounded-[15px] p-6 bg-white dark:bg-card flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-muted-color text-xs">{t('sortBy')}</span>
        <Tabs defaultValue="marketCap" className="w-auto">
          <TabsList className="bg-transparent border border-[#E5E5E5] dark:border-white/30 p-1">
            <TabsTrigger
              value="marketCap"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"
            >
              {t('marketCap')}
            </TabsTrigger>
            <TabsTrigger
              value="latest"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-1"
            >
              {t('latest')}
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
                    {t('aiAgents')}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div
                    className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]"
                    onClick={() => handleSort("marketCap")}
                  >
                    {t('marketCap')}
                    {getSortIcon("marketCap")}
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    {t('24h')}
                  </div>
                </TableHead>
                <TableHead className="w-[200px]">
                  <div
                    className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]"
                    onClick={() => handleSort("tvl")}
                  >
                    {t('tvl')}
                    {getSortIcon("tvl")}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div
                    className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]"
                    onClick={() => handleSort("holdersCount")}
                  >
                    {t('holdersCount')}
                    {getSortIcon("holdersCount")}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    {t('24hVol')}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    {t('lp')}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    {t('status')}
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
                {sortedAgents.map((agent) => {
                  const socialLinks = parseSocialLinks(agent.socialLinks);
                  console.log("socialLinks", socialLinks);
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
                              <div className="flex flex-wrap gap-2">
                                {socialLinks.twitter.length > 0 && (
                                  <SocialLinks links={socialLinks.twitter.join(", ")} />
                                )}
                                {socialLinks.telegram.length > 0 && (
                                  <SocialLinks links={socialLinks.telegram.join(", ")} />
                                )}
                                {socialLinks.medium.length > 0 && (
                                  <SocialLinks links={socialLinks.medium.join(", ")} />
                                )}
                                {agent.symbol==="STID" && (
                                  <div className="ml-1 text-secondary-color text-sm font-medium" onClick={()=>{window.location.href=`/${locale}/chat`}}>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="1.5"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      className="relative cursor-pointer transition-transform duration-200 hover:rotate-6"
                                    >
                                      <path d="M19 14a2 2 0 0 1-2 2H7l-3 3v-9a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z"/>
                                      <path d="M8 10h1m2 0h1m2 0h1" stroke-width="1.2"/>
                                      <path d="M8 13h4m2 0h2" stroke-width="1.2"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
                          {agent.marketCap && !isNaN(parseFloat(agent.marketCap.replace(/[^0-9.-]+/g, ""))) 
                            ? parseFloat(agent.marketCap.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0
                              })
                            : agent.marketCap}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm font-normal font-['Sora'] leading-[10px] ${agent.priceChange24h && parseFloat(agent.priceChange24h) !== 0 ? (parseFloat(agent.priceChange24h) > 0 ? "text-green-500" : "text-red-500") : ""}`}>
                          {agent.priceChange24h ? 
                            (parseFloat(agent.priceChange24h) === -0 ? 
                              "+0.00%" : 
                              `${parseFloat(agent.priceChange24h) > 0 ? '+' : ''}${agent.priceChange24h}%`
                            ) : 
                            "0.00%"
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
                          {agent.price || '$0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
                          {agent.holdersCount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
                          {agent.volume24h && !isNaN(parseFloat(agent.volume24h.replace(/[^0-9.-]+/g, "")))
                            ? parseFloat(agent.volume24h.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0
                              })
                            : agent.volume24h}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
                          {agent.lp && !isNaN(parseFloat(agent.lp.replace(/[^0-9.-]+/g, "")))
                            ? parseFloat(agent.lp.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0
                              })
                            : '$0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
                          <CustomBadge variant={STATUS_VARIANT_MAP[agent.status as AgentStatus] || 'default'}>
                            {agent.status}
                          </CustomBadge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}

export default AgentListDesktop; 