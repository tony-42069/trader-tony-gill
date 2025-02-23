import { TokenAnalysis } from '../types';

export interface MonitoringConfig {
  priceChangeThreshold: number;  // Percentage change to trigger alert
  liquidityChangeThreshold: number;  // Percentage change to trigger alert
  volumeChangeThreshold: number;  // Percentage change to trigger alert
  checkInterval: number;  // Milliseconds between checks
  maxTokensPerUser: number;  // Maximum tokens a user can monitor
  alertCooldown: number;  // Milliseconds between alerts for the same condition
}

export interface MonitoredToken {
  address: string;
  userId: string;
  basePrice: number;
  baseLiquidity: number;
  baseVolume: number;
  lastChecked: Date;
  lastAlerted: Date;
  isActive: boolean;
  customAlerts?: {
    priceChange?: number;
    liquidityChange?: number;
    volumeChange?: number;
  };
}

export interface TokenAlert {
  type: TokenAlertType;
  tokenAddress: string;
  userId: string;
  oldValue: number;
  newValue: number;
  percentageChange: number;
  timestamp: Date;
}

export enum TokenAlertType {
  PRICE_INCREASE = 'price_increase',
  PRICE_DECREASE = 'price_decrease',
  LIQUIDITY_INCREASE = 'liquidity_increase',
  LIQUIDITY_DECREASE = 'liquidity_decrease',
  VOLUME_SPIKE = 'volume_spike',
  VOLUME_DROP = 'volume_drop',
  HIGH_RISK = 'high_risk',
  CONTRACT_CHANGE = 'contract_change'
}

export interface TokenMonitor {
  addToken(tokenAddress: string, userId: string, customAlerts?: MonitoredToken['customAlerts']): Promise<MonitoredToken>;
  removeToken(tokenAddress: string, userId: string): Promise<boolean>;
  updateAlerts(tokenAddress: string, userId: string, alerts: MonitoredToken['customAlerts']): Promise<MonitoredToken>;
  getMonitoredTokens(userId: string): Promise<MonitoredToken[]>;
  isTokenMonitored(tokenAddress: string, userId: string): Promise<boolean>;
  startMonitoring(): void;
  stopMonitoring(): void;
}

export interface AlertHandler {
  handleAlert(alert: TokenAlert): Promise<void>;
} 