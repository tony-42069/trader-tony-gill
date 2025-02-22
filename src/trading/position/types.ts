import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';

export enum PositionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PENDING = 'pending',
  FAILED = 'failed'
}

export enum PositionType {
  LONG = 'long',
  SHORT = 'short'
}

export enum ExitReason {
  TAKE_PROFIT = 'take_profit',
  STOP_LOSS = 'stop_loss',
  MANUAL = 'manual',
  ERROR = 'error'
}

export interface PositionConfig {
  // Entry settings
  maxSlippage: number;
  entryTimeout: number;
  gasLimit?: number;

  // Exit settings
  takeProfit?: number;
  stopLoss?: number;
  trailingStop?: number;

  // Position sizing
  maxPositionSize: number;
  minPositionSize: number;
  maxPositionValue: number;
  positionSizingMethod: PositionSizingMethod;
}

export enum PositionSizingMethod {
  FIXED = 'fixed',           // Fixed position size
  RISK_BASED = 'risk_based', // Size based on risk per trade
  KELLY = 'kelly',           // Kelly criterion
  DYNAMIC = 'dynamic'        // Dynamic based on volatility/volume
}

export interface Position {
  id: string;
  type: PositionType;
  status: PositionStatus;
  tokenAddress: string;
  tokenSymbol: string;

  // Entry data
  entryPrice: number;
  entryAmount: number;
  entryValue: number;
  entryTxHash: string;
  entryTimestamp: Date;

  // Current state
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;

  // Exit data
  exitPrice?: number;
  exitAmount?: number;
  exitValue?: number;
  exitTxHash?: string;
  exitTimestamp?: Date;
  exitReason?: ExitReason;
  realizedPnl?: number;
  realizedPnlPercent?: number;

  // Risk management
  takeProfit?: number;
  stopLoss?: number;
  trailingStop?: number;
  trailingStopDistance?: number;

  // Metadata
  riskScore: number;
  tags: string[];
  notes?: string;
  lastUpdated: Date;
}

export interface PositionUpdate {
  price: number;
  value: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  shouldExit: boolean;
  exitReason?: ExitReason;
  timestamp: Date;
}

export interface PositionManager {
  // Position creation
  createPosition(
    tokenAddress: string | PublicKey,
    amount: number,
    config: Partial<PositionConfig>
  ): Promise<Position>;

  // Position management
  getPosition(id: string): Promise<Position | null>;
  getAllPositions(): Promise<Position[]>;
  getOpenPositions(): Promise<Position[]>;
  updatePosition(id: string): Promise<PositionUpdate>;
  closePosition(id: string, reason?: ExitReason): Promise<Position>;

  // Position sizing
  calculatePositionSize(
    tokenAddress: string | PublicKey,
    method: PositionSizingMethod,
    params: {
      riskAmount?: number;
      winRate?: number;
      kelly?: number;
    }
  ): Promise<number>;

  // Risk management
  updateStopLoss(id: string, price: number): Promise<Position>;
  updateTakeProfit(id: string, price: number): Promise<Position>;
  updateTrailingStop(id: string, distance: number): Promise<Position>;
}
