import { LocalAgent } from "@/data/localAgents";

interface MarketDataProps {
  agentData: LocalAgent;
}

export function MarketData({ agentData }: MarketDataProps) {
  return (
    <div className="font-['Sora'] flex justify-between items-start p-4 px-8 bg-card-inner rounded-lg">
      <div className="text-sm">
        <p className="text-xs text-muted-foreground mb-1 opacity-50">Market Cap</p>
        <p className="text-foreground">{agentData.marketCap}</p>
        {/* <p className="text-success">{agentData.change24h}</p> */}
      </div>

      <div className="h-16 w-[1px] bg-gray-200 dark:bg-gray-700"></div>

      <div className="text-sm">
        <p className="text-xs text-muted-foreground mb-1 opacity-50">Total Value</p>
        <p className="text-foreground">{agentData.tvl}</p>
      </div>

      <div className="h-16 w-[1px] bg-gray-200 dark:bg-gray-700"></div>

      <div className="text-sm">
        <p className="text-xs text-muted-foreground mb-1 opacity-50">Holders</p>
        <p className="text-foreground">{agentData.holdersCount.toLocaleString()}</p>
      </div>

      <div className="h-16 w-[1px] bg-gray-200 dark:bg-gray-700"></div>

      <div className="text-sm">
        <p className="text-xs text-muted-foreground mb-1 opacity-50">24h Volume</p>
        <p className="text-foreground">{agentData.volume24h}</p>
      </div>

      <div className="h-16 w-[1px] bg-gray-200 dark:bg-gray-700"></div>

      <div className="text-sm">
        <p className="text-xs text-muted-foreground mb-1 opacity-50">Lifetime</p>
        <p className="text-foreground">{agentData.lifetime}</p>
      </div>
    </div>
  );
} 