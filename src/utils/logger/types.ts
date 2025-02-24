export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  service: string;
  environment: string;
  requestId: string;
  timestamp: string;
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TradeExecutionLog {
  type: 'buy' | 'sell';
  token: string;
  amount: number;
  price: number;
  timestamp: string;
  txHash?: string;
}

export interface SnipeAttemptLog {
  token: string;
  targetPrice: number;
  maxSlippage: number;
  timestamp: string;
  strategy?: string;
}

export interface PositionUpdateLog {
  token: string;
  currentPrice: number;
  profitLoss: number;
  holdingTime: number;
  timestamp: string;
}
