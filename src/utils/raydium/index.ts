import { Connection, PublicKey } from '@solana/web3.js';
import { RaydiumClient } from './client';
import { RaydiumPool } from './pool';
import {
  RaydiumError,
  RaydiumPoolState,
  RaydiumPoolConfig,
  SwapParams,
  SwapResult,
  PoolStateChange,
  PoolMonitorConfig,
  PoolStatus,
  BigNumber
} from './types';

// Raydium Program ID on Solana mainnet
export const RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

export const createRaydiumClient = (
  connection: Connection,
  programId: PublicKey = RAYDIUM_PROGRAM_ID
): RaydiumClient => {
  return new RaydiumClient(connection, programId);
};

export {
  RaydiumClient,
  RaydiumPool,
  RaydiumError,
  RaydiumPoolState,
  RaydiumPoolConfig,
  SwapParams,
  SwapResult,
  PoolStateChange,
  PoolMonitorConfig,
  PoolStatus,
  BigNumber
};

// Re-export BN for convenience
export { BN } from 'bn.js';
