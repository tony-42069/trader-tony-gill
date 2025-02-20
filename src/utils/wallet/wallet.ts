import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import { createDefaultSolanaClient } from '../solana';
import { logger, createLogContext } from '../logger';
import {
  WalletConfig,
  WalletState,
  WalletManager,
  TransactionHistory,
  TransactionOptions,
  WalletError,
  WalletErrorCodes
} from './types';

const DEFAULT_MONITORING_INTERVAL = 60000; // 1 minute

export class WalletManagerImpl implements WalletManager {
  private wallet!: Keypair;
  private state!: WalletState;
  private solanaClient = createDefaultSolanaClient();
  private logContext = createLogContext();

  constructor(private config: WalletConfig) {
    this.initializeWallet();
    if (!this.wallet || !this.state) {
      throw new WalletError(
        'Wallet initialization failed',
        WalletErrorCodes.INITIALIZATION_FAILED,
        { reason: 'Wallet or state not properly initialized' }
      );
    }
  }

  private initializeWallet(): void {
    try {
      // Convert seed phrase to buffer
      const seed = Buffer.from(this.config.seedPhrase, 'hex');
      this.wallet = Keypair.fromSeed(seed);

      this.state = {
        publicKey: this.wallet.publicKey.toString(),
        balance: 0,
        lastUpdated: Date.now(),
        isActive: true,
        transactions: []
      };

      logger.info('Wallet initialized', {
        publicKey: this.state.publicKey,
        network: this.config.network
      });

      // Initial balance check
      this.updateBalance().catch(error => {
        logger.error('Failed to get initial balance', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    } catch (error) {
      throw new WalletError(
        'Failed to initialize wallet',
        WalletErrorCodes.INITIALIZATION_FAILED,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  private async updateBalance(): Promise<void> {
    try {
      const balance = await this.solanaClient.getBalance(this.wallet.publicKey);
      const oldBalance = this.state.balance;

      this.state = {
        ...this.state,
        balance,
        lastUpdated: Date.now()
      };

      if (balance !== oldBalance) {
        logger.info('Balance updated', {
          oldBalance,
          newBalance: balance,
          change: balance - oldBalance
        });

        this.checkBalanceThresholds(balance);
      }
    } catch (error) {
      logger.error('Failed to update balance', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private checkBalanceThresholds(balance: number): void {
    const { minimum, warning, maximum } = this.config.balanceThresholds;

    if (balance < minimum) {
      logger.warn('Balance below minimum threshold', {
        balance,
        minimum,
        publicKey: this.state.publicKey
      });
    } else if (balance < warning) {
      logger.warn('Balance below warning threshold', {
        balance,
        warning,
        publicKey: this.state.publicKey
      });
    } else if (balance > maximum) {
      logger.warn('Balance above maximum threshold', {
        balance,
        maximum,
        publicKey: this.state.publicKey
      });
    }
  }

  private updateTransactionHistory(tx: TransactionHistory): void {
    this.state.transactions.unshift(tx);
    // Keep last 100 transactions
    if (this.state.transactions.length > 100) {
      this.state.transactions.pop();
    }
  }

  // Public interface implementation
  getPublicKey(): PublicKey {
    return this.wallet.publicKey;
  }

  async getBalance(): Promise<number> {
    await this.updateBalance();
    return this.state.balance;
  }

  async signTransaction(
    transaction: Transaction,
    options: TransactionOptions = {}
  ): Promise<Transaction> {
    try {
      // Validate transaction before signing
      const isValid = await this.validateTransaction(transaction);
      if (!isValid) {
        throw new WalletError(
          'Transaction validation failed',
          WalletErrorCodes.INVALID_TRANSACTION
        );
      }

      // Add priority fee if specified
      if (options.priorityFee) {
        const { blockhash } = await this.solanaClient.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;
      }

      // Sign the transaction
      transaction.sign(this.wallet);

      // Update transaction history
      this.updateTransactionHistory({
        signature: transaction.signature?.toString() || 'unknown',
        type: 'send', // Default type, should be updated based on actual transaction type
        amount: 0, // Should be calculated based on transaction data
        timestamp: Date.now(),
        status: 'pending',
        fee: 0 // Should be calculated based on transaction data
      });

      return transaction;
    } catch (error) {
      throw new WalletError(
        'Failed to sign transaction',
        WalletErrorCodes.SIGNING_FAILED,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async validateTransaction(transaction: Transaction): Promise<boolean> {
    try {
      // Basic validation
      if (!transaction.feePayer) {
        transaction.feePayer = this.wallet.publicKey;
      }

      // Ensure we have a recent blockhash
      if (!transaction.recentBlockhash) {
        const { blockhash } = await this.solanaClient.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
      }

      // Verify we have enough balance for the transaction
      const balance = await this.getBalance();
      if (balance < this.config.balanceThresholds.minimum) {
        throw new WalletError(
          'Insufficient balance for transaction',
          WalletErrorCodes.INSUFFICIENT_BALANCE,
          { balance, minimum: this.config.balanceThresholds.minimum }
        );
      }

      return true;
    } catch (error) {
      if (error instanceof WalletError) {
        throw error;
      }
      throw new WalletError(
        'Transaction validation failed',
        WalletErrorCodes.INVALID_TRANSACTION,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  isActive(): boolean {
    return this.state.isActive;
  }

  getTransactionHistory(): TransactionHistory[] {
    return [...this.state.transactions];
  }
}

// Create default wallet instance
export const createWallet = (config: WalletConfig): WalletManager => {
  return new WalletManagerImpl(config);
};
