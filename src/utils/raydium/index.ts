import { Connection, PublicKey } from '@solana/web3.js';
import { RaydiumClient } from './client';
import { RaydiumPool } from './pool';
import {
  RaydiumPoolState,
  SwapParams,
  SwapResult
} from './types';
import {
  RaydiumError,
  PoolStateChange,
  PoolStatus,
  BigNumber
} from './pool';

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
  SwapParams,
  SwapResult,
  PoolStateChange,
  PoolStatus,
  BigNumber
};

// Re-export BN for convenience
export { default as BN } from 'bn.js';
