import { Card } from "@/components/ui/card";
import { useTranslations } from 'next-intl';

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

interface MarketDataProps {
  tokenData: TokenDetail | null;
}

export function MarketData({ tokenData }: MarketDataProps) {
  const t = useTranslations('marketData');

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
    if (!supply) return t('tba');
    // Convert string to number, considering decimals is 18
    const value = Number(supply) / Math.pow(10, 18);
    
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    }
    if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">{t('marketCap')}</div>
        <div className="text-lg font-semibold mt-1">
          {formatNumber(tokenData?.circulating_market_cap ?? null, t('tba'))}
        </div>
      </Card>

      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">{t('volume24h')}</div>
        <div className="text-lg font-semibold mt-1">
          {formatNumber(tokenData?.volume_24h ?? null, t('zero'))}
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