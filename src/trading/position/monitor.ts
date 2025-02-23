import { Position, PositionMonitor, PositionStatus } from './types';
import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { RaydiumClient } from '../../utils/raydium/client';
import { logger } from '../../utils/logger';

export class PositionMonitorImpl implements PositionMonitor {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly CHECK_INTERVAL = 1000; // 1 second

  constructor(
    private tokenAnalyzer: TokenAnalyzerImpl,
    private raydiumClient: RaydiumClient
  ) {}

  async startMonitoring(position: Position): Promise<void> {
    if (this.monitoringIntervals.has(position.id)) {
      return; // Already monitoring
    }

    const interval = setInterval(
      () => this.checkPosition(position),
      this.CHECK_INTERVAL
    );

    this.monitoringIntervals.set(position.id, interval);
    logger.info('Started position monitoring', {
      positionId: position.id,
      token: position.tokenAddress
    });
  }

  async stopMonitoring(positionId: string): Promise<void> {
    const interval = this.monitoringIntervals.get(positionId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(positionId);
      logger.info('Stopped position monitoring', { positionId });
    }
  }

  async updateTriggers(position: Position): Promise<void> {
    // Just log the update, actual checking is done in checkPosition
    logger.info('Updated position triggers', {
      positionId: position.id,
      takeProfit: position.takeProfit,
      stopLoss: position.stopLoss
    });
  }

  private async checkPosition(position: Position): Promise<void> {
    try {
      // Get current price
      const analysis = await this.tokenAnalyzer.analyzeToken(position.tokenAddress);
      const currentPrice = analysis.price.price;

      // Calculate price change percentage
      const priceChange = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      // Check take profit
      if (
        position.takeProfit &&
        currentPrice >= position.takeProfit &&
        position.status === PositionStatus.OPEN
      ) {
        await this.executeTakeProfit(position, currentPrice);
        return;
      }

      // Check stop loss
      if (
        position.stopLoss &&
        currentPrice <= position.stopLoss &&
        position.status === PositionStatus.OPEN
      ) {
        await this.executeStopLoss(position, currentPrice);
        return;
      }

      // Log significant price changes
      if (Math.abs(priceChange) >= 5) {
        logger.info('Significant price change detected', {
          positionId: position.id,
          token: position.tokenAddress,
          priceChange: `${priceChange.toFixed(2)}%`,
          currentPrice
        });
      }

    } catch (error) {
      logger.error('Failed to check position:', {
        positionId: position.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async executeTakeProfit(position: Position, currentPrice: number): Promise<void> {
    try {
      logger.info('Take profit triggered', {
        positionId: position.id,
        token: position.tokenAddress,
        targetPrice: position.takeProfit,
        currentPrice
      });

      // Execute market sell
      const pool = await this.raydiumClient.createPool({
        id: position.poolAddress || '',
        baseMint: position.tokenAddress,
        quoteMint: position.quoteMint,
        lpMint: ''
      });

      // TODO: Execute actual sell order
      // For now, just log the intention
      logger.info('Would execute take profit sell', {
        positionId: position.id,
        token: position.tokenAddress,
        amount: position.amount,
        price: currentPrice
      });

      // Stop monitoring after take profit
      await this.stopMonitoring(position.id);

    } catch (error) {
      logger.error('Failed to execute take profit:', {
        positionId: position.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async executeStopLoss(position: Position, currentPrice: number): Promise<void> {
    try {
      logger.info('Stop loss triggered', {
        positionId: position.id,
        token: position.tokenAddress,
        targetPrice: position.stopLoss,
        currentPrice
      });

      // Execute market sell
      const pool = await this.raydiumClient.createPool({
        id: position.poolAddress || '',
        baseMint: position.tokenAddress,
        quoteMint: position.quoteMint,
        lpMint: ''
      });

      // TODO: Execute actual sell order
      // For now, just log the intention
      logger.info('Would execute stop loss sell', {
        positionId: position.id,
        token: position.tokenAddress,
        amount: position.amount,
        price: currentPrice
      });

      // Stop monitoring after stop loss
      await this.stopMonitoring(position.id);

    } catch (error) {
      logger.error('Failed to execute stop loss:', {
        positionId: position.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 