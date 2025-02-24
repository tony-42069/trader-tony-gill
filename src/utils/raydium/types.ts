import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface RaydiumPoolState {
  baseReserve: BN;
  quoteReserve: BN;
  lpSupply: BN;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  price: number;
  volume24h: number;
  liquidity: number;
  lastUpdated: Date;
  fees: {
    tradeFee: number;
    ownerTradeFee: number;
    ownerWithdrawFee: number;
  };
  status: number;
}

export interface RaydiumPool {
  id: string;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  baseDecimals: number;
  quoteDecimals: number;
  getState(): Promise<RaydiumPoolState>;
}

export interface RaydiumClient {
  getPool(tokenAddress: string): Promise<RaydiumPool | null>;
  getTokenPrice(tokenAddress: string): Promise<number | null>;
  getPools(): Promise<RaydiumPool[]>;
  findBestPool(tokenAddress: string): Promise<RaydiumPool | null>;
  getPoolByAddress(poolAddress: string): Promise<RaydiumPool | null>;
}

export interface SwapParams {
  tokenIn: PublicKey;
  tokenOut: PublicKey;
  amountIn: bigint;
  amountOutMin: bigint;
  pool: RaydiumPool;
}

export interface SwapResult {
  success: boolean;
  amountOut: bigint;
  fee: bigint;
  priceImpact: number;
}

export interface PoolConfig {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  version: number;
}

export interface PoolState {
  baseReserve: bigint;
  quoteReserve: bigint;
  lpSupply: bigint;
  lastUpdate: number;
}

export interface PoolInfo {
  config: PoolConfig;
  state: PoolState;
}
