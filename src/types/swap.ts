export interface Token {
  id: string;
  name: string;
  volume: string;
}

export interface SwapData {
  id: string;
  amount0: string;
  amount1: string;
  token0: Token;
  token1: Token;
  timestamp: string;
}

export interface SwapResponse {
  data: {
    swaps: SwapData[];
  };
}

export interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
} 