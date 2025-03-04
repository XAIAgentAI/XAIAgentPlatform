import { LocalAgent } from "@/types/agent";
import { KLineData, TimeInterval } from "@/types/chart";

interface CryptoChartProps {
  agent: LocalAgent;
  klineData: KLineData[];
  currentPrice: number;
  priceChange: number;
  isLoading: boolean;
  error: string | null;
  onIntervalChange: (interval: TimeInterval) => void;
  dbcPriceUsd: number;
}

const CryptoChart = ({ 
  agent, 
  klineData, 
  currentPrice, 
  priceChange, 
  isLoading, 
  error, 
  onIntervalChange,
  dbcPriceUsd 
}: CryptoChartProps) => {
// ... existing code ...
} 