import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { CustomButton } from "@/components/ui-custom/custom-button";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CryptoChart from "@/components/crypto-chart/CryptoChart";
import { HoldersList } from "./HoldersList";
import { MarketData } from "./MarketData";
import { useAgentStore } from "@/store/useAgentStore";
import { toast } from "@/components/ui/use-toast";
import { useDBCToken } from "@/hooks/useDBCToken";
import { useLocale, useTranslations } from 'next-intl';
import { useSwapKLineData } from '@/hooks/useSwapKLineData';
import { TimeInterval } from '@/hooks/useTokenPrice';
import { useAppKitAccount } from '@reown/appkit/react';
import { useState, useEffect } from "react";
import { LocalAgent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { DBC_TOKEN_ADDRESS, XAA_TOKEN_ADDRESS, getTokenExchangeRate } from "@/services/swapService";
import { useDBCPrice } from '@/hooks/useDBCPrice';
import { formatPrice } from '@/lib/format';
import { API_CONFIG } from '@/config/api';
import { ContainerLinkManager } from './ContainerLinkManager';

interface AgentInfoProps {
  agent: LocalAgent;
  currentPrice: number;
}

export function AgentInfo({ agent }: AgentInfoProps) {
  const { dbcPriceUsd } = useDBCPrice();
  const [baseTokenXaaRate, setBaseTokenXaaRate] = useState<number>(1);

  useEffect(() => {
    console.log("agent", agent);

    const fetchBaseTokenXaaRate = async () => {
      if (agent?.tokenAddress && agent.symbol !== "XAA") {
        try {
          const rate = await getTokenExchangeRate(XAA_TOKEN_ADDRESS, DBC_TOKEN_ADDRESS);
          setBaseTokenXaaRate(rate);
        } catch (error) {
          console.error('获取代币XAA兑换比例失败:', error);
          setBaseTokenXaaRate(1);
        }
      }
    };

    fetchBaseTokenXaaRate();
  }, [agent?.tokenAddress, agent?.symbol]);

  const { tokenData, loading: tokenLoading, error: tokenError } = useDBCToken(agent?.tokenAddress || null);
  const locale = useLocale();
  const t = useTranslations('agent');
  const tAgentDetail = useTranslations('agentDetail');

  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1h');
  const {
    klineData,
    currentPrice,
    priceChange,
    isLoading: klineLoading,
    error: klineError,
    refetch,
    loadMore
  } = useSwapKLineData({
    symbol: agent?.symbol || '',
    interval: selectedInterval,
    targetToken: agent?.tokenAddress || '',
    baseToken: agent?.symbol === "XAA" ? DBC_TOKEN_ADDRESS : XAA_TOKEN_ADDRESS
  });

  // 记录详情页面的价格变化数据
  useEffect(() => {
    console.log('详情页面价格变化数据:', priceChange);
  }, [priceChange]);

  // 记录最终使用的价格变化数据
  useEffect(() => {
    console.log('最终使用的价格变化数据:', priceChange);
  }, [priceChange]);

  const handleIntervalChange = (interval: TimeInterval) => {
    setSelectedInterval(interval);
    refetch({ interval: interval });
  };

  // 根据当前语言获取对应的描述
  const getLocalizedDescription = () => {
    if (!agent) return "";
    if (locale === 'zh') {
      return agent.descriptionZH;
    } else if (locale === 'ko') {
      return agent.descriptionKO;
    } else if (locale === 'ja') {
      return agent.descriptionJA;
    }
    return agent.description;
  };

  const address = useAppKitAccount()?.address;

  if (tokenLoading) {
    return (
      <Card className="p-6 bg-card">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full animate-pulse bg-foreground"></div>
          <div className="w-4 h-4 rounded-full animate-pulse bg-foreground"></div>
          <div className="w-4 h-4 rounded-full animate-pulse bg-foreground"></div>
        </div>
      </Card>
    );
  }

  if (tokenError) {
    return (
      <Card className="p-6 bg-card">
        <div className="text-center space-y-4">
          <div className="text-red-500">{tokenError}</div>
          <Button onClick={() => {
            // Implement the logic to retry fetching the agent data
          }} variant="outline">
            重试
          </Button>
        </div>
      </Card>
    );
  }

  if (!agent) {
    return (
      <Card className="p-6 bg-card">
        <div className="text-foreground text-center">
          {t('notFound')}
        </div>
      </Card>
    );
  }

  console.log("currentPrice", currentPrice, "dbcPriceUsd", dbcPriceUsd, "baseTokenXaaRate", baseTokenXaaRate);


  return (
    <Card className="p-6 bg-card">
      {/* Agent Basic Information */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <img
              src={agent.avatar || ''}
              alt={t('accessibility.agentAvatar')}
              className="h-full w-full object-cover"
            />
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex justify-start items-center flex-wrap">
              <h1 className="text-xl font-semibold">{agent?.name}</h1>
              <div className="flex items-baseline text-xl font-medium ml-3">
                <span className="text-primary">$</span>
                <span className="text-primary">
                  {formatPrice(currentPrice * Number(dbcPriceUsd || 0) * (agent?.symbol === "XAA" ? 1 : baseTokenXaaRate), 8).value}
                </span>
                <span className="text-muted-foreground ml-1">USDT</span>
              </div>
            </div>

            {tokenData && (
              <>
                <div className="flex items-start md:items-center gap-1.5 mt-0.5">
                  <>
                    <div className="text-muted-color text-[10px] font-normal font-['Sora'] leading-[10px] pt-[2px] md:pt-0">${tokenData?.symbol}</div>
                    <div className="flex flex-col md:flex-row md:items-center md:gap-1 min-w-[80px] max-w-full p-0 md:px-2 md:py-1 bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-md">
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {tAgentDetail('contract')}:
                      </span>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <a
                          href={`${API_CONFIG.DBCSCAN.BASE_URL.replace('/api/v2', '')}/token/${tokenData?.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-tertiary-color text-xs hover:text-primary transition-colors truncate"
                          aria-label={t('accessibility.contractLink')}
                        >
                          {tokenData?.address}
                        </a>
                        <button
                          type="button"
                          className="p-1 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(tokenData?.address || "");
                            toast({
                              description: t('addressCopied'),
                            });
                          }}
                          aria-label={t('accessibility.copyContractAddress')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                </div>
              </>
            )}

            {/* <CustomButton
              className="flex items-center gap-2 mt-3"
              onClick={() => {
                if (chatEntry && chatEntry.trim() !== "None") {
                  window.open(chatEntry, "_blank");
                } else {
                  toast({
                    description: t('chatComingSoon'),
                  })
                }
              }}
            >
              <Image src="/images/chat.svg" alt="Chatting" width={12} height={12} />
              {t('chat')}
            </CustomButton> */}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
          <div className="flex items-center gap-2">
                    {/* {address && ((agent as any)?.creator?.address) && address.toLowerCase() === (agent as any).creator.address.toLowerCase() && (
              <Button
                variant="outline"
                className="flex items-center gap-2 ml-2 text-xs py-1 px-2"
                onClick={() => {
                  window.open(`/${locale}/chat/edit/${agent.id}`, '_blank')
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('edit')}
              </Button>
            )}
             */}
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t('createdBy')}:</span>
            <Avatar className="h-7 w-7">
              <img
                src={agent.avatar || ''}
                alt={t('accessibility.creatorAvatar')}
                className="h-full w-full object-cover rounded-full"
              />
            </Avatar>
    
          </div>
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="">
        <CryptoChart
          agent={agent}
          klineData={klineData}
          currentPrice={currentPrice}
          priceChange={priceChange}
          isLoading={klineLoading}
          error={klineError}
          onIntervalChange={handleIntervalChange}
          onRetry={refetch}
          dbcPriceUsd={dbcPriceUsd}
          onLoadMore={loadMore}
        />
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs defaultValue="information" className="w-full mt-6">
          <TabsList className="bg-transparent border border-border p-1 mb-4">
            <TabsTrigger
              value="information"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border data-[state=active]:border-border px-4 py-1"
            >
              {t('information')}
            </TabsTrigger>
            <TabsTrigger
              value="holders"
              className="data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:border data-[state=active]:border-border px-4 py-1"
            >
              {t('holders')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="information">
            <MarketData
              tokenData={tokenData}
              agent={agent}
              currentPrice={currentPrice}
              dbcPriceUsd={dbcPriceUsd}
              baseTokenXaaRate={baseTokenXaaRate}
            />
          </TabsContent>

          <TabsContent value="holders">
            <HoldersList
              tokenAddress={tokenData?.address || ""}
              holders={tokenData?.holders || ""}
              hasTokenAddress={!!agent?.tokenAddress}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Container Link Manager */}
      <ContainerLinkManager
        agent={agent}
        isCreator={address && ((agent as any)?.creator?.address) && address.toLowerCase() === (agent as any).creator.address.toLowerCase()}
      />

      {/* Description */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">{t('description')}</h2>
        {getLocalizedDescription()?.split("\n").map((line: string, index: number) => (
          <p key={index} className="text-sm text-muted-foreground break-words mb-2">
            {line}
          </p>
        ))}
      </div>
    </Card>
  );
} 