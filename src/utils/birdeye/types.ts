export interface BirdeyeTokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holders: number;
  verified: boolean;
  createdAt: string;
}

export interface BirdeyeTokenPrice {
  value: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  lastUpdated: string;
}

export interface BirdeyeError extends Error {
  code: string;
  status?: number;
}

export interface BirdeyeClient {
  getTokenMetadata(address: string): Promise<BirdeyeTokenMetadata>;
  getTokenPrice(address: string): Promise<BirdeyeTokenPrice>;
}
