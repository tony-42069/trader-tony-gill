import { PublicKey } from '@solana/web3.js';

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
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
  HIGH_TAX = 'high_tax',
  LOW_LIQUIDITY = 'low_liquidity',
  SUSPICIOUS_HOLDERS = 'suspicious_holders',
  UNVERIFIED_CONTRACT = 'unverified_contract',
  HONEYPOT_RISK = 'honeypot_risk',
  OWNERSHIP_NOT_RENOUNCED = 'ownership_not_renounced',
  MINT_ENABLED = 'mint_enabled',
  BLACKLISTED = 'blacklisted'
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
