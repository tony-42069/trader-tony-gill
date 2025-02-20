import dotenv from 'dotenv';
import { Config } from './types';

// Load environment variables
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!process.env.ADMIN_CHAT_ID) {
  throw new Error('ADMIN_CHAT_ID is required');
}

if (!process.env.SOLANA_RPC_URL) {
  throw new Error('SOLANA_RPC_URL is required');
}

export const config: Config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminChatId: process.env.ADMIN_CHAT_ID
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL,
    walletId: process.env.WALLET_ID || '',
    seedPhrase: process.env.WALLET_SEED_PHRASE || ''
  },
  trading: {
    maxSlippage: 1.0,         // Maximum slippage percentage
    minLiquidity: 1000,       // Minimum liquidity in USD
    takeProfit: 50.0,         // Take profit percentage
    stopLoss: 20.0,           // Stop loss percentage
    priorityFee: 0.0001,      // Priority fee in SOL
    maxBuyAmount: 1.0,        // Maximum buy amount in SOL
    defaultAmount: 0.1        // Default quick snipe amount
  },
  risk: {
    maxRiskScore: 70,         // Maximum acceptable risk score
    minHolders: 10,           // Minimum number of holders
    maxBuyTax: 10.0,          // Maximum acceptable buy tax
    maxSellTax: 10.0,         // Maximum acceptable sell tax
    requireVerified: true,    // Require verified contracts
    requireRenounced: true    // Require renounced ownership
  },
  monitoring: {
    enabled: true,            // Enable pool monitoring
    priceChangeThreshold: 5.0,    // Price change alert threshold
    liquidityChangeThreshold: 10.0,// Liquidity change alert
    volumeSpikeThreshold: 100.0,  // Volume spike alert threshold
    alertCooldown: 300,           // Seconds between alerts
    maxPoolsPerUser: 10,          // Max pools to monitor per user
    checkInterval: 60             // Pool check interval in seconds
  },
  logger: {
    logLevel: 'info',
    maxFileSize: '20m',
    retentionDays: '14d',
    enableConsole: true,
    enablePerformanceLogging: true,
    logDirectory: 'logs',
    errorLogName: 'error.log',
    tradeLogName: 'trades.log'
  }
};

export default config;
