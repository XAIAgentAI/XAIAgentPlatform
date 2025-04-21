"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  if (!socialLinks) return { twitter: [], telegram: [], medium: [], github: [], youtube: [] };

  const links = socialLinks.split(",").map(link => link.trim());
  return {
    twitter: links.filter(link => link.includes("x.com") || link.includes("twitter.com")),
    telegram: links.filter(link => link.includes("t.me")),
    medium: links.filter(link => link.includes("medium.com")),
    github: links.filter(link => link.includes("github.com")),
    youtube: links.filter(link => link.includes("youtube.com") || link.includes("youtu.be")),
  };
};

const AgentListMobile = ({ agents, loading }: AgentListProps) => {
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




  const handleRowClick = (id: number) => {
    router.push(`/${locale}/agent-detail/${id}`)
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="sticky top-16 lg:top-20 z-10 bg-white dark:bg-card border-b border-[#E5E5E5] dark:border-white/10">
        <div className="flex items-center gap-4 p-4">
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 bg-white dark:bg-card py-32">
          <Loading />
        </div>
      ) : (
        <div className="flex-1 divide-y divide-[#E5E5E5] dark:divide-white/10">
          {sortedAgents.map((agent) => {
            const socialLinks = parseSocialLinks(agent.socialLinks);
            return (
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
                        ${agent.symbol}
                      </span>
                      <CustomBadge className="shrink-0">
                        {agent.type}
                      </CustomBadge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('marketCap')}</span>
                    <p className="text-secondary-color text-sm font-medium">
                      {agent.marketCap && !isNaN(parseFloat(agent.marketCap.replace(/[^0-9.-]+/g, "")))
                        ? parseFloat(agent.marketCap.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0
                        })
                        : agent.marketCap}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('24h')}</span>
                    <p className={`text-sm font-medium ${agent.priceChange24h && parseFloat(agent.priceChange24h) !== 0 ? (parseFloat(agent.priceChange24h) > 0 ? "text-green-500" : "text-red-500") : ""}`}>
                      {formatPriceChange(agent.priceChange24h)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('tvl')}</span>
                    <p className="text-secondary-color text-sm font-medium">
                      {agent.price || '$0'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('holdersCount')}</span>
                    <p className="text-secondary-color text-sm font-medium">{agent.holdersCount.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('24hVol')}</span>
                    <p className="text-secondary-color text-sm font-medium">
                      {agent.volume24h && !isNaN(parseFloat(agent.volume24h.replace(/[^0-9.-]+/g, "")))
                        ? parseFloat(agent.volume24h.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0
                        })
                        : agent.volume24h}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('lp')}</span>
                    <p className="text-secondary-color text-sm font-medium">
                      {agent.lp && !isNaN(parseFloat(agent.lp.replace(/[^0-9.-]+/g, "")))
                        ? parseFloat(agent.lp.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0
                        })
                        : '$0'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('status')}</span>
                    <div className="text-secondary-color text-sm font-medium">
                      <CustomBadge variant={STATUS_VARIANT_MAP[agent.status as AgentStatus] || 'default'}>
                        {agent.status}
                      </CustomBadge>
                    </div>
                  </div>
                  {agent.symbol==="STID" && <div className="space-y-1">
                    <span className="text-muted-color text-xs block">{t('chat')}</span>
                    <div className="text-secondary-color text-sm font-medium" onClick={()=>{window.location.href=`/${locale}/chat`}}>
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
                  </div>}
                  {(socialLinks.twitter.length > 0 || socialLinks.telegram.length > 0 || socialLinks.medium.length > 0 || socialLinks.youtube.length > 0) && (
                    <div className="space-y-1 col-span-2">
                      <span className="text-muted-color text-xs block">Social</span>
                      <div className="flex flex-wrap gap-4">
                        {socialLinks.twitter.length > 0 && (
                          <SocialLinks links={socialLinks.twitter.join(", ")} />
                        )}
                        {socialLinks.telegram.length > 0 && (
                          <SocialLinks links={socialLinks.telegram.join(", ")} />
                        )}
                        {socialLinks.medium.length > 0 && (
                          <SocialLinks links={socialLinks.medium.join(", ")} />
                        )}
                        {socialLinks.youtube.length > 0 && (
                          <SocialLinks links={socialLinks.youtube.join(", ")} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AgentListMobile; 