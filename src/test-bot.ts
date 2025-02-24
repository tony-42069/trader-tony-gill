import { createBot, createDefaultConfig } from './bot/factory';
import { SolanaClient } from './utils/solana/types';
import { SolanaClientImpl } from './utils/solana/client';
import { WalletManagerImpl, KeypairWallet } from './utils/wallet/wallet';
import { TokenAnalyzerImpl } from './analysis/analyzer';
import { TraderImpl } from './trading/trader';
import { MonitoringServiceImpl } from './trading/monitor';
import { SniperServiceImpl } from './trading/sniper/service';
import { PositionManagerImpl } from './trading/position/manager';
import { RaydiumClient } from './utils/raydium/client';
import { logger } from './utils/logger';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createTelegramAlertHandler } from './bot/alerts';
import { config } from './config/settings';
import { AlertHandler, AlertType, PriceAlert } from './trading/monitor/types';
import { defaultTradingConfig } from './utils/trading/config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBot() {
  try {
    logger.info('Starting bot test...');

    // Verify environment variables
    const requiredEnvVars = [
      'TELEGRAM_BOT_TOKEN',
      'ADMIN_CHAT_ID',
      'SOLANA_RPC_URL',
      'WALLET_SEED_PHRASE'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    logger.info('Environment variables verified');

    // Initialize Solana connection
    const connection = new Connection(process.env.SOLANA_RPC_URL!, {
      commitment: 'confirmed',
      wsEndpoint: process.env.SOLANA_WS_URL
    });

    const solanaClient = new SolanaClientImpl({
      endpoint: process.env.SOLANA_RPC_URL!,
      commitment: 'confirmed',
      timeout: 30000,
      maxRetries: 3,
      priorityFee: 0.000001
    });

    // Initialize wallet
    const walletConfig = {
      seedPhrase: process.env.WALLET_SEED_PHRASE!,
      network: process.env.NETWORK as 'mainnet-beta' | 'testnet' | 'devnet',
      balanceThresholds: {
        minimum: 0.1,
        warning: 0.5,
        maximum: 10.0
      },
      monitoringInterval: 60000
    };

    const walletManager = new WalletManagerImpl(walletConfig);
    logger.info('Wallet initialized');

    // Initialize Raydium client
    const raydiumProgramId = new PublicKey(process.env.RAYDIUM_PROGRAM_ID!);
    const raydiumClient = new RaydiumClient(connection, raydiumProgramId);

    // Initialize services
    const tokenAnalyzer = new TokenAnalyzerImpl(solanaClient, raydiumClient);
    const trader = new TraderImpl(solanaClient, walletManager, tokenAnalyzer);

    // Create alert handler
    const alertHandler: AlertHandler = {
      async onPriceAlert(alert: PriceAlert) {
        logger.info('Price alert triggered', {
          token: alert.token.address,
          oldPrice: alert.oldValue,
          newPrice: alert.newValue,
          change: alert.changePercent
        });
      },
      async onLiquidityAlert(alert: PriceAlert) {
        logger.info('Liquidity alert triggered', {
          token: alert.token.address,
          oldLiquidity: alert.oldValue,
          newLiquidity: alert.newValue,
          change: alert.changePercent
        });
      },
      async onVolumeAlert(alert: PriceAlert) {
        logger.info('Volume alert triggered', {
          token: alert.token.address,
          oldVolume: alert.oldValue,
          newVolume: alert.newValue,
          change: alert.changePercent
        });
      }
    };

    const monitoringService = new MonitoringServiceImpl(tokenAnalyzer, alertHandler, {
      priceChangeThreshold: 5,
      liquidityChangeThreshold: 10,
      volumeChangeThreshold: 20,
      checkInterval: 60000,
      maxTokensPerUser: 10,
      alertCooldown: 300000
    });

    // Create a KeypairWallet instance for the sniper and position manager
    const keypairWallet = new KeypairWallet(Keypair.fromSeed(Buffer.from(walletConfig.seedPhrase, 'hex')), connection);

    const sniperService = new SniperServiceImpl(
      connection,
      tokenAnalyzer,
      walletManager,
      raydiumProgramId,
      solanaClient,
      keypairWallet,
      defaultTradingConfig
    );

    const positionManager = new PositionManagerImpl(
      solanaClient,
      raydiumClient,
      keypairWallet,
      defaultTradingConfig
    );

    logger.info('Services initialized');

    // Create bot instance
    const botConfig = createDefaultConfig(
      process.env.TELEGRAM_BOT_TOKEN!,
      process.env.ADMIN_CHAT_ID!
    );

    const bot = createBot(
      botConfig,
      solanaClient,
      walletManager,
      tokenAnalyzer,
      trader,
      monitoringService,
      sniperService,
      positionManager
    );

    logger.info('Bot created, starting...');

    // Start the bot
    await bot.start();
    logger.info('Bot started successfully');

    // Test token analysis
    const testToken = 'So11111111111111111111111111111111111111112'; // SOL token
    logger.info('Testing token analysis...', { token: testToken });

    const analysis = await tokenAnalyzer.analyzeToken(testToken);
    logger.info('Token analysis result:', { analysis });

    // Test monitoring
    logger.info('Testing monitoring service...');
    await monitoringService.addToken(testToken, process.env.ADMIN_CHAT_ID!);
    logger.info('Token added to monitoring');

    // Keep the process running
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

    logger.info('Test completed successfully. Bot is running...');

  } catch (error) {
    logger.error('Test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
}

// Run the test
testBot(); 