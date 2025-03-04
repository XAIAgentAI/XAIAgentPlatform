export type TimeInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface KLineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} 