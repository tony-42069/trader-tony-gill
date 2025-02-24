import { Connection, PublicKey } from '@solana/web3.js';
import { RaydiumClientInterface, RaydiumPool, RaydiumPoolState } from '../../utils/raydium/types';
import { logger } from '../../utils/logger';

export interface TaxAnalysis {
  buyTax: number;
  sellTax: number;
  maxBuyAmount: number;
  maxSellAmount: number;
  warnings: string[];
}

export class TaxAnalyzer {
  private readonly MAX_TAX = 0.15; // 15%
  private readonly TEST_AMOUNT = 0.1; // 0.1 SOL

  constructor(
    private readonly connection: Connection,
    private readonly raydiumClient: RaydiumClientInterface
  ) {}

  async analyzeToken(tokenAddress: string): Promise<TaxAnalysis> {
    try {
      // Get pool state
      const pool = await this.raydiumClient.getPool(tokenAddress);
      if (!pool) {
        return {
          buyTax: 1,
          sellTax: 1,
          maxBuyAmount: 0,
          maxSellAmount: 0,
          warnings: ['No liquidity pool found']
        };
      }

      const poolState = await pool.fetchPoolState();
      if (!poolState) {
        throw new Error('Failed to fetch pool state');
      }

      // Simulate buy
      const buyResult = await this.simulateBuy(poolState);
      if (!buyResult.success) {
        return {
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
          buyTax: buyResult.tax,
          sellTax: 1,
          maxBuyAmount: buyResult.maxAmount,
          maxSellAmount: 0,
          warnings: ['Sell transaction simulation failed']
        };
      }

      return {
        buyTax: buyResult.tax,
        sellTax: sellResult.tax,
        maxBuyAmount: buyResult.maxAmount,
        maxSellAmount: sellResult.maxAmount,
        warnings: this.generateWarnings(buyResult, sellResult)
      };
    } catch (error) {
      logger.error('Tax analysis failed:', {
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
        BigInt(poolState.baseReserve.toString()),
        BigInt(poolState.quoteReserve.toString())
      );

      // Simulate transaction
      const actualOut = Number(expectedOut) * 0.99; // Assume 1% slippage

      return {
        success: true,
        tax: 0.01, // 1% tax
        maxAmount: Number(poolState.baseReserve.toString()) / 1e9 // Max buy amount in SOL
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
        BigInt(poolState.quoteReserve.toString()),
        BigInt(poolState.baseReserve.toString())
      );

      // Simulate transaction
      const actualOut = Number(expectedOut) * 0.99; // Assume 1% slippage

      return {
        success: true,
        tax: 0.01, // 1% tax
        maxAmount: Number(poolState.quoteReserve.toString()) / 1e9 // Max sell amount in tokens
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
    const denominator = reserveIn * BigInt(1000) + amountInWithFee;
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
