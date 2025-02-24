import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { BN } from 'bn.js';

// Type definition for BN instance
export type BigNumber = InstanceType<typeof BN>;

export interface RaydiumPoolState {
  // Pool info
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  baseReserve: BigNumber;
  quoteReserve: BigNumber;
  lpSupply: BigNumber;

  // Market data
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdated: Date;

  // Pool settings
  fees: {
    tradeFee: number;
    ownerTradeFee: number;
    ownerWithdrawFee: number;
  };
  status?: PoolStatus;
}

export interface RaydiumPoolConfig {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
}

export interface SwapParams {
  poolId: PublicKey;
  amountIn: BigNumber;
  minAmountOut: BigNumber;
  isBaseInput: boolean;
  slippage: number;
  walletPublicKey: PublicKey;
}

export interface PoolStateChange {
  poolId: string;
  baseReserveChange: number;
  quoteReserveChange: number;
  lpSupplyChange: number;
  timestamp: number;
}

export interface PoolMonitorConfig {
  updateInterval: number;
  priceChangeThreshold: number;
  liquidityChangeThreshold: number;
  maxPoolsToMonitor: number;
}

export interface SwapResult {
  signature: string;
  amountIn: BigNumber;
  amountOut: BigNumber;
  priceImpact: number;
  fee: BigNumber;
  timestamp: number;
}

export enum PoolStatus {
  Active = 1,
  Disabled = 0,
  Paused = 2
}

export class RaydiumError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RaydiumError';
  }
}

export interface RaydiumPool {
  id: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  state: RaydiumPoolState | null;
  getState(): Promise<RaydiumPoolState>;
  getReserves(): Promise<{ baseReserve: BigNumber; quoteReserve: BigNumber }>;
  isActive(): boolean;
  fetchPoolState(): Promise<RaydiumPoolState | null>;
}

export interface RaydiumClientInterface {
  readonly connection: Connection;
  readonly programId: PublicKey;
  
  createPool(config: RaydiumPoolConfig): Promise<RaydiumPool>;
  getPool(tokenAddress: string): Promise<RaydiumPool | undefined>;
  getAllPools(): RaydiumPool[];
  swap(params: SwapParams): Promise<SwapResult>;
  calculateSwap(poolState: RaydiumPoolState, amountIn: BigNumber, isBaseInput: boolean): {
    amountOut: BigNumber;
    priceImpact: number;
    fee: BigNumber;
  };
  calculatePriceImpact(
    amountIn: BigNumber,
    amountOut: BigNumber,
    inputReserve: BigNumber,
    outputReserve: BigNumber
  ): number;
  buildSwapTransaction(params: SwapParams, poolState: RaydiumPoolState): Promise<VersionedTransaction>;
}

export interface AddLiquidityParams {
  baseToken: PublicKey;
  quoteToken: PublicKey;
  baseAmount: number;
  quoteAmount: number;
  slippage: number;
}

export interface RemoveLiquidityParams {
  pool: RaydiumPool;
  lpAmount: number;
  minBaseAmount: number;
  minQuoteAmount: number;
}
