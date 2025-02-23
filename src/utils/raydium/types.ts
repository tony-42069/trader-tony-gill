import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';

// Type definition for BN instance
export type BigNumber = InstanceType<typeof BN>;

export interface RaydiumPoolState {
  // Pool info
  baseToken: PublicKey;
  quoteToken: PublicKey;
  lpToken: PublicKey;
  baseReserve: bigint;
  quoteReserve: bigint;
  lpSupply: bigint;

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
}

export interface RaydiumPoolConfig {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
}

export interface SwapParams {
  tokenIn: PublicKey;
  tokenOut: PublicKey;
  amountIn: number;
  minAmountOut: number;
  slippage: number;
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
  address: PublicKey;
  baseToken: PublicKey;
  quoteToken: PublicKey;
  lpToken: PublicKey;
  fetchPoolState(): Promise<RaydiumPoolState>;
}

export interface RaydiumClient {
  swapProgramId: PublicKey;
  getPool(tokenAddress: string): Promise<RaydiumPool | null>;
  createPool(baseToken: PublicKey, quoteToken: PublicKey): Promise<RaydiumPool>;
  swap(params: SwapParams): Promise<string>;
  addLiquidity(params: AddLiquidityParams): Promise<string>;
  removeLiquidity(params: RemoveLiquidityParams): Promise<string>;
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
