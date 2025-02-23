import { Connection, PublicKey } from '@solana/web3.js';
import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { WalletManagerImpl } from '../../utils/wallet/wallet';
import { SniperService } from './types';
import { SniperServiceImpl } from './service';
import { config } from '../../config/settings';
import { 
  SnipeConfig, 
  SnipeResult, 
  SnipeErrorCode,
  MEVProtection,
  GasOptimizer,
  TransactionBundle,
  SolanaTransaction
} from './types';

// Re-export types
export {
  SnipeConfig,
  SnipeResult,
  SnipeErrorCode,
  MEVProtection,
  GasOptimizer,
  TransactionBundle,
  SolanaTransaction,
  SniperServiceImpl
};

// Error class
export class SnipeError extends Error {
  constructor(
    message: string,
    public code: SnipeErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'SnipeError';
  }
}

export function createSniperService(
  connection: Connection,
  tokenAnalyzer: TokenAnalyzerImpl,
  walletManager: WalletManagerImpl
): SniperService {
  const raydiumProgramId = new PublicKey(config.raydium.programId);
  return new SniperServiceImpl(connection, tokenAnalyzer, walletManager, raydiumProgramId);
}

export const DEFAULT_SNIPE_CONFIG: Partial<SnipeConfig> = {
  maxSlippage: 0.05, // 5%
  quoteMint: 'So11111111111111111111111111111111111111112', // SOL
  minLiquidity: 10, // 10 SOL
  maxRiskScore: 0.7, // 70%
  maxBuyAmount: 100, // 100 SOL

  // Protection settings
  sandwichProtection: true,
  simulateFirst: true,
  maxPendingTransactions: 5,
  maxBlockAge: 150,
  retryAttempts: 3,
  usePrivatePool: false,
  emergencyExitEnabled: true,
  bundleTransactions: true,

  // Gas settings
  priorityFee: 0.000001,
  computeUnits: 200000,
  maxGasPrice: 100000,

  // Timing settings
  maxExecutionTime: 30000, // 30 seconds
  minConfirmations: 1
};
