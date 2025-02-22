import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { TraderImpl } from '../trader';
import { WalletManagerImpl } from '../../utils/wallet/wallet';
import { logger } from '../../utils/logger';
import { config } from '../../config/settings';
import { PositionManagerImpl } from './service';

export * from './types';
export * from './errors';
export { PositionManagerImpl } from './service';
export { PositionSizer } from './sizing';

// Create position manager factory
export const createPositionManager = (
  tokenAnalyzer: TokenAnalyzerImpl,
  trader: TraderImpl,
  walletManager: WalletManagerImpl
) => {
  logger.info('Initializing position manager');

  return new PositionManagerImpl(
    tokenAnalyzer,
    trader,
    walletManager,
    {
      maxPositionSize: config.trading.maxBuyAmount,
      minPositionSize: config.trading.balanceThresholds.minimum,
      maxPositionValue: config.trading.maxBuyAmount * 10, // 10x max buy amount
      defaultRiskPerTrade: 1.0, // 1% risk per trade
      defaultWinRate: 55.0, // 55% win rate
      defaultKellyFraction: 0.5, // Half Kelly criterion
      volatilityMultiplier: 0.8 // 80% of calculated size for volatility adjustment
    }
  );
};
