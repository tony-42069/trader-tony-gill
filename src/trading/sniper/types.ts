import { Connection, PublicKey, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { TokenAnalyzer } from '../../analysis/types';
import { WalletManager } from '../../utils/wallet/types';

export interface SniperConfig {
  maxSlippage: number;
  minLiquidity: number;
  priorityFee: number;
  maxGasPrice: number;
  computeUnits: number;
  maxBlockAge: number;
  retryAttempts: number;
  simulateFirst: boolean;
  sandwichProtection: boolean;
  maxExecutionTime: number;
  minConfirmations: number;
}

export interface SniperParams {
  tokenAddress: string;
  amount: number;
  slippage?: number;
  priorityFee?: number;
  waitForLiquidity?: boolean;
  maxWaitTime?: number;
  checkInterval?: number;
  autoTakeProfit?: number;
  autoStopLoss?: number;
  mevProtection?: boolean;
}

export interface SniperResult {
  success: boolean;
  tokenAddress: string;
  amount: number;
  price: number;
  value: number;
  transactionHash?: string;
  signature?: string;
  timestamp: number;
  error?: string;
  warnings?: string[];
  analysis?: any;
  fee?: number;
  gas?: number;
  executionTime?: number;
  status: SniperStatus;
}

export enum SniperStatus {
  PENDING = 'PENDING',
  WAITING_FOR_LIQUIDITY = 'WAITING_FOR_LIQUIDITY',
  SIMULATING = 'SIMULATING',
  EXECUTING = 'EXECUTING',
  CONFIRMING = 'CONFIRMING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface SniperService {
  snipe(params: SniperParams): Promise<SniperResult>;
  simulateSnipe(params: SniperParams): Promise<SniperResult>;
  getEstimatedOutput(tokenAddress: string, amount: number): Promise<{
    estimatedPrice: number;
    estimatedOutput: number;
    estimatedValue: number;
    fee: number;
  }>;
  getTokenInfo(address: string | PublicKey): Promise<any>;
  detectMEV(tokenAddress: string): Promise<MEVAnalysis>;
  protectFromMEV(tokenAddress: string, amount: number): Promise<MEVProtection>;
}

export interface SolanaTransaction {
  hash?: string;
  from?: string;
  to?: string;
  value?: number;
  gas?: number;
  gasPrice?: number;
  priorityFee?: number;
  timestamp?: number;
  blockNumber?: number;
  instructions?: TransactionInstruction[];
  signers?: Signer[];
}

export interface TransactionBundle {
  transactions: SolanaTransaction[];
  blockNumber: number;
  timestamp: number;
  config?: {
    maxGasPrice?: number;
    priorityFee?: number;
    computeUnits?: number;
    maxBlockAge?: number;
  };
}

export enum MEVRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface MEVAnalysis {
  riskLevel: MEVRiskLevel;
  sandwichPatterns: SandwichPattern[];
  frontRunningAttempts: number;
  backRunningAttempts: number;
  averagePriceImpact: number;
  recentMEVActivity: boolean;
  recommendations: string[];
  warnings: string[];
  timestamp: number;
}

export interface SandwichPattern {
  frontRun: SolanaTransaction;
  targetTx: SolanaTransaction;
  backRun: SolanaTransaction;
  priceImpact: number;
  timestamp: number;
}

export interface MEVProtection {
  priorityFee: number;
  recommendedSlippage: number;
  recommendedDelay: number;
  protectionEnabled: boolean;
  riskLevel: MEVRiskLevel;
  warnings: string[];
  
  detectSandwich(bundle: TransactionBundle): Promise<{
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
  
  updateProtectionSettings(riskLevel: MEVRiskLevel): void;
}

export interface GasOptimizer {
  calculateOptimalGas(tokenAddress: string, amount: number): Promise<{
    priorityFee: number;
    computeUnits: number;
  }>;
  
  getGasPrice(): Promise<number>;
  
  getRecommendedPriorityFee(tokenAddress: string): Promise<number>;
}

export interface SwapResult {
  success: boolean;
  tokenAddress: string;
  amount: number;
  amountIn: bigint;
  amountOut: bigint;
  price: number;
  fee: bigint;
  signature: string;
  timestamp: number;
}
