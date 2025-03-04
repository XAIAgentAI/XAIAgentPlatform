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
import {
  agentAPI
} from '@/services/api'
import { useState } from "react";
import { useEffect } from "react";
import { LocalAgent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { DBC_TOKEN_ADDRESS, XAA_TOKEN_ADDRESS } from "@/services/swapService";
import { fetchDBCPrice as fetchDBCPriceFromHook } from "@/hooks/useDBCPrice";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface AgentInfoProps {
  agentId: string;
}

export function AgentInfo({ agentId }: AgentInfoProps) {
  const [agent, setAgent] = useState<LocalAgent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbcPriceUsd, setDBCPriceUsd] = useState<number>(0);

  const getAgentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await agentAPI.getAgentById(Number(agentId)) as unknown as ApiResponse<LocalAgent>;
      if (res?.code === 200) {
        setAgent(res.data);
      } else {
        setError(res?.message || '获取数据失败');
      }
    } catch (error: any) {
      console.error('Failed to fetch agent:', error);
      setError(error?.message || '获取数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getAgentData();
  }, [agentId]);

  useEffect(() => {
    const getDBCPrice = async () => {
      const priceInfo = await fetchDBCPriceFromHook();
      if (priceInfo && typeof priceInfo.priceUsd === 'string') {
        setDBCPriceUsd(Number(priceInfo.priceUsd));
      }
    };
    getDBCPrice();
  }, []);

  const { tokenData, loading: tokenLoading, error: tokenError } = useDBCToken(agent?.tokenAddress || null);
  const chatEntry = agent?.chatEntry || "";
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
    refetch
  } = useSwapKLineData({
    interval: selectedInterval,
    targetToken: agent?.tokenAddress || '',
    baseToken: agent?.symbol === "XAA" ? DBC_TOKEN_ADDRESS : XAA_TOKEN_ADDRESS
  });

  const handleIntervalChange = (interval: TimeInterval) => {
    setSelectedInterval(interval);
    refetch({ interval });
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

  // 根据当前语言获取对应的状态
  const getLocalizedStatus = () => {
    if (!agent) return "";
    return agent.status;
  };

  if (isLoading || tokenLoading) {
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

  if (error || tokenError) {
    return (
      <Card className="p-6 bg-card">
        <div className="text-center space-y-4">
          <div className="text-red-500">{error || tokenError}</div>
          <Button onClick={getAgentData} variant="outline">
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
            <h1 className="text-xl font-semibold">{agent?.name}</h1>
            {tokenData && (
              <>
                <div className="flex  items-start md:items-center gap-2 mt-1">
                  <>
                    <div className="text-muted-color text-[10px] font-normal font-['Sora'] leading-[10px] pt-[3px] md:pt-0">${tokenData?.symbol}</div>
                    <div className="flex flex-col  md:flex-row  md:items-center  md:gap-1 min-w-[80px] max-w-full p-0 md:px-3 md:py-2 bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-lg">
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {tAgentDetail('contract')}:
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <a
                          href={`https://dbcscan.io/token/${tokenData?.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-tertiary-color text-xs hover:text-primary transition-colors truncate"
                          aria-label={t('accessibility.contractLink')}
                        >
                          {tokenData?.address}
                        </a>
                        <button
                          type="button"
                          className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
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
                            className="h-4 w-4"
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
          dbcPriceUsd={dbcPriceUsd}
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
            />
          </TabsContent>

          <TabsContent value="holders">
            <HoldersList tokenAddress={tokenData?.address || ""} holders={tokenData?.holders || ""} />
          </TabsContent>
        </Tabs>
      </div>

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