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
import { getStatusVariant, getStatusDisplayText, type AgentListProps, AgentColumnField, shouldShowColumn, AgentSortField, STATUS_SORT_OPTIONS_MAP } from "@/types/agent"
import { SocialLinks } from "@/components/ui/social-links"
import { StakeNFTsDialog } from "@/components/agent-list/stake-nfts-dialog"
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button"
import { useAccount } from 'wagmi';
import { useStakingNFTContract } from '@/hooks/contracts/useStakingNFTContract';
import { useAppKit } from '@reown/appkit/react'
import { useToast } from '@/components/ui/use-toast'
import { useSearchParams } from "next/navigation"
import { formatPriceChange } from '@/lib/utils';
import { Countdown } from "@/components/ui-custom/countdown";

// 修改类型定义
type SortField = AgentSortField | null;
type SortDirection = "asc" | "desc";

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


const AgentListDesktop = ({ agents, loading, onStatusFilterChange, currentStatusFilter, searchKeyword }: AgentListProps) => {
  const t = useTranslations('agentList');
  const tNft = useTranslations('nft');
  const tMessages = useTranslations('messages');
  const router = useRouter()
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [totalDailyRewards, setTotalDailyRewards] = useState(0);
  const { address } = useAccount();
  const { getStakeList } = useStakingNFTContract();
  const { open } = useAppKit();
  const { toast } = useToast();
  
  // 获取URL中的排序参数
  const urlSortBy = searchParams.get('sortBy');
  const urlSortOrder = searchParams.get('sortOrder') as "asc" | "desc" | null;
  
  // 使用传入的currentStatusFilter
  const [currentFilter, setCurrentFilter] = useState(currentStatusFilter);

  // 当父组件的currentStatusFilter变化时更新本地状态
  useEffect(() => {
    setCurrentFilter(currentStatusFilter);
  }, [currentStatusFilter]);

  // 获取当前状态下可用的排序选项
  const currentSortOptions = STATUS_SORT_OPTIONS_MAP[currentFilter] || STATUS_SORT_OPTIONS_MAP[''];
  
  // 使用URL参数或默认排序
  const [sortField, setSortField] = useState<AgentSortField>(() => {
    if (urlSortBy && Object.values(AgentSortField).includes(urlSortBy as AgentSortField)) {
      return urlSortBy as AgentSortField;
    }
    return currentSortOptions.default;
  });
  
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => 
    urlSortOrder || "desc"
  );

  // 当筛选状态改变时更新排序
  useEffect(() => {
    const newSortOptions = STATUS_SORT_OPTIONS_MAP[currentFilter] || STATUS_SORT_OPTIONS_MAP[''];
    setSortField(newSortOptions.default);
    setSortDirection("desc");
    // 更新URL
    router.push(`?sortBy=${newSortOptions.default}&sortOrder=desc`);
  }, [currentFilter, router]);

  const handleSort = (field: AgentSortField) => {
    let newSortDirection: "asc" | "desc" = sortDirection;
    
    if (sortField === field) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      newSortDirection = "desc";
    }
    
    setSortField(field);
    setSortDirection(newSortDirection);
    
    router.push(`?sortBy=${field}&sortOrder=${newSortDirection}`);
  }

  const sortedAgents = [...agents]

  const getSortIcon = (field: AgentSortField) => {
    if (sortField !== field) return null;
    
    return (
      <Image
        src="/images/triangle.svg"
        alt={t('accessibility.sortIcon')}
        width={8}
        height={4}
        className={`transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`}
      />
    );
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
      {/* 搜索结果显示 */}
      {searchKeyword && (
        <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm font-medium text-primary">
              {t('searchResults')}: "{searchKeyword}"
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {agents.length > 0 
              ? t('foundResults', { count: agents.length })
              : t('noResultsFound')
            }
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        {/* 第一行：排序 + 筛选 */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 lg:gap-8">

       {/* 状态筛选 */}
       <div className="flex items-center gap-4">
            <span className="text-muted-color text-xs whitespace-nowrap">{t('filterBy')}</span>
            <Tabs value={currentFilter} className="w-auto" onValueChange={(value) => {
              setCurrentFilter(value);
              onStatusFilterChange(value);
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
            <Tabs value={sortField} className="w-auto" onValueChange={(value) => {
              const newSortField = value as AgentSortField;
              setSortField(newSortField);
              setSortDirection("desc");
              router.push(`?sortBy=${newSortField}&sortOrder=desc`);
            }}>
              <TabsList className="bg-transparent border border-[#E5E5E5] dark:border-white/30 p-1">
                {currentSortOptions.options.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="data-[state=active]:bg-foreground data-[state=active]:text-background px-3 lg:px-4 py-1 text-xs lg:text-sm"
                  >
                    {t(option.label)}
                  </TabsTrigger>
                ))}
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

      {/* 表格部分 */}
      <div className="relative flex-1 overflow-x-auto">
        {loading ? (
          <Loading className="min-h-[200px]" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="whitespace-nowrap">
                <TableHead className="w-[300px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                    {t('agentInfo')}
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                    {t('symbol')}
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">
                  <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                    {t('type')}
                  </div>
                </TableHead>
                {shouldShowColumn(currentFilter, AgentColumnField.HOLDERS_COUNT) && (
                  <TableHead className="w-[150px]">
                    <div
                      className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap"
                      onClick={() => handleSort(AgentSortField.HOLDERS_COUNT)}
                    >
                      {t('holdersCount')}
                      {getSortIcon(AgentSortField.HOLDERS_COUNT)}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.INVESTED_XAA) && (
                  <TableHead className="w-[150px]">
                    <div
                      className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap"
                      onClick={() => handleSort(AgentSortField.INVESTED_XAA)}
                    >
                      {t('investedXAA')}
                      {getSortIcon(AgentSortField.INVESTED_XAA)}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.MARKET_CAP) && (
                  <TableHead className="w-[150px]">
                    <div
                      className="flex items-center gap-1 cursor-pointer opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap"
                      onClick={() => handleSort(AgentSortField.MARKET_CAP)}
                    >
                      {t('marketCap')}
                      {getSortIcon(AgentSortField.MARKET_CAP)}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.IAO_END_COUNTDOWN) && (
                  <TableHead className="w-[150px]">
                    <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                      {t('iaoEndCountdown')}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.IAO_START_COUNTDOWN) && (
                  <TableHead className="w-[150px]">
                    <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                      {t('iaoStartCountdown')}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.CHANGE_24H) && (
                  <TableHead className="w-[150px]">
                    <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                      {t('change24h')}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.TOKEN_PRICE) && (
                  <TableHead className="w-[150px]">
                    <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                      {t('tokenPrice')}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.VOLUME_24H) && (
                  <TableHead className="w-[150px]">
                    <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                      {t('volume24h')}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.LIQUIDITY_POOL) && (
                  <TableHead className="w-[150px]">
                    <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                      {t('liquidityPool')}
                    </div>
                  </TableHead>
                )}
                {shouldShowColumn(currentFilter, AgentColumnField.CHAT) && (
                  <TableHead className="w-[150px]">
                    <div className="opacity-80 text-[#222222] dark:text-white text-[10px] font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                      {t('chat')}
                    </div>
                  </TableHead>
                )}
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
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                        onClick={() => handleRowClick(agent.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-[45px] h-[45px] rounded-[100px]">
                              <img src={agent.avatar} alt={t('accessibility.avatarImage')} className="object-cover" />
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
                          <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                            ${agent.symbol}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                            <CustomBadge>
                              {agent.type}
                            </CustomBadge>
                          </div>
                        </TableCell>
                        {shouldShowColumn(currentFilter, AgentColumnField.HOLDERS_COUNT) && (
                          <TableCell>
                            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                              {agent.holdersCount.toLocaleString()}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.INVESTED_XAA) && (
                          <TableCell>
                            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                              {agent.investedXAA ? `${agent.investedXAA.toLocaleString()} XAA` : '0 XAA'}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.MARKET_CAP) && (
                          <TableCell>
                            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                              {agent.marketCap || '-'}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.IAO_END_COUNTDOWN) && (
                          <TableCell>
                            {agent.iaoEndTime ? (
                              <div className="whitespace-nowrap">
                                <Countdown remainingTime={Number(agent.iaoEndTime) * 1000 - Date.now()} mode="compact" alwaysShowMinutes={false} alwaysShowSeconds={false} />
                              </div>
                            ) : (
                              <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">-</div>
                            )}
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.IAO_START_COUNTDOWN) && (
                          <TableCell>
                            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                              {agent.iaoStartTime ? (
                                <div className="whitespace-nowrap">
                                  <Countdown remainingTime={Number(agent.iaoStartTime) * 1000 - Date.now()} mode="compact" alwaysShowMinutes={false} alwaysShowSeconds={false} />
                                </div>
                              ) : '-'}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.CHANGE_24H) && (
                          <TableCell>
                            <div className={`text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap ${agent.change24h && parseFloat(agent.change24h) !== 0 ? (parseFloat(agent.change24h) > 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                              {formatPriceChange(agent.change24h)}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.TOKEN_PRICE) && (
                          <TableCell>
                            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                              {agent.price || '-'}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.VOLUME_24H) && (
                          <TableCell>
                            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                              {agent.volume24h ? parseFloat(agent.volume24h.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0
                              }) : '-'}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.LIQUIDITY_POOL) && (
                          <TableCell>
                            <div className="text-secondary-color text-sm font-normal font-['Sora'] leading-[10px] whitespace-nowrap">
                              {agent.lp ? Number(agent.lp).toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                maximumFractionDigits: 0
                              }) : '-'}
                            </div>
                          </TableCell>
                        )}
                        {shouldShowColumn(currentFilter, AgentColumnField.CHAT) && (
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
                                aria-label={t('accessibility.openChat')}
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
                                  <img 
                                    alt={t('accessibility.chatIcon')} 
                                    aria-hidden="true" 
                                    loading="lazy" 
                                    width="12" 
                                    height="12" 
                                    decoding="async" 
                                    data-nimg="1" 
                                    src="/images/chat.svg" 
                                    className="-ml-1 mr-2 mb-[0.6px]"
                                  />
                                  <span className="text-md mt-[0.6px]">
                                    {agent.symbol === "DLC" ? t('chatButton.game') : t('chatButton.chat')}
                                  </span>
                                </div>
                              </button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Image 
                          src="/logo.png" 
                          alt={t('accessibility.noDataImage')} 
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
        )}
      </div>
    </div>
  );
}

export default AgentListDesktop; 