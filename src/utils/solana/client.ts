import { Connection, Transaction, PublicKey, TransactionSignature, VersionedTransaction } from '@solana/web3.js';
import { config } from '../../config/settings';
import { logger, createLogContext } from '../logger';
import {
  SolanaClient,
  ConnectionConfig,
  HealthCheckResult,
  SolanaError,
  SolanaErrorCodes,
  SolanaCommitment
} from './types';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;

export class SolanaClientImpl implements SolanaClient {
  private rpcConnection: Connection;
  private endpoint: string;
  private commitment: SolanaCommitment;
  private timeout: number;
  private maxRetries: number;
  private priorityFee: number;

  constructor(config: ConnectionConfig) {
    this.endpoint = config.endpoint;
    this.commitment = config.commitment;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES;
    this.priorityFee = config.priorityFee || 0;

    // Initialize direct connection instead of using Gill's createSolanaClient
    this.rpcConnection = new Connection(this.endpoint, {
      commitment: this.commitment,
      confirmTransactionInitialTimeout: this.timeout
    });
  }

  async getLatestBlockhash() {
    try {
      const { blockhash, lastValidBlockHeight } = await this.rpcConnection.getLatestBlockhash({
        commitment: this.commitment
      });
      return { blockhash, lastValidBlockHeight };
    } catch (error) {
      throw new SolanaError(
        'Failed to get latest blockhash',
        SolanaErrorCodes.BLOCKHASH_NOT_FOUND,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      return await this.rpcConnection.getBalance(publicKey, {
        commitment: this.commitment
      });
    } catch (error) {
      throw new SolanaError(
        'Failed to get balance',
        SolanaErrorCodes.CONNECTION_FAILED,
        { publicKey: publicKey.toString(), error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async sendAndConfirmTransaction(transaction: Transaction): Promise<TransactionSignature> {
    const context = createLogContext();
    const startTime = Date.now();

    try {
      // Add priority fee if configured
      if (this.priorityFee > 0) {
        transaction.recentBlockhash = (await this.getLatestBlockhash()).blockhash;
        transaction.feePayer = transaction.feePayer || transaction.signatures[0].publicKey;
      }

      // Convert legacy transaction to versioned transaction if needed
      const versionedTx = transaction instanceof VersionedTransaction 
        ? transaction 
        : new VersionedTransaction(transaction.compileMessage());
      
      const signature = await this.rpcConnection.sendTransaction(versionedTx, {
        maxRetries: this.maxRetries,
        skipPreflight: false
      });
      
      // Wait for confirmation
      const confirmation = await this.rpcConnection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: (await this.getLatestBlockhash()).lastValidBlockHeight
      }, this.commitment);

      if (confirmation.value.err) {
        throw new SolanaError(
          'Transaction failed to confirm',
          SolanaErrorCodes.TRANSACTION_FAILED,
          { signature, error: confirmation.value.err }
        );
      }

      const duration = Date.now() - startTime;
      logger.info('Transaction confirmed', {
        signature,
        duration,
        slot: confirmation.context.slot
      });

      return signature;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Transaction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      throw new SolanaError(
        'Failed to send transaction',
        SolanaErrorCodes.TRANSACTION_FAILED,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const version = await this.rpcConnection.getVersion();
      const slot = await this.rpcConnection.getSlot();
      const latency = Date.now() - startTime;

      return {
        isHealthy: true,
        latency,
        slot,
        version: version['solana-core']
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        isHealthy: false,
        latency,
        slot: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  withCommitment(commitment: SolanaCommitment): SolanaClient {
    return new SolanaClientImpl({
      endpoint: this.endpoint,
      commitment,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      priorityFee: this.priorityFee
    });
  }
}

// Create default client instance
export const createDefaultSolanaClient = (
  commitment: SolanaCommitment = 'confirmed'
): SolanaClient => {
  return new SolanaClientImpl({
    endpoint: config.solana.rpcUrl,
    commitment,
    timeout: DEFAULT_TIMEOUT,
    maxRetries: DEFAULT_MAX_RETRIES,
    priorityFee: config.trading.priorityFee
  });
};
