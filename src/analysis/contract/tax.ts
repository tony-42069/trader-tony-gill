import { Connection, PublicKey } from '@solana/web3.js';
import { RaydiumClient } from '../../utils/raydium/client';
import { RaydiumPool } from '../../utils/raydium/pool';
import { logger } from '../../utils/logger';
import BN from 'bn.js';

export interface TaxAnalysis {
  buyTax: number;
  sellTax: number;
  warnings: string[];
}

export class TaxAnalyzer {
  private readonly MAX_BUY_TAX = 10; // 10%
  private readonly MAX_SELL_TAX = 10; // 10%

  constructor(
    private readonly connection: Connection,
    private readonly raydiumClient: RaydiumClient
  ) {}

  async analyzeToken(tokenAddress: string): Promise<TaxAnalysis> {
    try {
      // Get pool
      const pool = this.raydiumClient.getPool(tokenAddress);
      if (!pool) {
        return {
          buyTax: 100,
          sellTax: 100,
          warnings: ['❌ No liquidity pool found']
        };
      }

      // Simulate buy and sell transactions
      const buyTax = await this.estimateBuyTax(pool);
      const sellTax = await this.estimateSellTax(pool);

      const warnings: string[] = [];

      // Check buy tax
      if (buyTax > this.MAX_BUY_TAX) {
        warnings.push(`⚠️ High buy tax: ${buyTax.toFixed(2)}%`);
      }

      // Check sell tax
      if (sellTax > this.MAX_SELL_TAX) {
        warnings.push(`⚠️ High sell tax: ${sellTax.toFixed(2)}%`);
      }

      return {
        buyTax,
        sellTax,
        warnings
      };

    } catch (error) {
      logger.error('Tax analysis failed:', {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        buyTax: 100,
        sellTax: 100,
        warnings: ['❌ Failed to analyze taxes']
      };
    }
  }

  private async estimateBuyTax(pool: RaydiumPool): Promise<number> {
    try {
      const amountIn = new BN(1_000_000_000); // 1 SOL in lamports
      const poolState = await pool.fetchPoolState();
      if (!poolState) throw new Error('Failed to fetch pool state');

      // Calculate expected output using constant product formula
      const expectedOutput = this.calculateExpectedOutput(
        amountIn,
        poolState.baseReserve,
        poolState.quoteReserve
      );

      // Simulate transaction to get actual output
      const actualOutput = await this.simulateSwap(pool, amountIn, true);

      return expectedOutput.sub(actualOutput).muln(100).div(expectedOutput).toNumber();
    } catch (error) {
      logger.error('Failed to estimate buy tax:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 100; // Assume worst case
    }
  }

  private async estimateSellTax(pool: RaydiumPool): Promise<number> {
    try {
      const amountIn = new BN(1_000_000); // 1 token
      const poolState = await pool.fetchPoolState();
      if (!poolState) throw new Error('Failed to fetch pool state');

      // Calculate expected output using constant product formula
      const expectedOutput = this.calculateExpectedOutput(
        amountIn,
        poolState.quoteReserve,
        poolState.baseReserve
      );

      // Simulate transaction to get actual output
      const actualOutput = await this.simulateSwap(pool, amountIn, false);

      return expectedOutput.sub(actualOutput).muln(100).div(expectedOutput).toNumber();
    } catch (error) {
      logger.error('Failed to estimate sell tax:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 100; // Assume worst case
    }
  }

  private calculateExpectedOutput(
    amountIn: BN,
    reserveIn: BN,
    reserveOut: BN
  ): BN {
    const amountInWithFee = amountIn.muln(997); // 0.3% fee
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.muln(1000).add(amountInWithFee);
    return numerator.div(denominator);
  }

  private async simulateSwap(
    pool: RaydiumPool,
    amountIn: BN,
    isBuy: boolean
  ): Promise<BN> {
    try {
      const poolState = await pool.fetchPoolState();
      if (!poolState) throw new Error('Failed to fetch pool state');

      // In a real implementation, we would simulate the swap transaction
      // For now, return a simplified estimate
      const reserveIn = isBuy ? poolState.baseReserve : poolState.quoteReserve;
      const reserveOut = isBuy ? poolState.quoteReserve : poolState.baseReserve;
      
      return this.calculateExpectedOutput(amountIn, reserveIn, reserveOut);
    } catch (error) {
      logger.error('Swap simulation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return new BN(0);
    }
  }
} 