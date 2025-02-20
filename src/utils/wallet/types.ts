import { PublicKey, Transaction } from '@solana/web3.js';
import { LogContext } from '../logger';

export type Network = 'mainnet-beta' | 'testnet' | 'devnet';

export interface WalletConfig {
  seedPhrase: string;
  derivationPath?: string;
  network: Network;
  balanceThresholds: {
    minimum: number;    // Minimum SOL to maintain
    warning: number;    // Threshold for low balance warning
    maximum: number;    // Maximum SOL to hold
  };
  monitoringInterval?: number; // Milliseconds between balance checks
}

export interface WalletState {
  publicKey: string;
  balance: number;
  lastUpdated: number;
  isActive: boolean;
  transactions: TransactionHistory[];
}

export type TransactionType = 'send' | 'receive' | 'trade' | 'swap' | 'stake' | 'unstake';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TransactionHistory {
  signature: string;
  type: TransactionType;
  amount: number;
  timestamp: number;
  status: TransactionStatus;
  error?: string;
  token?: string;      // Token address if not SOL
  counterparty?: string; // Recipient/sender address
  fee?: number;        // Transaction fee
  slot?: number;       // Confirmation slot
}

export interface TransactionOptions {
  maxRetries?: number;
  priorityFee?: number;
  skipPreflight?: boolean;
  context?: LogContext;
}

// Custom error types
export const WalletErrorCodes = {
  INITIALIZATION_FAILED: 'WALLET_INIT_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_TRANSACTION: 'INVALID_TRANSACTION',
  SIGNING_FAILED: 'SIGNING_FAILED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  THRESHOLD_EXCEEDED: 'THRESHOLD_EXCEEDED',
  MONITORING_ERROR: 'MONITORING_ERROR'
} as const;

export type WalletErrorCode = typeof WalletErrorCodes[keyof typeof WalletErrorCodes];

export class WalletError extends Error {
  constructor(
    message: string,
    public code: WalletErrorCode,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'WalletError';
    Object.setPrototypeOf(this, WalletError.prototype);
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

// Interfaces for the wallet manager
export interface WalletManager {
  getPublicKey(): PublicKey;
  getBalance(): Promise<number>;
  signTransaction(transaction: Transaction, options?: TransactionOptions): Promise<Transaction>;
  validateTransaction(transaction: Transaction): Promise<boolean>;
  getState(): WalletState;
  isActive(): boolean;
  getTransactionHistory(): TransactionHistory[];
}

// Interfaces for the balance monitor
export interface BalanceMonitor {
  startMonitoring(): void;
  stopMonitoring(): void;
  checkBalance(): Promise<number>;
  getLastCheck(): number;
  isMonitoring(): boolean;
  destroy(): void;
}

// Event types for monitoring
export type BalanceChangeEvent = {
  oldBalance: number;
  newBalance: number;
  change: number;
  timestamp: number;
};

export type ThresholdAlertEvent = {
  balance: number;
  threshold: 'minimum' | 'warning' | 'maximum';
  timestamp: number;
};
