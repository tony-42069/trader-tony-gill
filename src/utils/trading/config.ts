import { MEVProtectionConfig } from '../../trading/sniper/types';

export interface TradingConfig {
  // Position management
  minPositionSize: number;
  maxPositionSize: number;
  defaultStopLoss: number;
  defaultTakeProfit: number;
  maxOpenPositions: number;

  // Risk management
  maxLossPerTrade: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  riskPerTrade: number;

  // Execution
  defaultSlippage: number;
  maxSlippage: number;
  priorityFee: number;
  retryAttempts: number;
  retryDelay: number;

  // MEV protection
  mevProtection: MEVProtectionConfig;

  // Monitoring
  priceUpdateInterval: number;
  positionUpdateInterval: number;
  alertThresholds: {
    priceChange: number;
    volumeChange: number;
    liquidityChange: number;
  };
}

export const defaultTradingConfig: TradingConfig = {
  minPositionSize: 0.1,
  maxPositionSize: 10,
  defaultStopLoss: 0.05,
  defaultTakeProfit: 0.1,
  maxOpenPositions: 5,

  maxLossPerTrade: 0.02,
  maxDailyLoss: 0.1,
  maxDrawdown: 0.2,
  riskPerTrade: 0.01,

  defaultSlippage: 0.01,
  maxSlippage: 0.05,
  priorityFee: 0.000001,
  retryAttempts: 3,
  retryDelay: 1000,

  mevProtection: {
    enabled: true,
    maxPriorityFee: 0.000001,
    sandwichThreshold: 0.02,
    defaultSlippage: 0.01,
    minDelay: 500
  },

  priceUpdateInterval: 5000,
  positionUpdateInterval: 10000,
  alertThresholds: {
    priceChange: 0.05,
    volumeChange: 0.2,
    liquidityChange: 0.1
  }
}; 