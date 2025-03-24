"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar } from "@/components/ui/avatar"
import { CustomBadge } from "@/components/ui-custom/custom-badge"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui-custom/loading"
import { Card } from "@/components/ui/card"
import { SocialLinks } from "@/components/ui/social-links"
import { BatchStakeNFTDialog } from "@/components/agent-list/batch-stake-nft-dialog"
import { Button } from "@/components/ui/button"
import { BuyNFTButton } from "@/components/agent-list/buy-nft-button"
import { useTranslations, useLocale } from 'next-intl';
import { AgentStatus, STATUS_VARIANT_MAP, type AgentListProps } from "@/types/agent"
import { formatPriceChange } from '@/lib/utils';

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
  const router = useRouter()
  const locale = useLocale();
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  
  // NFT数据
  const nftItems = [
    {
      id: 1,
      name: "Starter Node",
      image: "https://cdn-icons-png.flaticon.com/512/8819/8819487.png",
      totalReward: 4000,
      dailyReward: 40,
      iaoExtraPercentage: 3,
      isStaked: false,
      count: 2,
      price: 99
    },
    {
      id: 2,
      name: "Pro Node",
      image: "https://cdn-icons-png.flaticon.com/512/8819/8819543.png",
      totalReward: 8000,
      dailyReward: 80,
      iaoExtraPercentage: 5,
      isStaked: true,
      count: 1,
      price: 199
    },
    {
      id: 3,
      name: "Master Node",
      image: "https://cdn-icons-png.flaticon.com/512/8819/8819347.png",
      totalReward: 10000,
      dailyReward: 100,
      iaoExtraPercentage: 10,
      isStaked: false,
      count: 1,
      price: 299
    }
  ];

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
          
          <div className="ml-auto">
            <Button
              variant="colored"
              onClick={() => setStakeDialogOpen(true)}
              className="px-4 py-2 h-auto text-xs"
            >
              批量质押
            </Button>
          </div>
        </div>
      </div>

      {/* NFT质押汇总卡片 */}
      <div className="px-4 mb-6 mt-4">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">我的NFT</h3>
            <div className="text-xs text-muted-color">总计: 4个</div>
          </div>
          
          <div className="grid grid-cols-1 gap-3 mb-4">
            {nftItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center">
                  <Avatar className={`w-8 h-8 rounded-md mr-3 ${
                    item.id === 1 ? "bg-blue-100" : 
                    item.id === 2 ? "bg-purple-100" : "bg-red-100"
                  }`}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="object-cover" 
                    />
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-color">
                      {item.count > 1 ? `${item.count}个` : "1个"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-3">
                    <div className="text-sm">{item.dailyReward * (item.count || 1)} XAA/天</div>
                    <div className="text-xs text-muted-color">
                      {item.isStaked ? "已质押" : "未质押"}
                    </div>
                  </div>
                  {!item.isStaked && (
                    <BuyNFTButton 
                      nftName={item.name} 
                      price={item.price} 
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div>
              <div className="text-sm">总每日奖励</div>
              <div className="text-lg font-bold text-primary">120 XAA</div>
            </div>
            <Button
              variant="colored"
              onClick={() => setStakeDialogOpen(true)}
              className="px-6 py-2 h-auto"
            >
              批量质押
            </Button>
          </div>
        </Card>
      </div>
      
      <BatchStakeNFTDialog 
        open={stakeDialogOpen}
        onOpenChange={setStakeDialogOpen}
        nftItems={nftItems}
      />

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