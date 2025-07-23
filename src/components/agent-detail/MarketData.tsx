import { Card } from "@/components/ui/card";
import { LocalAgent } from "@/types/agent";
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react";
import { getBatchTokenPrices } from "@/services/swapService";

interface TokenDetail {
  address: string;
  circulating_market_cap: number | null;
  decimals: string;
  exchange_rate: number | null;
  holders: string;
  icon_url: string | null;
  name: string;
  symbol: string;
  total_supply: string;
  type: string;
  volume_24h: number | null;
}

interface TokenPriceInfo {
  usdPrice?: number;
  volume24h?: number;
  tvl?: number;
  priceChange24h?: number;
}

interface MarketDataProps {
  tokenData: TokenDetail | null;
  agent: LocalAgent | null;
  currentPrice: number | null;
  dbcPriceUsd: number;
  baseTokenXaaRate: number;
}

export function MarketData({
  tokenData,
  agent,
  currentPrice,
  dbcPriceUsd,
  baseTokenXaaRate
}: MarketDataProps) {
  const t = useTranslations('marketData');
  const [tokenPrice, setTokenPrice] = useState<TokenPriceInfo | null>(null);

  const formatNumber = (num: number | null, defaultValue: string) => {
    if (num === null) return defaultValue;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatTotalSupply = (supply: string | undefined) => {
    // Convert string to number, considering decimals is 18
    const value = Number(supply) / Math.pow(10, 18) || 100000000000;

    // 智能决定小数位数：整数不显示小数点，有小数时显示
    const formatNumber = (num: number) => {
      return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };

    // 中文习惯：亿(1e8)、万(1e4)、千(1e3)
    if (value >= 1e8) {
      const formatted = formatNumber(value / 1e8);
      return `${formatted}${t('units.billionShort')}`;
    }
    if (value >= 1e4) {
      const formatted = formatNumber(value / 1e4);
      return `${formatted}${t('units.millionShort')}`;
    }
    if (value >= 1e3) {
      const formatted = formatNumber(value / 1e3);
      return `${formatted}${t('units.thousandShort')}`;
    }
    return formatNumber(value);
  };

  const getTokenPrice = async () => {
    const tokenSwapDatas = await getBatchTokenPrices([{
      address: agent?.tokenAddress || "",
      symbol: agent?.symbol || ""
    }]);

    if (agent?.symbol && tokenSwapDatas[agent.symbol]) {
      setTokenPrice(tokenSwapDatas[agent.symbol]);
    }
  };

  useEffect(() => {
    getTokenPrice();
  }, [agent?.tokenAddress, agent?.symbol]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">{t('marketCap')}</div>
        <div className="text-lg font-semibold mt-1">
          {formatNumber(
            agent?.totalSupply && currentPrice && dbcPriceUsd
              ? Number(agent.totalSupply * currentPrice * dbcPriceUsd * baseTokenXaaRate)
              : null,
            t('tba')
          )}
        </div>
      </Card>

      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">{t('volume24h')}</div>
        <div className="text-lg font-semibold mt-1">
          {formatNumber(tokenPrice?.volume24h ?? null, t('zero'))}
        </div>
      </Card>

      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">{t('totalSupply')}</div>
        <div className="text-lg font-semibold mt-1">
          {formatTotalSupply(tokenData?.total_supply)}
        </div>
      </Card>

      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">{t('holders')}</div>
        <div className="text-lg font-semibold mt-1">
          {tokenData?.holders ? Number(tokenData.holders).toLocaleString() : t('tba')}
        </div>
      </Card>
    </div>
  );
} 