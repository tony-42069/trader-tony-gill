import { 
  Position, 
  PositionManager, 
  PositionStatus, 
  PositionMonitor, 
  PositionType,
  PositionUpdate,
  ExitReason,
  PositionConfig,
  PositionSizingMethod
} from './types';
import { RaydiumClient } from '../../utils/raydium/client';
import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { PublicKey } from '@solana/web3.js';

export class PositionManagerImpl implements PositionManager {
  private positions: Map<string, Position> = new Map();
  private monitor: PositionMonitor;

  constructor(
    private raydiumClient: RaydiumClient,
    private tokenAnalyzer: TokenAnalyzerImpl,
    monitor: PositionMonitor
  ) {
    this.monitor = monitor;
  }

  async createPosition(
    tokenAddress: string | PublicKey,
    amount: number,
    config: Partial<PositionConfig>
  ): Promise<Position> {
    const analysis = await this.tokenAnalyzer.analyzeToken(tokenAddress);
    
    const position: Position = {
      id: uuidv4(),
      type: PositionType.LONG,
      status: PositionStatus.OPEN,
      tokenAddress: tokenAddress.toString(),
      poolAddress: analysis.poolAddress || '',
      quoteMint: 'So11111111111111111111111111111111111111112', // Native SOL mint
      tokenSymbol: analysis.metadata.symbol,

      // Entry data
      entryPrice: analysis.price.price,
      entryAmount: amount,
      entryValue: amount * analysis.price.price,
      entryTxHash: '', // Will be set after transaction
      entryTimestamp: new Date(),

      // Current state
      currentPrice: analysis.price.price,
      currentValue: amount * analysis.price.price,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,

      // Risk management
      takeProfit: config.takeProfit,
      stopLoss: config.stopLoss,
      trailingStop: config.trailingStop,
      trailingStopDistance: undefined,

      // Metadata
      riskScore: analysis.risk.score,
      tags: [],
      lastUpdated: new Date(),

      // Required by interface
      amount,
      pnl: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.positions.set(position.id, position);
    await this.monitor.startMonitoring(position);

    logger.info('Position created', {
      positionId: position.id,
      token: position.tokenAddress,
      symbol: position.tokenSymbol,
      amount: position.amount,
      entryPrice: position.entryPrice
    });

    return position;
  }

  async updatePosition(id: string): Promise<PositionUpdate> {
    const position = await this.getPosition(id);
    if (!position) {
      throw new Error(`Position ${id} not found`);
    }

    const analysis = await this.tokenAnalyzer.analyzeToken(position.tokenAddress);
    const currentPrice = analysis.price.price;
    const currentValue = position.amount * currentPrice;
    const unrealizedPnl = currentValue - position.entryValue;
    const unrealizedPnlPercent = (unrealizedPnl / position.entryValue) * 100;

    // Check if we should exit based on take-profit/stop-loss
    let shouldExit = false;
    let exitReason: ExitReason | undefined;

    if (position.takeProfit && currentPrice >= position.takeProfit) {
      shouldExit = true;
      exitReason = ExitReason.TAKE_PROFIT;
    } else if (position.stopLoss && currentPrice <= position.stopLoss) {
      shouldExit = true;
      exitReason = ExitReason.STOP_LOSS;
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
  }

  async closePosition(id: string, reason?: ExitReason): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw new Error(`Position ${id} not found`);
    }

    const analysis = await this.tokenAnalyzer.analyzeToken(position.tokenAddress);
    const exitPrice = analysis.price.price;
    const exitValue = position.amount * exitPrice;
    const realizedPnl = exitValue - position.entryValue;
    const realizedPnlPercent = (realizedPnl / position.entryValue) * 100;

    const closedPosition: Position = {
      ...position,
      status: PositionStatus.CLOSED,
      currentPrice: exitPrice,
      currentValue: exitValue,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      exitPrice,
      exitAmount: position.amount,
      exitValue,
      exitTimestamp: new Date(),
      exitReason: reason || ExitReason.MANUAL,
      realizedPnl,
      realizedPnlPercent,
      pnl: realizedPnl,
      updatedAt: new Date()
    };

    this.positions.set(id, closedPosition);
    await this.monitor.stopMonitoring(id);

    logger.info('Position closed', {
      positionId: id,
      token: position.tokenAddress,
      exitPrice,
      realizedPnl,
      reason: closedPosition.exitReason
    });

    return closedPosition;
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
    // TODO: Implement position sizing calculations
    return 0;
  }

  async updateStopLoss(id: string, price: number): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw new Error(`Position ${id} not found`);
    }

    const updatedPosition: Position = {
      ...position,
      stopLoss: price,
      updatedAt: new Date()
    };

    this.positions.set(id, updatedPosition);
    await this.monitor.updateTriggers(updatedPosition);

    return updatedPosition;
  }

  async updateTakeProfit(id: string, price: number): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw new Error(`Position ${id} not found`);
    }

    const updatedPosition: Position = {
      ...position,
      takeProfit: price,
      updatedAt: new Date()
    };

    this.positions.set(id, updatedPosition);
    await this.monitor.updateTriggers(updatedPosition);

    return updatedPosition;
  }

  async updateTrailingStop(id: string, distance: number): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw new Error(`Position ${id} not found`);
    }

    const updatedPosition: Position = {
      ...position,
      trailingStop: position.currentPrice - distance,
      trailingStopDistance: distance,
      updatedAt: new Date()
    };

    this.positions.set(id, updatedPosition);
    await this.monitor.updateTriggers(updatedPosition);

    return updatedPosition;
  }

  async getPosition(id: string): Promise<Position | null> {
    const position = this.positions.get(id);
    if (!position) return null;

    // Update current price and PnL
    const analysis = await this.tokenAnalyzer.analyzeToken(position.tokenAddress);
    const currentPrice = analysis.price.price;
    const currentValue = position.amount * currentPrice;
    const unrealizedPnl = currentValue - position.entryValue;
    const unrealizedPnlPercent = (unrealizedPnl / position.entryValue) * 100;

    const updatedPosition: Position = {
      ...position,
      currentPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      pnl: position.status === PositionStatus.CLOSED ? position.realizedPnl || 0 : unrealizedPnl,
      updatedAt: new Date()
    };

    this.positions.set(id, updatedPosition);
    return updatedPosition;
  }

  async getAllPositions(): Promise<Position[]> {
    const positions = Array.from(this.positions.values());
    return Promise.all(
      positions.map(position => this.getPosition(position.id))
    ).then(positions => positions.filter((p): p is Position => p !== null));
  }

  async getOpenPositions(): Promise<Position[]> {
    const positions = await this.getAllPositions();
    return positions.filter(p => p.status === PositionStatus.OPEN);
  }

  async emergencyExit(positionId: string): Promise<Position> {
    return this.closePosition(positionId, ExitReason.ERROR);
  }

  async openPosition(params: {
    tokenAddress: string;
    amount: number;
    entryPrice: number;
    takeProfit?: number;
    stopLoss?: number;
  }): Promise<Position> {
    return this.createPosition(
      params.tokenAddress,
      params.amount,
      {
        takeProfit: params.takeProfit,
        stopLoss: params.stopLoss
      }
    );
  }
} 