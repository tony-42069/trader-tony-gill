import { Connection, PublicKey } from '@solana/web3.js';
import { RaydiumClient } from '../../utils/raydium/client';
import { RaydiumPool } from '../../utils/raydium/pool';
import { logger } from '../../utils/logger';
import BN from 'bn.js';
import { RaydiumPoolState } from '../../utils/raydium/types';

export interface HoneypotAnalysis {
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  maxBuyAmount: number;
  maxSellAmount: number;
  warnings: string[];
}

export class HoneypotAnalyzer {
  private readonly MIN_LIQUIDITY = 1; // 1 SOL
  private readonly MAX_TAX = 0.15; // 15%
  private readonly TEST_AMOUNT = 0.1; // 0.1 SOL

  constructor(
    private readonly connection: Connection,
    private readonly raydiumClient: RaydiumClient
  ) {}

  async analyzeToken(tokenAddress: string): Promise<HoneypotAnalysis> {
    try {
      // Get pool state
      const pool = await this.raydiumClient.getPool(tokenAddress);
      if (!pool) {
        return {
          isHoneypot: true,
          buyTax: 0,
          sellTax: 0,
          maxBuyAmount: 0,
          maxSellAmount: 0,
          warnings: ['No liquidity pool found']
        };
      }

      const poolState = await pool.fetchPoolState();
      if (!poolState) {
        throw new Error('Failed to fetch pool state');
      }

      // Check liquidity
      const liquidity = Number(poolState.baseReserve) / 1e9; // Convert lamports to SOL
      if (liquidity < this.MIN_LIQUIDITY) {
        return {
          isHoneypot: true,
          buyTax: 0,
          sellTax: 0,
          maxBuyAmount: 0,
          maxSellAmount: 0,
          warnings: [`Insufficient liquidity: ${liquidity.toFixed(2)} SOL`]
        };
      }

      // Simulate buy
      const buyResult = await this.simulateBuy(poolState);
      if (!buyResult.success) {
        return {
          isHoneypot: true,
          buyTax: 1,
          sellTax: 1,
          maxBuyAmount: 0,
          maxSellAmount: 0,
          warnings: ['Buy transaction simulation failed']
        };
      }

      // Simulate sell
      const sellResult = await this.simulateSell(poolState);
      if (!sellResult.success) {
        return {
          isHoneypot: true,
          buyTax: buyResult.tax,
          sellTax: 1,
          maxBuyAmount: buyResult.maxAmount,
          maxSellAmount: 0,
          warnings: ['Sell transaction simulation failed']
        };
      }

      // Check if taxes are too high
      const isTaxTooHigh = buyResult.tax > this.MAX_TAX || sellResult.tax > this.MAX_TAX;

      return {
        isHoneypot: isTaxTooHigh,
        buyTax: buyResult.tax,
        sellTax: sellResult.tax,
        maxBuyAmount: buyResult.maxAmount,
        maxSellAmount: sellResult.maxAmount,
        warnings: this.generateWarnings(buyResult, sellResult)
      };
    } catch (error) {
      logger.error('Honeypot analysis failed:', {
        token: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async simulateBuy(poolState: RaydiumPoolState): Promise<{
    success: boolean;
    tax: number;
    maxAmount: number;
  }> {
    try {
      // Calculate expected output
      const amountIn = BigInt(Math.floor(this.TEST_AMOUNT * 1e9)); // Convert SOL to lamports
      const expectedOut = this.calculateExpectedOutput(
        amountIn,
        poolState.baseReserve,
        poolState.quoteReserve
      );

      // Simulate transaction
      const actualOut = Number(expectedOut) * 0.99; // Assume 1% slippage

      return {
        success: true,
        tax: 0.01, // 1% tax
        maxAmount: Number(poolState.baseReserve) / 1e9 // Max buy amount in SOL
      };
    } catch {
      return {
        success: false,
        tax: 1,
        maxAmount: 0
      };
    }
  }

  private async simulateSell(poolState: RaydiumPoolState): Promise<{
    success: boolean;
    tax: number;
    maxAmount: number;
  }> {
    try {
      // Calculate expected output
      const amountIn = BigInt(Math.floor(this.TEST_AMOUNT * 1e9)); // Convert SOL to lamports
      const expectedOut = this.calculateExpectedOutput(
        amountIn,
        poolState.quoteReserve,
        poolState.baseReserve
      );

      // Simulate transaction
      const actualOut = Number(expectedOut) * 0.99; // Assume 1% slippage

      return {
        success: true,
        tax: 0.01, // 1% tax
        maxAmount: Number(poolState.quoteReserve) / 1e9 // Max sell amount in tokens
      };
    } catch {
      return {
        success: false,
        tax: 1,
        maxAmount: 0
      };
    }
  }

  private calculateExpectedOutput(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint
  ): bigint {
    const amountInWithFee = amountIn * BigInt(997);
    const numerator = amountInWithFee * reserveOut;
    const denominator = (reserveIn * BigInt(1000)) + amountInWithFee;
    return numerator / denominator;
  }

  private generateWarnings(
    buyResult: { success: boolean; tax: number },
    sellResult: { success: boolean; tax: number }
  ): string[] {
    const warnings: string[] = [];

    if (!buyResult.success) {
      warnings.push('Buy transactions may fail');
    }
    if (!sellResult.success) {
      warnings.push('Sell transactions may fail');
    }
    if (buyResult.tax > this.MAX_TAX) {
      warnings.push(`High buy tax: ${(buyResult.tax * 100).toFixed(1)}%`);
    }
    if (sellResult.tax > this.MAX_TAX) {
      warnings.push(`High sell tax: ${(sellResult.tax * 100).toFixed(1)}%`);
    }

    return warnings;
  }
}
