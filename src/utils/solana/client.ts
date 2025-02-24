import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionSignature, 
  AccountInfo, 
  ParsedAccountData, 
  TransactionResponse,
  Commitment,
  VersionedTransaction,
  SendOptions,
  Signer
} from '@solana/web3.js';
import { 
  SolanaClient, 
  ConnectionConfig, 
  HealthCheckResult, 
  TokenAmount, 
  SolanaError, 
  SolanaErrorCodes 
} from './types';

export class SolanaClientImpl implements SolanaClient {
  private readonly rpcConnection: Connection;
  private readonly endpoint: string;
  private commitment: Commitment = 'confirmed';
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly priorityFee: number;

  constructor(config: ConnectionConfig) {
    this.endpoint = config.endpoint;
    this.commitment = config.commitment;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.priorityFee = config.priorityFee || 0;
    this.rpcConnection = new Connection(this.endpoint, {
      commitment: this.commitment,
      confirmTransactionInitialTimeout: this.timeout
    });
  }

  getConnection(): Connection {
    return this.rpcConnection;
  }

  async getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    try {
      return await this.rpcConnection.getLatestBlockhash();
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.UNKNOWN,
        `Failed to get latest blockhash: ${error}`
      );
    }
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      return await this.rpcConnection.getBalance(publicKey);
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.UNKNOWN,
        `Failed to get balance: ${error}`
      );
    }
  }

  async sendAndConfirmTransaction(transaction: Transaction): Promise<TransactionSignature> {
    try {
      const options: SendOptions = {
        preflightCommitment: this.commitment,
        maxRetries: this.maxRetries
      };
      return await this.rpcConnection.sendTransaction(transaction, [], options);
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.TRANSACTION_FAILED,
        `Transaction failed: ${error}`
      );
    }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      const slot = await this.rpcConnection.getSlot();
      const latency = Date.now() - start;

      const version = await this.rpcConnection.getVersion();

      return {
        isHealthy: true,
        latency,
        slot,
        version: version['solana-core']
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: 0,
        slot: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  withCommitment(commitment: Commitment): SolanaClient {
    this.commitment = commitment;
    return this;
  }

  async getAccountInfo(address: PublicKey): Promise<AccountInfo<Buffer> | null> {
    try {
      return await this.rpcConnection.getAccountInfo(address);
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.UNKNOWN,
        `Failed to get account info: ${error}`
      );
    }
  }

  async getTokenSupply(mint: PublicKey): Promise<{ amount: number; decimals: number }> {
    try {
      const info = await this.rpcConnection.getTokenSupply(mint);
      return {
        amount: info.value.uiAmount || 0,
        decimals: info.value.decimals
      };
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.UNKNOWN,
        `Failed to get token supply: ${error}`
      );
    }
  }

  async getTokenLargestAccounts(mint: PublicKey): Promise<{ address: PublicKey; amount: TokenAmount }[]> {
    try {
      const accounts = await this.rpcConnection.getTokenLargestAccounts(mint);
      return accounts.value.map(account => ({
        address: account.address,
        amount: {
          amount: account.amount,
          decimals: account.decimals,
          uiAmount: account.uiAmount || 0,
          uiAmountString: account.uiAmountString || '0'
        }
      }));
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.UNKNOWN,
        `Failed to get token largest accounts: ${error}`
      );
    }
  }

  async getRecentTransactions(address: PublicKey): Promise<TransactionResponse[]> {
    try {
      const signatures = await this.rpcConnection.getSignaturesForAddress(address, {
        limit: 100
      });
      const txs = await Promise.all(
        signatures.map(sig => this.rpcConnection.getTransaction(sig.signature))
      );
      return txs.filter((tx): tx is TransactionResponse => tx !== null);
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.UNKNOWN,
        `Failed to get recent transactions: ${error}`
      );
    }
  }

  async getTokenAccountsByOwner(owner: PublicKey): Promise<Array<{
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
  }>> {
    try {
      const accounts = await this.rpcConnection.getParsedTokenAccountsByOwner(owner, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });
      return accounts.value;
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.UNKNOWN,
        `Failed to get token accounts: ${error}`
      );
    }
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    try {
      const options: SendOptions = {
        preflightCommitment: this.commitment,
        maxRetries: this.maxRetries
      };
      return await this.rpcConnection.sendTransaction(transaction, [], options);
    } catch (error) {
      throw new SolanaError(
        SolanaErrorCodes.TRANSACTION_FAILED,
        `Failed to send transaction: ${error}`
      );
    }
  }
}

export function createDefaultSolanaClient(config?: Partial<ConnectionConfig>): SolanaClient {
  const defaultConfig: ConnectionConfig = {
    endpoint: 'https://api.mainnet-beta.solana.com',
    commitment: 'confirmed',
    timeout: 30000,
    maxRetries: 3,
    priorityFee: 0
  };

  return new SolanaClientImpl({
    ...defaultConfig,
    ...config
  });
}
