import { PublicKey } from '@solana/web3.js';
import { v4 as uuidv4 } from 'uuid';
import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { TraderImpl } from '../trader';
import { WalletManagerImpl } from '../../utils/wallet/wallet';
import { logger } from '../../utils/logger';
import { config } from '../../config/settings';
import { PositionError } from './errors';
import { PositionSizer } from './sizing';
import {
  Position,
  PositionConfig,
  PositionManager,
  PositionStatus,
  PositionType,
  PositionUpdate,
  ExitReason,
  PositionSizingMethod
} from './types';

export class PositionManagerImpl implements PositionManager {
  private positions: Map<string, Position>;
  private positionSizer: PositionSizer;

  constructor(
    private tokenAnalyzer: TokenAnalyzerImpl,
    private trader: TraderImpl,
    private walletManager: WalletManagerImpl,
    private config: {
      maxPositionSize: number;
      minPositionSize: number;
      maxPositionValue: number;
      defaultRiskPerTrade: number;
      defaultWinRate: number;
      defaultKellyFraction: number;
      volatilityMultiplier: number;
    }
  ) {
    this.positions = new Map();
    this.positionSizer = new PositionSizer(tokenAnalyzer, config);
  }

  async createPosition(
    tokenAddress: string | PublicKey,
    amount: number,
    config: Partial<PositionConfig>
  ): Promise<Position> {
    const address = tokenAddress.toString();

    try {
      // Get token analysis
      const analysis = await this.tokenAnalyzer.analyzeToken(address, {
        includePrice: true,
        includeRisk: true
      });

      // Calculate position size if not provided
      if (!amount) {
        const balance = await this.walletManager.getBalance();
        amount = await this.positionSizer.calculateSize(
          address,
          config.positionSizingMethod || PositionSizingMethod.RISK_BASED,
          {
            riskAmount: config.maxPositionValue,
            availableBalance: balance
          }
        );
      }

      // Execute trade
      const trade = await this.trader.buy({
        tokenAddress: address,
        amount,
        slippage: config.maxSlippage
      });

      // Create position
      const position: Position = {
        id: uuidv4(),
        type: PositionType.LONG,
        status: PositionStatus.OPEN,
        tokenAddress: address,
        tokenSymbol: analysis.metadata.symbol,

        // Entry data
        entryPrice: trade.price,
        entryAmount: trade.amount,
        entryValue: trade.value,
        entryTxHash: trade.transactionHash!,
        entryTimestamp: trade.timestamp,

        // Current state
        currentPrice: trade.price,
        currentValue: trade.value,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,

        // Risk management
        takeProfit: config.takeProfit,
        stopLoss: config.stopLoss,
        trailingStop: config.trailingStop,

        // Metadata
        riskScore: analysis.risk.score,
        tags: [],
        lastUpdated: new Date()
      };

      // Store position
      this.positions.set(position.id, position);

      logger.info('Position created:', {
        id: position.id,
        token: position.tokenSymbol,
        amount: position.entryAmount,
        price: position.entryPrice
      });

      return position;

    } catch (error) {
      logger.error('Failed to create position:', {
        address,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getPosition(id: string): Promise<Position | null> {
    return this.positions.get(id) || null;
  }

  async getAllPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async getOpenPositions(): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(
      p => p.status === PositionStatus.OPEN
    );
  }

  async updatePosition(id: string): Promise<PositionUpdate> {
    const position = await this.getPosition(id);
    if (!position) {
      throw PositionError.positionNotFound(id);
    }

    if (position.status !== PositionStatus.OPEN) {
      throw PositionError.positionAlreadyClosed(id);
    }

    try {
      // Get current price
      const analysis = await this.tokenAnalyzer.analyzeToken(position.tokenAddress, {
        includePrice: true
      });

      const currentPrice = analysis.price.price;
      const currentValue = position.entryAmount * currentPrice;
      
      // Calculate PnL
      const unrealizedPnl = currentValue - position.entryValue;
      const unrealizedPnlPercent = (unrealizedPnl / position.entryValue) * 100;

      // Update position state
      position.currentPrice = currentPrice;
      position.currentValue = currentValue;
      position.unrealizedPnl = unrealizedPnl;
      position.unrealizedPnlPercent = unrealizedPnlPercent;
      position.lastUpdated = new Date();

      // Check if we should exit
      let shouldExit = false;
      let exitReason: ExitReason | undefined;

      // Check take profit
      if (position.takeProfit && unrealizedPnlPercent >= position.takeProfit) {
        shouldExit = true;
        exitReason = ExitReason.TAKE_PROFIT;
      }

      // Check stop loss
      if (position.stopLoss && unrealizedPnlPercent <= -position.stopLoss) {
        shouldExit = true;
        exitReason = ExitReason.STOP_LOSS;
      }

      // Check trailing stop
      if (
        position.trailingStop &&
        position.trailingStopDistance &&
        unrealizedPnlPercent <= position.trailingStopDistance
      ) {
        shouldExit = true;
        exitReason = ExitReason.STOP_LOSS;
      }

      // Update trailing stop if needed
      if (position.trailingStop && unrealizedPnlPercent > 0) {
        const newStopDistance = unrealizedPnlPercent - position.trailingStop;
        if (!position.trailingStopDistance || newStopDistance > position.trailingStopDistance) {
          position.trailingStopDistance = newStopDistance;
        }
      }

      return {
        price: currentPrice,
        value: currentValue,
        unrealizedPnl,
        unrealizedPnlPercent,
        shouldExit,
        exitReason,
        timestamp: new Date()
      };

    } catch (error) {
      throw PositionError.updateFailed(id, error as Error);
    }
  }

  async closePosition(id: string, reason?: ExitReason): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw PositionError.positionNotFound(id);
    }

    if (position.status !== PositionStatus.OPEN) {
      throw PositionError.positionAlreadyClosed(id);
    }

    try {
      // Execute sell
      const trade = await this.trader.sell({
        tokenAddress: position.tokenAddress,
        amount: position.entryAmount
      });

      // Update position
      position.status = PositionStatus.CLOSED;
      position.exitPrice = trade.price;
      position.exitAmount = trade.amount;
      position.exitValue = trade.value;
      position.exitTxHash = trade.transactionHash!;
      position.exitTimestamp = trade.timestamp;
      position.exitReason = reason || ExitReason.MANUAL;
      position.realizedPnl = trade.value - position.entryValue;
      position.realizedPnlPercent = (position.realizedPnl / position.entryValue) * 100;
      position.lastUpdated = new Date();

      logger.info('Position closed:', {
        id: position.id,
        token: position.tokenSymbol,
        pnl: position.realizedPnlPercent.toFixed(2) + '%',
        reason: position.exitReason
      });

      return position;

    } catch (error) {
      throw PositionError.closeFailed(id, error as Error);
    }
  }

  async calculatePositionSize(
    tokenAddress: string | PublicKey,
    method: PositionSizingMethod,
    params: {
      riskAmount?: number;
      winRate?: number;
      kelly?: number;
    }
  ): Promise<number> {
    const balance = await this.walletManager.getBalance();
    return this.positionSizer.calculateSize(tokenAddress, method, {
      ...params,
      availableBalance: balance
    });
  }

  async updateStopLoss(id: string, price: number): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw PositionError.positionNotFound(id);
    }

