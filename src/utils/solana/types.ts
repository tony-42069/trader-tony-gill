import { Connection, PublicKey, Transaction, TransactionSignature, AccountInfo, ParsedAccountData, TransactionResponse } from '@solana/web3.js';
import { LogContext } from '../logger';

export interface TokenAmount {
  amount: string;
  decimals: number;
  uiAmount: number | null;
  uiAmountString: string;
}

export interface SolanaClient {
  getLatestBlockhash: () => Promise<{ blockhash: string; lastValidBlockHeight: number }>;
  getBalance: (publicKey: PublicKey) => Promise<number>;
  sendAndConfirmTransaction: (transaction: Transaction) => Promise<TransactionSignature>;
  checkHealth: () => Promise<HealthCheckResult>;
  withCommitment: (commitment: SolanaCommitment) => SolanaClient;
  getAccountInfo(address: PublicKey): Promise<AccountInfo<Buffer> | null>;
  getTokenSupply(mint: PublicKey): Promise<{ amount: number; decimals: number }>;
  getTokenLargestAccounts(mint: PublicKey): Promise<{ address: PublicKey; amount: TokenAmount }[]>;
  getRecentTransactions(address: PublicKey): Promise<TransactionResponse[]>;
  getTokenAccountsByOwner(owner: PublicKey): Promise<Array<{
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
  }>>;
  sendTransaction(transaction: Transaction): Promise<string>;
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

export enum SolanaCommitment {
  PROCESSED = 'processed',
  CONFIRMED = 'confirmed',
  FINALIZED = 'finalized'
}

export enum SolanaErrorCodes {
  TRANSACTION_FAILED = 'TransactionFailed',
  TIMEOUT = 'Timeout',
  INVALID_ADDRESS = 'InvalidAddress',
  INSUFFICIENT_FUNDS = 'InsufficientFunds',
  UNKNOWN = 'Unknown'
}

export class SolanaError extends Error {
  constructor(
    public readonly code: SolanaErrorCodes,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SolanaError';
  }
}
