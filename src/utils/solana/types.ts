import { Connection, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import { LogContext } from '../logger';

export type SolanaCommitment = 'processed' | 'confirmed' | 'finalized';

export interface SolanaClient {
  getLatestBlockhash: () => Promise<{ blockhash: string; lastValidBlockHeight: number }>;
  getBalance: (publicKey: PublicKey) => Promise<number>;
  sendAndConfirmTransaction: (transaction: Transaction) => Promise<TransactionSignature>;
  checkHealth: () => Promise<HealthCheckResult>;
  withCommitment: (commitment: SolanaCommitment) => SolanaClient;
}

export interface TransactionOptions {
  maxRetries?: number;
  priorityFee?: number;
  context?: LogContext;
}

export interface HealthCheckResult {
  isHealthy: boolean;
  latency: number;
  slot: number;
  version?: string;
  error?: string;
}

export interface ConnectionConfig {
  endpoint: string;
  commitment: SolanaCommitment;
  timeout?: number;
  maxRetries?: number;
  priorityFee?: number;
}

export interface TransactionResult {
  signature: TransactionSignature;
  confirmationTime: number;
  slot: number;
  error?: string;
}

export interface TransactionError extends Error {
  code: string;
  txSignature?: string;
  instruction?: number;
}

// Custom error codes for Solana operations
export const SolanaErrorCodes = {
  CONNECTION_FAILED: 'SOLANA_CONNECTION_FAILED',
  TRANSACTION_FAILED: 'SOLANA_TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE: 'SOLANA_INSUFFICIENT_BALANCE',
  INVALID_INSTRUCTION: 'SOLANA_INVALID_INSTRUCTION',
  TIMEOUT: 'SOLANA_TIMEOUT',
  BLOCKHASH_NOT_FOUND: 'SOLANA_BLOCKHASH_NOT_FOUND',
  SIMULATION_FAILED: 'SOLANA_SIMULATION_FAILED'
} as const;

export type SolanaErrorCode = typeof SolanaErrorCodes[keyof typeof SolanaErrorCodes];

// Custom error class for Solana operations
export class SolanaError extends Error {
  constructor(
    message: string,
    public code: SolanaErrorCode,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'SolanaError';
    Object.setPrototypeOf(this, SolanaError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata
    };
  }
}
