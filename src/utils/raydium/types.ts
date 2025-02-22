import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';

// Type definition for BN instance
export type BigNumber = InstanceType<typeof BN>;

export interface RaydiumPoolState {
  id: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  baseDecimals: number;
  quoteDecimals: number;
  baseReserve: BigNumber;
  quoteReserve: BigNumber;
  lpSupply: BigNumber;
  startTime: BigNumber;
  status: number;
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
  walletPublicKey: PublicKey;  // User's wallet public key for transaction signing
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
