"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { CustomBadge } from "@/components/ui-custom/custom-badge"
import { useRouter } from "next/navigation"
import { Loading } from "@/components/ui-custom/loading"
import { SocialLinks } from "@/components/ui/social-links"
import { StakeNFTsDialog } from "@/components/agent-list/stake-nfts-dialog"
import { useTranslations, useLocale } from 'next-intl';
import { getStatusVariant, getStatusDisplayText, type AgentListProps, AgentColumnField, shouldShowColumn, AgentSortField, STATUS_SORT_OPTIONS_MAP } from "@/types/agent"
import { formatPriceChange } from '@/lib/utils';
import { GradientBorderButton } from "@/components/ui-custom/gradient-border-button"
import { useSearchParams } from "next/navigation"
import { useAccount } from 'wagmi';
import { useStakingNFTContract } from '@/hooks/contracts/useStakingNFTContract';
import { useAppKit } from '@reown/appkit/react'
import { useToast } from '@/components/ui/use-toast'
import { Countdown } from "@/components/ui-custom/countdown";

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

const AgentListMobile = ({ agents, loading, onStatusFilterChange, currentStatusFilter, searchKeyword }: AgentListProps) => {
  const t = useTranslations('agentList');
  const tNft = useTranslations('nft');
  const tMessages = useTranslations('messages');
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [totalDailyRewards, setTotalDailyRewards] = useState(0);
  const { address, isConnected } = useAccount();
  const { getStakeList } = useStakingNFTContract();
  const { open } = useAppKit();
  const { toast } = useToast();

  // 获取URL中的排序参数
  const urlSortBy = searchParams.get('sortBy');
  const urlSortOrder = searchParams.get('sortOrder') as "asc" | "desc" | null;
  
  // 使用传入的currentStatusFilter，空字符串转换为"ALL"
  const [currentFilter, setCurrentFilter] = useState<string>(currentStatusFilter || "ALL");
  
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

  // 当父组件的currentStatusFilter变化时更新本地状态
  useEffect(() => {
    setCurrentFilter(currentStatusFilter || "ALL");
  }, [currentStatusFilter]);

  const fetchStakedInfo = async () => {
    if (!address) return;
    console.log("mobile-fetchStakedInfo - address", address);

    const stakedList = await getStakeList();
    const totalDaily = stakedList.reduce((total: number, item: { dailyReward: number, count: number }) => {
      const count = item.count || 0;
      return total + (item.dailyReward * count);
    }, 0);

    console.log('stakedList', stakedList, totalDaily);
    setTotalDailyRewards(totalDaily);
  };

  useEffect(() => {
    if (address) {
      fetchStakedInfo();
    }
  }, [address, getStakeList]);

  const sortedAgents = [...agents]
  console.log("sortedAgents", sortedAgents);

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

  const handleChatClick = (agent:String) => {
    
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* 搜索结果显示 */}
      {searchKeyword && (
        <div className="p-4 bg-primary/5 border-b border-primary/20">
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

      <div className="sticky top-16 lg:top-20 z-10 bg-white dark:bg-gray-900 border-b border-[#E5E5E5] dark:border-white/10">
        <div className="flex flex-col p-4 gap-3">
          {/* 第一行：状态筛选 */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-muted-color text-xs whitespace-nowrap">{t('filterBy')} &nbsp;&nbsp;&nbsp;&nbsp; </span>
            <div className="flex-1">
              <Select
                value={currentFilter}
                onValueChange={(value) => {
                  setCurrentFilter(value);
                  // 将 "ALL" 转换为空字符串传递给父组件
                  const filterValue = value === "ALL" ? "" : value;
                  onStatusFilterChange(filterValue);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-xs bg-white dark:bg-gray-800">
                  <SelectValue placeholder={t('filterBy')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="ALL">{t('all')}</SelectItem>
                  <SelectItem value="IAO_ONGOING">{t('iaoOngoing')}</SelectItem>
                  <SelectItem value="TRADABLE">{t('tradable')}</SelectItem>
                  <SelectItem value="IAO_COMING_SOON">{t('iaoComingSoon')}</SelectItem>
                  <SelectItem value="FAILED">{t('iaoFailed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 第二行：排序 + 质押NFT按钮 */}
          <div className="flex items-center justify-between w-full gap-4">
            {/* 排序选项 */}
            <div className="flex items-center gap-2">
              <span className="text-muted-color text-xs whitespace-nowrap">{t('sortBy')}</span>
              <Tabs value={sortField} className="w-auto" onValueChange={(value) => {
                const newSortField = value as AgentSortField;
                setSortField(newSortField);
                setSortDirection("desc");
                router.push(`?sortBy=${newSortField}&sortOrder=desc`);
              }}>
                <TabsList className="bg-white dark:bg-gray-800 border border-[#E5E5E5] dark:border-white/30 p-1">
                  {currentSortOptions.options.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className="data-[state=active]:bg-foreground data-[state=active]:text-background px-3 py-1 text-xs"
                    >
                      {t(option.label)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* 质押NFT按钮 */}
            <GradientBorderButton
              onClick={handleStakeClick}
              className="text-xs whitespace-nowrap"
            >
              {tNft('batchStake')}
            </GradientBorderButton>
          </div>

          {/* 奖励信息（如果有地址的话） */}
          {address && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{tNft('totalDailyReward')}</span>
              <span className="text-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                {address ? (totalDailyRewards !== undefined ? totalDailyRewards.toLocaleString() : '--') : '--'}
              </span>
              <span className="text-sm text-muted-foreground">{tNft('rewardUnit')}</span>
            </div>
          )}
        </div>
      </div>

      {/* NFT质押汇总卡片 */}
      {/* <div className="px-4 mb-6 mt-4">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">我的NFT</h3>
              <CustomBadge variant="default" className="text-[10px] py-px px-1.5">
                4个
              </CustomBadge>
            </div>
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
            <GradientBorderButton
              onClick={() => setStakeDialogOpen(true)}
            >
              批量质押
            </GradientBorderButton>
          </div>
        </Card>
      </div> */}

      {stakeDialogOpen && <StakeNFTsDialog
        open={stakeDialogOpen}
        onOpenChange={setStakeDialogOpen}
        onSuccess={fetchStakedInfo}
      />}
      {loading ? (
        <div className="flex items-center justify-center flex-1 bg-white dark:bg-gray-900 py-32">
          <Loading />
        </div>
      ) : (
        <div className="flex-1 divide-y divide-[#E5E5E5] dark:divide-white/10">
          {sortedAgents.length > 0 ? (
            sortedAgents.map((agent) => {
              const socialLinks = parseSocialLinks(agent.socialLinks);
              
              return (
                <div
                  key={`${agent.id}-${agent.symbol}`}
                  className="p-4 bg-white dark:bg-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleRowClick(agent.id)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-14 h-14 rounded-full">
                      <img src={agent.avatar} alt={t('accessibility.avatarImage')} className="object-cover" />
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
                    {shouldShowColumn(currentFilter, AgentColumnField.INVESTED_XAA) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('investedXAA')}</span>
                        <p className="text-secondary-color text-sm font-medium">
                          {agent.investedXAA ? `${agent.investedXAA.toLocaleString()} XAA` : '0 XAA'}
                        </p>
                      </div>
                    )}
                    
                    {shouldShowColumn(currentFilter, AgentColumnField.HOLDERS_COUNT) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('holdersCount')}</span>
                        <p className="text-secondary-color text-sm font-medium">{agent.holdersCount.toLocaleString()}</p>
                      </div>
                    )}
                    
                    {shouldShowColumn(currentFilter, AgentColumnField.IAO_END_COUNTDOWN) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('iaoEndCountdown')}</span>
                        <p className="text-secondary-color text-sm font-medium">
                          {agent.iaoEndTime && Number(agent.iaoEndTime) > 0 ? (
                            <div className="whitespace-nowrap">
                              <Countdown remainingTime={Number(agent.iaoEndTime) * 1000 - Date.now()} mode="compact" alwaysShowMinutes={false} alwaysShowSeconds={false} />
                            </div>
                          ) : (
                            "-"
                          )}
                        </p>
                      </div>
                    )}

                    {shouldShowColumn(currentFilter, AgentColumnField.IAO_START_COUNTDOWN) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('iaoStartCountdown')}</span>
                        <p className="text-secondary-color text-sm font-medium">
                          {agent.iaoStartTime ? (
                            <div className="countdown">
                              {agent.iaoStartCountdown}
                            </div>
                          ) : '-'}
                        </p>
                      </div>
                    )}

                    {shouldShowColumn(currentFilter, AgentColumnField.MARKET_CAP) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('marketCap')}</span>
                        <p className="text-secondary-color text-sm font-medium">
                          {agent.marketCap || '-'}
                        </p>
                      </div>
                    )}

                    {shouldShowColumn(currentFilter, AgentColumnField.CHANGE_24H) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('change24h')}</span>
                        <p className={` text-sm font-medium ${agent.change24h && parseFloat(agent.change24h) !== 0 ? (parseFloat(agent.change24h) > 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                          {formatPriceChange(agent.change24h)}
                        </p>
                      </div>
                    )}

                    {shouldShowColumn(currentFilter, AgentColumnField.TOKEN_PRICE) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('tokenPrice')}</span>
                        <p className="text-secondary-color text-sm font-medium">
                          {agent.price || '-'}
                        </p>
                      </div>
                    )}

                    {shouldShowColumn(currentFilter, AgentColumnField.VOLUME_24H) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('volume24h')}</span>
                        <p className="text-secondary-color text-sm font-medium">
                          {agent.volume24h ? parseFloat(agent.volume24h.replace(/[^0-9.-]+/g, "")).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0
                          }) : '-'}
                        </p>
                      </div>
                    )}

                    {shouldShowColumn(currentFilter, AgentColumnField.LIQUIDITY_POOL) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('liquidityPool')}</span>
                        <p className="text-secondary-color text-sm font-medium">
                          {agent.lp ? Number(agent.lp).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0
                          }) : '-'}
                        </p>
                      </div>
                    )}

                    {shouldShowColumn(currentFilter, AgentColumnField.STATUS) && (
                      <div className="space-y-1">
                        <span className="text-muted-color text-xs block">{t('status')}</span>
                        <div className="text-secondary-color text-sm font-medium">
                          <CustomBadge variant={getStatusVariant(agent.status)}>
                            {getStatusDisplayText(agent.status)}
                          </CustomBadge>
                        </div>
                      </div>
                    )}
                    {(agent.symbol === "STID" || agent.symbol === "SIC" || agent.symbol==="DLC" || agent.symbol==="DGC") && (
                      <div className="flex flex-col items-start">
                          <span className="text-muted-color text-xs block h-[15px]"></span>
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
                                px-[18px]
                                h-[35px] border-none text-white rounded-[10px]
                                text-center text-[14.5px] font-normal font-['Sora'] whitespace-nowrap flex flex-row justify-center items-center
                                `}
                            >
                              <img alt={t('accessibility.chatIcon')} aria-hidden="true" loading="lazy" width="12" height="12" decoding="async" data-nimg="1" src="/images/chat.svg" className="-ml-1 mr-2"></img>
                              <span className="mt-[2px]">
                                {agent.symbol === "DLC" ? t('chatButton.game') : t('chatButton.chat')}
                              </span>                         
                            </div>
                          </button>
                        </div>
                    )}
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
            })
          ) : (
                         <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-gray-900">
              <img 
                src="/logo.png" 
                alt={t('accessibility.noDataImage')} 
                width={60} 
                height={60} 
                className="opacity-30 mb-4" 
              />
              <div className="text-muted-color text-base">
                {t('noDataAvailable')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AgentListMobile; 