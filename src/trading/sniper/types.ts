import { PublicKey, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { TokenAnalysis } from '../../analysis/types';

export enum SnipeErrorCode {
  INVALID_TOKEN = 'invalid_token',
  INSUFFICIENT_LIQUIDITY = 'insufficient_liquidity',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  HIGH_RISK = 'high_risk',
  SANDWICH_DETECTED = 'sandwich_detected',
  EXECUTION_FAILED = 'execution_failed',
  TRANSACTION_FAILED = 'transaction_failed',
  TIMEOUT = 'timeout',
  MAX_RETRIES_EXCEEDED = 'max_retries_exceeded',
  SIMULATION_FAILED = 'simulation_failed',
  INVALID_PARAMS = 'invalid_params',
  EXCESSIVE_SLIPPAGE = 'excessive_slippage',
  HIGH_GAS_PRICE = 'high_gas_price',
  LOW_LIQUIDITY = 'low_liquidity'
}

export interface SnipeConfig {
  // Token settings
  tokenAddress: string | PublicKey;
  amount: number;
  maxSlippage: number;
  quoteMint: string;
  minLiquidity: number;
  maxRiskScore: number;
  maxBuyAmount: number;

  // Protection settings
  sandwichProtection: boolean;
  simulateFirst: boolean;
  maxPendingTransactions: number;
  maxBlockAge: number;
  retryAttempts: number;
  usePrivatePool?: boolean;
  emergencyExitEnabled?: boolean;
  bundleTransactions?: boolean;

  // Gas settings
  priorityFee: number;
  computeUnits: number;
  maxGasPrice: number;

  // Timing settings
  maxExecutionTime: number;
  minConfirmations: number;
}

export interface SnipeResult {
  // Transaction details
  signature: string;
  transactionHash: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  success: boolean;

  // Token details
  tokenAddress: string;
  amount: number;
  price: number;
  slippage: number;

  // Gas details
  fee: number;
  priorityFee: number;
  computeUnits: number;

  // Analysis
  analysis: TokenAnalysis | null;

  // Error details
  error?: {
    code: SnipeErrorCode;
    message: string;
    details?: any;
  };
}

export interface TransactionBundle {
  transactions: SolanaTransaction[];
  blockNumber: number;
  timestamp: number;
  config?: {
    maxGasPrice: number;
    priorityFee: number;
    computeUnits: number;
    maxBlockAge: number;
  };
}

export interface SolanaTransaction {
  instructions: TransactionInstruction[];
  signers: Signer[];
  priorityFee?: number;
  computeUnits?: number;
  recentBlockhash?: string;
  hash?: string;
  from?: string;
  to?: string;
  value?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface LiquidityEvent {
  type: 'liquidity_added';
  tokenAddress: string;
  oldLiquidity: number;
  newLiquidity: number;
  timestamp: number;
}

export interface SniperService {
  snipe(config: SnipeConfig): Promise<SnipeResult>;
  
  simulateSnipe(config: SnipeConfig): Promise<{
    success: boolean;
    error?: string;
    estimatedGas: number;
    estimatedPrice: number;
  }>;

  validateToken(address: string | PublicKey): Promise<{
    valid: boolean;
    analysis: TokenAnalysis | null;
  }>;

  getPendingTransactions(): Promise<{
    count: number;
    transactions: string[];
  }>;

  cancelTransaction(signature: string): Promise<boolean>;

  startMonitoring(config: SnipeConfig): Promise<void>;

  stopMonitoring(tokenAddress: string): Promise<void>;
}

export interface MEVProtection {
  detectSandwich(
    bundle: TransactionBundle
  ): Promise<{
    isSandwich: boolean;
    frontRun?: SolanaTransaction;
    backRun?: SolanaTransaction;
  }>;

  optimizeGas(
    tokenAddress: string,
    amount: number
  ): Promise<{
    priorityFee: number;
    computeUnits: number;
  }>;

  bundleTransactions(
    transactions: SolanaTransaction[]
  ): Promise<TransactionBundle>;

  submitToPrivatePool(
    bundle: TransactionBundle
  ): Promise<string[]>;
}

export interface GasOptimizer {
  estimateGas(
    transaction: SolanaTransaction
  ): Promise<number>;

  getPriorityFee(): Promise<number>;

  getComputeUnits(
    transaction: SolanaTransaction
  ): Promise<number>;
}

export type SnipeParams = SnipeConfig;

export enum MEVRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface MEVAnalysis {
  risk: MEVRiskLevel;
  sandwichDetected: boolean;
  frontRunningDetected: boolean;
  backRunningDetected: boolean;
  recentMEVTransactions: number;
  averagePriceImpact: number;
  recommendations: string[];
}

export interface MEVProtection {
  priorityFee: number;
  recommendedSlippage: number;
  recommendedDelay: number;
  protectionEnabled: boolean;
  riskLevel: MEVRiskLevel;
  warnings: string[];
}

export interface SandwichPattern {
  buyTx: Transaction;
  targetTx: Transaction;
  sellTx: Transaction;
  priceImpact: number;
}

export interface MEVDetector {
  detectMEV(tokenAddress: string): Promise<MEVAnalysis>;
  protectFromMEV(tokenAddress: string, amount: number): Promise<MEVProtection>;
}

export interface MEVProtectionConfig {
  enabled: boolean;
  maxPriorityFee: number;
  sandwichThreshold: number;
  defaultSlippage: number;
  minDelay: number;
}