    if (position.status !== PositionStatus.OPEN) {
      throw PositionError.positionAlreadyClosed(id);
    }

    if (price >= position.entryPrice) {
      throw PositionError.invalidStopPrice(price, position.entryPrice);
    }

    position.stopLoss = ((position.entryPrice - price) / position.entryPrice) * 100;
    position.lastUpdated = new Date();

    return position;
  }

  async updateTakeProfit(id: string, price: number): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw PositionError.positionNotFound(id);
    }

    if (position.status !== PositionStatus.OPEN) {
      throw PositionError.positionAlreadyClosed(id);
    }

    if (price <= position.entryPrice) {
      throw PositionError.invalidTakeProfit(price, position.entryPrice);
    }

    position.takeProfit = ((price - position.entryPrice) / position.entryPrice) * 100;
    position.lastUpdated = new Date();

    return position;
  }

  async updateTrailingStop(id: string, distance: number): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw PositionError.positionNotFound(id);
    }

    if (position.status !== PositionStatus.OPEN) {
      throw PositionError.positionAlreadyClosed(id);
    }

    if (distance <= 0) {
      throw new Error('Trailing stop distance must be positive');
    }

    position.trailingStop = distance;
    position.trailingStopDistance = undefined; // Reset distance to recalculate
    position.lastUpdated = new Date();

    return position;
  }
}
