import { PublicKey } from '@solana/web3.js';
import { TokenAnalysis } from '../../analysis';

export interface MonitorConfig {
  priceChangeThreshold: number;
  liquidityChangeThreshold: number;
  volumeChangeThreshold: number;
  alertCooldown: number;
  maxTokensPerUser: number;
  checkInterval: number;
}

export interface MonitoredToken {
  address: string;
  symbol: string;
  userId: string;
  basePrice: number;
  baseLiquidity: number;
  baseVolume: number;
  lastPrice: number;
  lastLiquidity: number;
  lastVolume: number;
  priceChangeAlert: number;
  liquidityChangeAlert: number;
  volumeChangeAlert: number;
  lastAlertTime: number;
  addedAt: Date;
  lastChecked: Date;
  isActive: boolean;
}

export interface PriceAlert {
  type: AlertType;
  token: MonitoredToken;
  oldValue: number;
  newValue: number;
  changePercent: number;
  timestamp: Date;
}

export enum AlertType {
  PRICE_INCREASE = 'price_increase',
  PRICE_DECREASE = 'price_decrease',
  LIQUIDITY_INCREASE = 'liquidity_increase',
  LIQUIDITY_DECREASE = 'liquidity_decrease',
  VOLUME_SPIKE = 'volume_spike',
  VOLUME_DROP = 'volume_drop'
}

export interface TokenUpdate {
  price: number;
  priceChange: number;
  liquidity: number;
  liquidityChange: number;
  volume: number;
  volumeChange: number;
  lastUpdated: Date;
}

export interface MonitoringService {
  addToken(
    tokenAddress: string | PublicKey,
    userId: string,
    options?: {
      priceAlert?: number;
      liquidityAlert?: number;
      volumeAlert?: number;
    }
  ): Promise<MonitoredToken>;

  removeToken(
    tokenAddress: string | PublicKey,
    userId: string
  ): Promise<boolean>;

  getUserTokens(userId: string): Promise<MonitoredToken[]>;

  getTokenStatus(
    tokenAddress: string | PublicKey,
    userId: string
  ): Promise<TokenUpdate | null>;

  updateAlerts(
    tokenAddress: string | PublicKey,
    userId: string,
    alerts: {
      price?: number;
      liquidity?: number;
      volume?: number;
    }
  ): Promise<MonitoredToken>;

  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
}

export interface MonitorError {
  code: MonitorErrorCode;
  message: string;
  details?: Record<string, any>;
}

export enum MonitorErrorCode {
  TOKEN_NOT_FOUND = 'token_not_found',
  TOKEN_ALREADY_MONITORED = 'token_already_monitored',
  MAX_TOKENS_REACHED = 'max_tokens_reached',
  INVALID_ALERT_VALUE = 'invalid_alert_value',
  UPDATE_FAILED = 'update_failed',
  MONITORING_ERROR = 'monitoring_error'
}

export interface AlertHandler {
  onPriceAlert(alert: PriceAlert): Promise<void>;
  onLiquidityAlert(alert: PriceAlert): Promise<void>;
  onVolumeAlert(alert: PriceAlert): Promise<void>;
}
