export interface TokenPrice {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  lastUpdated: Date;
}

export interface TokenRisk {
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  isRenounced: boolean;
  warnings: string[];
  score: number;
  honeypotRisk: number;
  taxRisk: number;
  holdersRisk: number;
  lastUpdated: Date;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  holders: number;
  verified: boolean;
  isVerified?: boolean;
  address?: string;
}

export interface ContractAnalysis {
  risk: TokenRisk;
  metadata: TokenMetadata;
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface RiskScore {
  level: RiskLevel;
  score: number;
  factors: string[];
}

export type TokenWarning = string;
