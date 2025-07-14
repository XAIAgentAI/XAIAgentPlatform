"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Avatar } from "@/components/ui/avatar"
import { CustomBadge } from "@/components/ui-custom/custom-badge"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui-custom/loading"
import { useTranslations, useLocale } from 'next-intl';
import { getStatusVariant, getStatusDisplayText, type AgentListProps } from "@/types/agent"
import { SocialLinks } from "@/components/ui/social-links"
import { StakeNFTsDialog } from "@/components/agent-list/stake-nfts-dialog"
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button"
import { useAccount } from 'wagmi';
import { useStakingNFTContract } from '@/hooks/contracts/useStakingNFTContract';
import { useAppKit } from '@reown/appkit/react'
import { useToast } from '@/components/ui/use-toast'
import { useSearchParams } from "next/navigation"

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
  const tNft = useTranslations('nft');
  const tMessages = useTranslations('messages');
  const [sortField, setSortField] = useState<SortField>("marketCap")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const router = useRouter()
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [totalDailyRewards, setTotalDailyRewards] = useState(0);
  const { address } = useAccount();
  const { getStakeList } = useStakingNFTContract();
  const { open } = useAppKit();
  const { toast } = useToast();

  // 获取当前的状态筛选值
  const currentStatusFilter = searchParams?.get('status') || "TRADABLE";

  const handleSort = (field: SortField) => {
    let newSortDirection = sortDirection;
    
    if (sortField === field) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      newSortDirection = "desc";
    }
    
    setSortField(field);
    setSortDirection(newSortDirection);

    console.log('handleSort', field, newSortDirection);
    
    router.push(`?sortBy=${field}&sortOrder=${newSortDirection}`);
  }

  const sortedAgents = [...agents]

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

  const handleRowClick = (id: string) => {
    router.push(`/${locale}/agent-detail/${id}`)
  }

  const handleStakeClick = () => {
    // if (!address) {
    //   // toast({
    //   //   description: tMessages('connectWallet'),
    //   // });
    //   open({ view: 'Connect' });
    //   return;
    // }
    setStakeDialogOpen(true);
  }

  const fetchStakedInfo = async () => {
    if (!address) return;
    const stakedList = await getStakeList();
    const totalDaily = stakedList.reduce((total: number, item: { dailyReward: number, count: number }) => {
      const count = item.count || 0;
      return total + (item.dailyReward * count);
    }, 0);
    setTotalDailyRewards(totalDaily);
  };

  useEffect(() => {
    fetchStakedInfo();
  }, [address, getStakeList]);

  return (
    <div className="w-full max-w-[1400px] mx-auto rounded-[15px] p-6 bg-white dark:bg-card flex-1 flex flex-col">
      <div className="flex flex-col gap-4 mb-6">
        {/* 第一行：排序 + 筛选 */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 lg:gap-8">

       {/* 状态筛选 */}
       <div className="flex items-center gap-4">
            <span className="text-muted-color text-xs whitespace-nowrap">{t('filterBy')}</span>
            <Tabs defaultValue={currentStatusFilter} className="w-auto" onValueChange={(value) => {
              const currentParams = new URLSearchParams(window.location.search);
              if (value === "") {
                currentParams.delete('status');
              } else {
                currentParams.set('status', value);
              }
              router.push(`?${currentParams.toString()}`);
            }}>
              <TabsList className="bg-transparent border border-[#E5E5E5] dark:border-white/30 p-1 flex-wrap lg:flex-nowrap">
                <TabsTrigger
                  value=""
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background px-2 lg:px-4 py-1 text-xs lg:text-sm whitespace-nowrap"
                >
                  {t('all')}
                </TabsTrigger>
                <TabsTrigger
                  value="IAO_ONGOING"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background px-2 lg:px-4 py-1 text-xs lg:text-sm whitespace-nowrap"
                >
                  {t('iaoOngoing')}
                </TabsTrigger>
                <TabsTrigger
                  value="TRADABLE"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background px-2 lg:px-4 py-1 text-xs lg:text-sm whitespace-nowrap"
                >
                  {t('tradable')}
                </TabsTrigger>
                <TabsTrigger
                  value="IAO_COMING_SOON"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background px-2 lg:px-4 py-1 text-xs lg:text-sm whitespace-nowrap"
                >
                  {t('iaoComingSoon')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 排序选项 */}
          <div className="flex items-center gap-4">
            <span className="text-muted-color text-xs whitespace-nowrap">{t('sortBy')}</span>
            <Tabs defaultValue="marketCap" className="w-auto" onValueChange={(value) => {
              if (value === "marketCap") {
                setSortField("marketCap");
                router.push(`?sortBy=marketCap&sortOrder=desc`);
              } else if (value === "latest") {
                setSortField(null);
                router.push(`?sortBy=createdAt&sortOrder=desc`);
              }
            }}>
              <TabsList className="bg-transparent border border-[#E5E5E5] dark:border-white/30 p-1">
                <TabsTrigger
                  value="marketCap"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background px-3 lg:px-4 py-1 text-xs lg:text-sm"
                >
                  {t('marketCap')}
                </TabsTrigger>
                <TabsTrigger
                  value="latest"
                  className="data-[state=active]:bg-foreground data-[state=active]:text-background px-3 lg:px-4 py-1 text-xs lg:text-sm"
                >
                  {t('latest')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

   
        </div>

        {/* 第二行：质押NFT按钮 */}
        <div className="flex items-center justify-end gap-6">
          {
            address ? (
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-500/5 via-orange-400/10 to-orange-500/5 rounded-xl px-3 py-1 border border-orange-500/10">
                <span className="text-sm text-muted-foreground">{tNft('totalDailyReward')}</span>
                <span className="text-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  {address ? (totalDailyRewards == undefined ? '--' : totalDailyRewards.toLocaleString()) : '--'}
                </span>
                <span className="text-sm text-muted-foreground">{tNft('rewardUnit')}</span>
              </div>
            ) : null
          }
          <GradientBorderButton className="bg-card whitespace-nowrap" onClick={handleStakeClick}>
            {tNft('batchStake')}
          </GradientBorderButton>
        </div>
      </div>

      {stakeDialogOpen && <StakeNFTsDialog
        open={stakeDialogOpen}
        onOpenChange={setStakeDialogOpen}
        onSuccess={fetchStakedInfo}
      />}

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
                <TableHead className="w-[150px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px]">
                    {t('chat')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            {loading ? (
              <TableBody>
                <tr>
                  <td colSpan={9}>
                    <div className="flex items-center justify-center min-h-[400px] w-full">
                      <Loading />
                    </div>
                  </td>
                </tr>
              </TableBody>
            ) : (
              <TableBody>
                {sortedAgents.length > 0 ? (
                  sortedAgents.map((agent) => {
                    const socialLinks = parseSocialLinks(agent.socialLinks);
                    return (
                      <TableRow
                        key={`${agent.id}-${agent.symbol}`}
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
                                {
                                  agent.status === 'PENDING' && (
                                    <CustomBadge variant={getStatusVariant(agent.status)}>
                                      {getStatusDisplayText(agent.status)}
                                    </CustomBadge>
                                  )
                                }
                                <div className="flex  gap-2">
                                  {socialLinks.twitter.length > 0 && (
                                    <SocialLinks links={socialLinks.twitter.join(", ")} />
                                  )}
                                  {socialLinks.telegram.length > 0 && (
                                    <SocialLinks links={socialLinks.telegram.join(", ")} />
                                  )}
                                  {socialLinks.medium.length > 0 && (
                                    <SocialLinks links={socialLinks.medium.join(", ")} />
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
                            {
                              agent.lp !== undefined && !isNaN(Number(agent.lp))
                                ? Number(agent.lp).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    maximumFractionDigits: 0
                                  })
                                : '$0'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px]">
                            <CustomBadge variant={getStatusVariant(agent.status)}>
                              {getStatusDisplayText(agent.status)}
                            </CustomBadge>
                          </div>
                        </TableCell>
                        <TableCell>
                        {(agent.symbol === "STID" || agent.symbol === "SIC" || agent.symbol==="DLC" || agent.symbol==="DGC") && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (agent.symbol === "STID") {
                                window.open(`/${locale}/chat`, '_blank');
                              } else if (agent.symbol === "SIC") {
                                window.open('https://app.superimage.ai', '_blank');
                              } else if (agent.symbol === "DLC") {
                                window.open('https://www.deeplink.cloud/software', '_blank');
                              } else if (agent.symbol === "DGC") {
                                window.open('https://degpt.ai ', '_blank');
                              }
                            }}
                            className="text-secondary-color hover:text-primary-color transition-colors duration-200"
                            aria-label="Open chat"
                          >
                            <div 
                              className={`
                                animate-combined-ani
                                bg-primary
                                mb-[1px]
                                h-[34px] px-[17px] border-none text-white rounded-[10px]
                                text-center text-[14.5px] font-normal font-['Sora'] whitespace-nowrap flex flex-row justify-center items-center
                              `}
                            >
                              <img alt="聊天图标" aria-hidden="true" loading="lazy" width="12" height="12" decoding="async" data-nimg="1" src="/images/chat.svg" className="-ml-1 mr-2 mb-[0.6px]"></img>
                              <span className="text-md mt-[0.6px]">{agent.symbol==="DLC"?"Game":"Chat"}</span>
                            </div>
                          </button>
                        )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Image 
                          src="/logo.png" 
                          alt="No data" 
                          width={50} 
                          height={50} 
                          className="opacity-30" 
                        />
                        <div className="text-muted-color text-sm">
                          {t('noDataAvailable')}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}

export default AgentListDesktop; 