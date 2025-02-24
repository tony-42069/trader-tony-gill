import { PublicKey } from '@solana/web3.js';
import { TokenPrice, TokenRisk, TokenMetadata } from './contract/types';
import { RaydiumClient } from '../utils/raydium/types';
import { SolanaClient } from '../utils/solana/types';

export interface TokenAnalysis {
  tokenAddress: string;
  poolAddress?: string;
  price?: TokenPrice;
  risk?: TokenRisk;
  metadata: TokenMetadata;
  lastAnalyzed: Date;
}

export interface TokenAnalyzer {
  analyzeToken(tokenAddress: string): Promise<TokenAnalysis>;
  getTokenPrice(tokenAddress: string): Promise<TokenPrice>;
  getRiskScore(tokenAddress: string): Promise<number>;
  getTokenMetadata(tokenAddress: string): Promise<TokenMetadata>;
  isHoneypot(tokenAddress: string): Promise<boolean>;
  getTaxInfo(tokenAddress: string): Promise<{ buyTax: number; sellTax: number }>;
  isRenounced(tokenAddress: string): Promise<boolean>;
  getHolderCount(tokenAddress: string): Promise<number>;
}

export interface TokenAnalyzerImpl extends TokenAnalyzer {
  CACHE_TTL: number;
  cache: Map<string, { analysis: TokenAnalysis; timestamp: number }>;
  connection: any;
  honeypotAnalyzer: any;
  taxAnalyzer: any;
  ownershipAnalyzer: any;
  holdersAnalyzer: any;
  raydiumClient: RaydiumClient;
  solanaClient: SolanaClient;
}

export interface AnalyzerConfig {
  cacheTTL?: number;
  maxRetries?: number;
  timeout?: number;
  enableCache?: boolean;
}

export interface TokenAnalyzerFactory {
  createTokenAnalyzer(
    solanaClient: SolanaClient,
    raydiumClient: RaydiumClient,
    config?: AnalyzerConfig
  ): TokenAnalyzer;
}

export enum AnalysisErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export class AnalysisError extends Error {
  constructor(
    public readonly code: AnalysisErrorCode,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}
