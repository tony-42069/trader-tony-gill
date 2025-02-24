export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: bigint;
  verified: boolean;
  holders: number;
}

export interface TokenPrice {
  current: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  lastUpdated: Date;
  price: number;
  priceChange24h: number;
  marketCap: number;
}

export interface TokenRisk {
  score: number;
  honeypotRisk: number;
  taxRisk: number;
  holdersRisk: number;
  warnings: string[];
  lastUpdated: Date;
  buyTax: number;
  sellTax: number;
  isHoneypot: boolean;
  isRenounced: boolean;
}

export interface HoneypotAnalysis {
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  maxBuyAmount: number;
  maxSellAmount: number;
  warnings: string[];
}

export interface TaxAnalysis {
  buyTax: number;
  sellTax: number;
  maxBuyAmount: number;
  maxSellAmount: number;
  warnings: string[];
}

export interface HolderAnalysis {
  totalHolders: number;
  topHolders: HolderInfo[];
  concentration: {
    top10Percent: number;
    top50Percent: number;
    top100Percent: number;
  };
  circulatingSupply: bigint;
  details?: string;
  warnings: string[];
  topHolderPercentage: number;
}

export interface HolderInfo {
  address: string;
  balance: bigint;
  percentage: number;
  isContract: boolean;
  isLocked: boolean;
}

export interface OwnershipAnalysis {
  ownerAddress: string;
  isRenounced: boolean;
  warnings: string[];
}

export type TokenWarning = string;
