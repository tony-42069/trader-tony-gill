import { config } from './config/settings';
import { createDefaultSolanaClient } from './utils/solana';
import { createWallet } from './utils/wallet';
import { logger } from './utils/logger';
import { TraderTonyBot } from './bot/core';
import { createCommands } from './bot/commands';
import { SolanaClientImpl } from './utils/solana/client';
import { WalletManagerImpl } from './utils/wallet/wallet';
import { createTokenAnalyzer } from './analysis';
import { createTrader } from './trading';
import { createMonitoringService, createTelegramAlertHandler } from './trading/monitor';
import { formatPnL } from './trading';

async function main() {
  try {
    // Initialize Solana client
    const solanaClient = createDefaultSolanaClient() as SolanaClientImpl;
    logger.info('Solana client initialized');

    // Initialize wallet manager
    const walletManager = createWallet({
      seedPhrase: config.solana.seedPhrase,
      network: config.solana.network,
      balanceThresholds: config.trading.balanceThresholds
    }) as WalletManagerImpl;
    logger.info('Wallet manager initialized');

    // Initialize token analyzer
    const tokenAnalyzer = createTokenAnalyzer(solanaClient);
    logger.info('Token analyzer initialized');

    // Initialize trader
    const trader = createTrader(solanaClient, walletManager, tokenAnalyzer);
    logger.info('Trader initialized');

    // Initialize bot
    const bot = new TraderTonyBot(
      {
        token: config.telegram.botToken,
        adminChatId: config.telegram.adminChatId,
        allowedUsers: config.telegram.allowedUsers
      },
      {
        logger,
        solanaClient,
        walletManager,
        tokenAnalyzer,
        trader,
        monitoringService: null as any // Temporary placeholder
      }
    );

    // Initialize monitoring service with Telegram alert handler
    const alertHandler = createTelegramAlertHandler(bot.getBot(), formatPnL);
    const monitoringService = createMonitoringService(tokenAnalyzer, alertHandler);
    await monitoringService.startMonitoring();
    logger.info('Monitoring service started');

    // Update bot context with monitoring service
    bot['context'].monitoringService = monitoringService;

    // Register commands
    const commands = createCommands(bot.getBot(), {
      logger,
      solanaClient,
      walletManager,
      tokenAnalyzer,
      trader,
      monitoringService
    });
    commands.forEach(command => bot.registerCommand(command));
    logger.info('Bot commands registered');

    // Start bot
    await bot.start();
    logger.info('TraderTony bot started successfully');

    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await monitoringService.stopMonitoring();
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
