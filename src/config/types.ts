export interface TradingConfig {
  maxSlippage: number;
  minLiquidity: number;
  takeProfit: number;
  stopLoss: number;
  priorityFee: number;
  maxBuyAmount: number;
  defaultAmount: number;
}

export interface RiskConfig {
  maxRiskScore: number;
  minHolders: number;
  maxBuyTax: number;
  maxSellTax: number;
  requireVerified: boolean;
  requireRenounced: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  priceChangeThreshold: number;
  liquidityChangeThreshold: number;
  volumeSpikeThreshold: number;
  alertCooldown: number;
  maxPoolsPerUser: number;
  checkInterval: number;
}

export interface LoggerConfig {
  logLevel: 'error' | 'warn' | 'info' | 'trade' | 'snipe' | 'debug';
  maxFileSize: string;
  retentionDays: string;
  enableConsole: boolean;
  enablePerformanceLogging: boolean;
  logDirectory: string;
  errorLogName: string;
  tradeLogName: string;
}

export interface Config {
  telegram: {
    botToken: string;
    adminChatId: string;
  };
  solana: {
    rpcUrl: string;
    walletId: string;
    seedPhrase: string;
  };
  trading: TradingConfig;
  risk: RiskConfig;
  monitoring: MonitoringConfig;
  logger: LoggerConfig;
}
