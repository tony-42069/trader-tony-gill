import { createBot, createDefaultConfig } from '../bot/factory';
import { SolanaClientImpl } from '../utils/solana/client';
import { WalletManagerImpl } from '../utils/wallet/wallet';
import { TokenAnalyzerImpl } from '../analysis/analyzer';
import { TraderImpl } from '../trading/trader';
import { MonitoringServiceImpl } from '../trading/monitor';
import { SniperServiceImpl } from '../trading/sniper/service';
import { PositionManagerImpl } from '../trading/position/manager';
import { PositionMonitorImpl } from '../trading/position/monitor';
import { RaydiumClient } from '../utils/raydium/client';
import { logger } from '../utils/logger';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createTelegramAlertHandler } from '../bot/alerts/telegram-alert-handler';
import { Network } from '../utils/wallet/types';

async function main() {
  try {
    // Load environment variables
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
    const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
    const RAYDIUM_PROGRAM_ID = process.env.RAYDIUM_PROGRAM_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID || !WALLET_PRIVATE_KEY || !RAYDIUM_PROGRAM_ID) {
      throw new Error('Missing required environment variables');
    }

    // Create Solana connection and client
    const connection = new Connection(RPC_ENDPOINT, {
      commitment: 'confirmed',
      wsEndpoint: RPC_ENDPOINT.replace('https', 'wss')
    });

    const solanaClient = new SolanaClientImpl({
      endpoint: RPC_ENDPOINT,
      commitment: 'confirmed',
      timeout: 30000,
      maxRetries: 3,
      priorityFee: 0.000001
    });

    // Initialize wallet
    const walletConfig = {
      seedPhrase: WALLET_PRIVATE_KEY,
      network: 'mainnet-beta' as Network,
      balanceThresholds: {
        minimum: 0.1,
        warning: 0.5,
        maximum: 10.0
      },
      monitoringInterval: 60000
    };
    const walletManager = new WalletManagerImpl(walletConfig);

    // Initialize services
    const raydiumProgramId = new PublicKey(RAYDIUM_PROGRAM_ID);
    const raydiumClient = new RaydiumClient(connection, raydiumProgramId);
    const tokenAnalyzer = new TokenAnalyzerImpl(solanaClient, raydiumClient);

    const trader = new TraderImpl(
      solanaClient,
      walletManager,
      tokenAnalyzer
    );

    const alertHandler = createTelegramAlertHandler(TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID);

    const monitoringService = new MonitoringServiceImpl(
      tokenAnalyzer,
      alertHandler,
      {
        priceChangeThreshold: 5, // 5%
        liquidityChangeThreshold: 10, // 10%
        volumeChangeThreshold: 20, // 20%
        alertCooldown: 300000, // 5 minutes
        maxTokensPerUser: 10,
        checkInterval: 60000 // 1 minute
      }
    );

    const sniperService = new SniperServiceImpl(
      connection,
      tokenAnalyzer,
      walletManager,
      raydiumProgramId
    );

    const positionMonitor = new PositionMonitorImpl(
      tokenAnalyzer,
      raydiumClient
    );

    const positionManager = new PositionManagerImpl(
      raydiumClient,
      tokenAnalyzer,
      positionMonitor
    );

    // Create bot config
    const config = createDefaultConfig(
      TELEGRAM_BOT_TOKEN,
      TELEGRAM_ADMIN_CHAT_ID
    );

    // Create and start bot
    const bot = createBot(
      config,
      solanaClient,
      walletManager,
      tokenAnalyzer,
      trader,
      monitoringService,
      sniperService,
      positionManager
    );

    await bot.start();

    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down bot...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down bot...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start bot:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

main(); 