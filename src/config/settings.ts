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
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    allowedUsers: (process.env.TELEGRAM_ALLOWED_USERS || '').split(',').filter(Boolean)
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || '',
    walletId: process.env.SOLANA_WALLET_ID || '',
    seedPhrase: process.env.SOLANA_SEED_PHRASE || '',
    network: (process.env.SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'testnet' | 'devnet',
    commitment: 'confirmed' as const,
  },
  raydium: {
    programId: process.env.RAYDIUM_PROGRAM_ID || '',
    defaultSlippage: 1.0,
    priorityFee: 0.000001
  },
  trading: {
    maxSlippage: 1.0,
    minLiquidity: 1000,
    takeProfit: 1.5,
    stopLoss: 0.8,
    priorityFee: 0.000001,
    maxBuyAmount: 10,
    defaultAmount: 0.1,
    balanceThresholds: {
      minSol: 0.1,
      minUsdc: 10,
      warningThreshold: 0.5
    }
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
  },
  birdeye: {
    apiKey: process.env.BIRDEYE_API_KEY || ''
  }
};

export default config;
