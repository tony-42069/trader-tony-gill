import { Commitment } from '@solana/web3.js';

export interface SolanaConfig {
  rpcUrl: string;
  walletId: string;
  seedPhrase: string;
  network: 'mainnet-beta' | 'testnet' | 'devnet';
  commitment: Commitment;
}

export interface BalanceThresholds {
  minimum: number;
  warning: number;
  maximum: number;
  minSol?: number;
  minUsdc?: number;
  warningThreshold?: number;
}

export interface TradingConfig {
  maxSlippage: number;
  minLiquidity: number;
  takeProfit: number;
  stopLoss: number;
  priorityFee: number;
  maxBuyAmount: number;
  defaultAmount: number;
  balanceThresholds: BalanceThresholds;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  allowedUsers: string[];
}

export interface BotConfig {
  token: string;
  adminChatId: string;
  network: string;
  allowedUsers?: string[];
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

export interface BirdEyeConfig {
  apiKey: string;
}

export interface RaydiumConfig {
  programId: string;
}

export interface Config {
  telegram: {
    botToken: string;
    adminChatId: string;
    allowedUsers?: string[];
  };
  solana: {
    rpcUrl: string;
    walletId: string;
    seedPhrase: string;
    network: 'mainnet-beta' | 'testnet' | 'devnet';
    commitment?: Commitment;
  };
  raydium: {
    programId: string;
  };
  trading: TradingConfig;
  risk: RiskConfig;
  monitoring: MonitoringConfig;
  logger: LoggerConfig;
  birdeye: BirdEyeConfig;
}
