import { Card } from "@/components/ui/card";

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
  tokenData: TokenDetail;
}

export function MarketData({ tokenData }: MarketDataProps) {
  const formatNumber = (num: number | null, defaultValue: string) => {
    if (num === null) return defaultValue;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatTotalSupply = (supply: string) => {
    // 将字符串转换为数字，考虑到 decimals 为 18
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
        <div className="text-sm text-muted-foreground">Market Cap</div>
        <div className="text-lg font-semibold mt-1">
          {formatNumber(tokenData.circulating_market_cap, "TBA")}
        </div>
      </Card>

      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">24h Volume</div>
        <div className="text-lg font-semibold mt-1">
          {formatNumber(tokenData.volume_24h, "0")}
        </div>
      </Card>

      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">Total Supply</div>
        <div className="text-lg font-semibold mt-1">
          {formatTotalSupply(tokenData.total_supply)}
        </div>
      </Card>

      <Card className="p-4 bg-card-inner">
        <div className="text-sm text-muted-foreground">Holders</div>
        <div className="text-lg font-semibold mt-1">
          {Number(tokenData.holders).toLocaleString()}
        </div>
      </Card>
    </div>
  );
} 