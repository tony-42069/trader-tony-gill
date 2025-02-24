import { TokenMetadata, TokenPrice, TokenRisk } from './contract/types';

export interface AnalyzeOptions {
  includePrice?: boolean;
  includeRisk?: boolean;
  forceUpdate?: boolean;
}

export interface TokenAnalysis {
  metadata: TokenMetadata;
  price?: TokenPrice;
  risk?: TokenRisk;
  lastAnalyzed: Date;
}

export interface TokenAnalyzer {
  analyzeToken(address: string, options?: AnalyzeOptions): Promise<TokenAnalysis>;
}
