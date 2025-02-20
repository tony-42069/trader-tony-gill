import { SolanaClientImpl } from '../utils/solana/client';
import { TokenAnalyzerImpl } from './analyzer';
import { logger } from '../utils/logger';

export * from './types';
export * from './analyzer';

export const createTokenAnalyzer = (solanaClient: SolanaClientImpl) => {
  logger.info('Initializing token analyzer');
  return new TokenAnalyzerImpl(solanaClient);
};

// Create error types for the analysis module
export class TokenAnalysisError extends Error {
  constructor(
    message: string,
    public code: TokenAnalysisErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TokenAnalysisError';
  }
}

export enum TokenAnalysisErrorCode {
  INVALID_TOKEN = 'invalid_token',
  FETCH_FAILED = 'fetch_failed',
  ANALYSIS_FAILED = 'analysis_failed',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  INSUFFICIENT_LIQUIDITY = 'insufficient_liquidity',
  HIGH_RISK = 'high_risk'
}

// Export utility functions
export const formatTokenAmount = (amount: bigint, decimals: number): string => {
  const divisor = BigInt(10) ** BigInt(decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  return `${integerPart}.${fractionalPart.toString().padStart(decimals, '0')}`;
};

export const calculatePriceImpact = (
  inputAmount: number,
  inputReserve: number,
  outputReserve: number
): number => {
  const k = inputReserve * outputReserve;
  const newInputReserve = inputReserve + inputAmount;
  const newOutputReserve = k / newInputReserve;
  const outputAmount = outputReserve - newOutputReserve;
  const spotPrice = outputReserve / inputReserve;
  const executionPrice = outputAmount / inputAmount;
  
  return ((spotPrice - executionPrice) / spotPrice) * 100;
};

export const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
};
