import { BotConfig, BotContext } from './types';
import { TraderTonyBot } from './bot';
import { SniperService } from '../trading/sniper/types';
import { PositionManager } from '../trading/position/types';
import { logger } from '../utils/logger';
import { SolanaClientImpl } from '../utils/solana/client';
import { WalletManagerImpl } from '../utils/wallet/wallet';
import { TokenAnalyzerImpl } from '../analysis/analyzer';
import { TraderImpl } from '../trading/trader';
import { MonitoringServiceImpl } from '../trading/monitor';

export function createBot(
  config: BotConfig,
  solanaClient: SolanaClientImpl,
  walletManager: WalletManagerImpl,
  tokenAnalyzer: TokenAnalyzerImpl,
  trader: TraderImpl,
  monitoringService: MonitoringServiceImpl,
  sniperService: SniperService,
  positionManager: PositionManager
): TraderTonyBot {
  try {
    const context: BotContext = {
      config,
      logger,
      solanaClient,
      walletManager,
      tokenAnalyzer,
      trader,
      monitoringService,
      sniperService,
      positionManager
    };

    logger.info('Creating bot instance with config:', {
      adminChatId: config.adminChatId,
      defaultSlippage: config.defaultSlippage,
      defaultMinLiquidity: config.defaultMinLiquidity,
      maxRiskScore: config.maxRiskScore,
      sandwichProtection: config.sandwichProtection,
      simulateFirst: config.simulateFirst
    });

    return new TraderTonyBot(context);

  } catch (error) {
    logger.error('Failed to create bot:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export function createDefaultConfig(
  token: string,
  adminChatId: string
): BotConfig {
  return {
    token,
    adminChatId,
    network: process.env.NETWORK || 'mainnet-beta',
    defaultSlippage: 1.0, // 1%
    defaultMinLiquidity: 1.0, // 1 SOL
    maxRiskScore: 70,
    sandwichProtection: true,
    simulateFirst: true,
    maxPendingTransactions: 1,
    maxBlockAge: 150,
    retryAttempts: 3,
    priorityFee: 0.000001,
    computeUnits: 200000,
    maxGasPrice: 100000,
    maxExecutionTime: 60000,
    minConfirmations: 1
  };
} 