import { PublicKey } from '@solana/web3.js';

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  holders: number;
  isVerified: boolean;
  createdAt: Date;
}

export interface TokenPrice {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  fullyDilutedMarketCap: number;
  liquidity: number;
  lastUpdated: Date;
}

export interface TokenRisk {
  score: number;
  buyTax: number;
  sellTax: number;
  isHoneypot: boolean;
  isRenounced: boolean;
  warnings: TokenWarning[];
}

export interface TokenWarning {
  type: TokenWarningType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: string;
}

export enum TokenWarningType {
  LOW_LIQUIDITY = 'LOW_LIQUIDITY',
  HIGH_TAX = 'HIGH_TAX',
  HONEYPOT = 'HONEYPOT',
  UNVERIFIED_CONTRACT = 'UNVERIFIED_CONTRACT',
  CENTRALIZED_OWNERSHIP = 'CENTRALIZED_OWNERSHIP',
  SUSPICIOUS_HOLDERS = 'SUSPICIOUS_HOLDERS'
}

export interface TokenAnalysis {
  metadata: TokenMetadata;
  price: TokenPrice;
  risk: TokenRisk;
  poolAddress?: string;
  lastAnalyzed: Date;
}

export interface AnalysisOptions {
  includePrice?: boolean;
  includeRisk?: boolean;
  forceUpdate?: boolean;
  timeout?: number;
}

export interface TokenAnalyzer {
  analyzeToken(address: string | PublicKey, options?: AnalysisOptions): Promise<TokenAnalysis>;
  getTokenMetadata(address: string | PublicKey): Promise<TokenMetadata>;
  getTokenPrice(address: string | PublicKey): Promise<TokenPrice>;
  assessRisk(address: string | PublicKey): Promise<TokenRisk>;
  isValidToken(address: string | PublicKey): Promise<boolean>;
}

export interface FallbackTokenData {
  address: string;
  decimals: number;
  supply: number;
  holders: {
    address: string;
    amount: number;
  }[];
  metadata?: {
    name?: string;
    symbol?: string;
    uri?: string;
  };
}
