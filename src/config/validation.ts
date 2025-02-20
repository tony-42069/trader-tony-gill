import { Config } from './types';

export function validateConfig(config: Config): void {
  // Validate Telegram settings
  if (!config.telegram.botToken) {
    throw new Error('Missing Telegram bot token');
  }
  if (!config.telegram.adminChatId) {
    throw new Error('Missing admin chat ID');
  }

  // Validate Solana settings
  if (!config.solana.rpcUrl) {
    throw new Error('Missing Solana RPC URL');
  }

  // Validate trading settings
  if (config.trading.maxSlippage <= 0 || config.trading.maxSlippage > 100) {
    throw new Error('Invalid maxSlippage: must be between 0 and 100');
  }
  if (config.trading.minLiquidity <= 0) {
    throw new Error('Invalid minLiquidity: must be greater than 0');
  }
  if (config.trading.takeProfit <= 0) {
    throw new Error('Invalid takeProfit: must be greater than 0');
  }
  if (config.trading.stopLoss <= 0) {
    throw new Error('Invalid stopLoss: must be greater than 0');
  }
  if (config.trading.priorityFee < 0) {
    throw new Error('Invalid priorityFee: must be non-negative');
  }
  if (config.trading.maxBuyAmount <= 0) {
    throw new Error('Invalid maxBuyAmount: must be greater than 0');
  }
  if (config.trading.defaultAmount <= 0 || config.trading.defaultAmount > config.trading.maxBuyAmount) {
    throw new Error('Invalid defaultAmount: must be greater than 0 and less than maxBuyAmount');
  }

  // Validate risk settings
  if (config.risk.maxRiskScore < 0 || config.risk.maxRiskScore > 100) {
    throw new Error('Invalid maxRiskScore: must be between 0 and 100');
  }
  if (config.risk.minHolders < 0) {
    throw new Error('Invalid minHolders: must be non-negative');
  }
  if (config.risk.maxBuyTax < 0 || config.risk.maxBuyTax > 100) {
    throw new Error('Invalid maxBuyTax: must be between 0 and 100');
  }
  if (config.risk.maxSellTax < 0 || config.risk.maxSellTax > 100) {
    throw new Error('Invalid maxSellTax: must be between 0 and 100');
  }

  // Validate monitoring settings
  if (config.monitoring.enabled) {
    if (config.monitoring.priceChangeThreshold <= 0) {
      throw new Error('Invalid priceChangeThreshold: must be greater than 0');
    }
    if (config.monitoring.liquidityChangeThreshold <= 0) {
      throw new Error('Invalid liquidityChangeThreshold: must be greater than 0');
    }
    if (config.monitoring.volumeSpikeThreshold <= 0) {
      throw new Error('Invalid volumeSpikeThreshold: must be greater than 0');
    }
    if (config.monitoring.alertCooldown <= 0) {
      throw new Error('Invalid alertCooldown: must be greater than 0');
    }
    if (config.monitoring.maxPoolsPerUser <= 0) {
      throw new Error('Invalid maxPoolsPerUser: must be greater than 0');
    }
    if (config.monitoring.checkInterval <= 0) {
      throw new Error('Invalid checkInterval: must be greater than 0');
    }
  }
}

export default validateConfig;
