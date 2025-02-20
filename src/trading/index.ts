import { SolanaClientImpl } from '../utils/solana/client';
import { WalletManagerImpl } from '../utils/wallet/wallet';
import { TokenAnalyzerImpl } from '../analysis/analyzer';
import { logger } from '../utils/logger';
import { TraderImpl } from './trader';

export * from './types';
export * from './errors';
export * from './trader';

export const createTrader = (
  solanaClient: SolanaClientImpl,
  walletManager: WalletManagerImpl,
  tokenAnalyzer: TokenAnalyzerImpl
) => {
  logger.info('Initializing trader');
  return new TraderImpl(solanaClient, walletManager, tokenAnalyzer);
};

// Utility functions for trading operations

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

export const formatPnL = (pnl: number, includeSymbol = true): string => {
  const formatted = Math.abs(pnl).toFixed(2);
  const symbol = pnl >= 0 ? '+' : '-';
  return includeSymbol ? `${symbol}${formatted}%` : formatted;
};

export const calculateOptimalAmount = (
  availableBalance: number,
  tokenPrice: number,
  maxSlippage: number
): number => {
  // Calculate maximum amount that won't exceed slippage threshold
  const maxAmount = availableBalance * (maxSlippage / 100);
  
  // Calculate number of tokens that can be bought
  const tokenAmount = maxAmount / tokenPrice;
  
  // Round down to avoid dust amounts
  return Math.floor(tokenAmount * 1e9) / 1e9;
};

export const estimateGasFee = (
  baseGas: number,
  priorityFee: number,
  antiMev = false
): number => {
  let totalFee = baseGas;

  // Add priority fee if specified
  if (priorityFee > 0) {
    totalFee += priorityFee;
  }

  // Add additional fee for anti-MEV protection
  if (antiMev) {
    totalFee += baseGas * 0.5; // 50% increase for anti-MEV
  }

  return totalFee;
};
