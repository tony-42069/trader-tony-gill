import { SolanaClient } from '../utils/solana/types';
import { RaydiumClient } from '../utils/raydium/types';
import { TokenAnalyzer, AnalyzerConfig } from './types';
import { TokenAnalyzerImpl } from './analyzer';

export * from './types';
// Export specific items from analyzer to avoid naming conflicts
export { TokenAnalyzerImpl } from './analyzer';
export * from './contract/types';

export function createTokenAnalyzer(
  solanaClient: SolanaClient,
  raydiumClient: RaydiumClient,
  config?: AnalyzerConfig
): TokenAnalyzer {
  return new TokenAnalyzerImpl(solanaClient, raydiumClient);
}

export function getRiskLevel(score: number): string {
  if (score < 20) return 'low';
  if (score < 50) return 'medium';
  if (score < 80) return 'high';
  return 'critical';
}
