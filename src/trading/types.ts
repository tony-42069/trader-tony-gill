import { PublicKey } from '@solana/web3.js';
import { TokenAnalysis } from '../analysis';

export interface TradeConfig {
  maxSlippage: number;
  priorityFee: number;
  antiMev: boolean;
  autoTakeProfit?: number;
  autoStopLoss?: number;
  retryAttempts: number;
  retryDelay: number;
  confirmations: number;
}

export interface TradeParams {
  tokenAddress: string | PublicKey;
  amount: number;
  slippage?: number;
  priorityFee?: number;
  antiMev?: boolean;
  autoTakeProfit?: number;
  autoStopLoss?: number;
}

export interface TradeResult {
  success: boolean;
  transactionHash?: string;
  tokenAddress: string;
  amount: number;
  price: number;
  value: number;
  fee: number;
  timestamp: Date;
  error?: string;
}

export interface Position {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
  takeProfit?: number;
  stopLoss?: number;
  openedAt: Date;
  lastUpdated: Date;
}

export interface PositionUpdate {
  price: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
  lastUpdated: Date;
}

export interface SniperConfig extends TradeConfig {
  maxBuyTax: number;
  minLiquidity: number;
  requireVerified: boolean;
  requireRenounced: boolean;
  maxRiskScore: number;
}

export interface SniperParams extends TradeParams {
  waitForLiquidity?: boolean;
  maxWaitTime?: number;
  buyTaxThreshold?: number;
  liquidityThreshold?: number;
  riskScoreThreshold?: number;
}

export interface SniperResult extends TradeResult {
  analysis: TokenAnalysis;
  liquidityFound?: boolean;
  waitTime?: number;
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
  SNIPE = 'snipe'
}

export enum TradeStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PositionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  TAKE_PROFIT = 'take_profit',
  STOP_LOSS = 'stop_loss'
}

export enum TradeErrorCode {
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  INSUFFICIENT_LIQUIDITY = 'insufficient_liquidity',
  PRICE_IMPACT_HIGH = 'price_impact_high',
  SLIPPAGE_EXCEEDED = 'slippage_exceeded',
  TRANSACTION_FAILED = 'transaction_failed',
  TIMEOUT = 'timeout',
  INVALID_TOKEN = 'invalid_token',
  HIGH_RISK = 'high_risk',
  UNKNOWN = 'unknown'
}

export interface Trader {
  buy(params: TradeParams): Promise<TradeResult>;
  sell(params: TradeParams): Promise<TradeResult>;
  snipe(params: SniperParams): Promise<SniperResult>;
  getPosition(tokenAddress: string | PublicKey): Promise<Position | null>;
  getAllPositions(): Promise<Position[]>;
  updatePosition(tokenAddress: string | PublicKey): Promise<PositionUpdate>;
  closePosition(tokenAddress: string | PublicKey): Promise<TradeResult>;
}
