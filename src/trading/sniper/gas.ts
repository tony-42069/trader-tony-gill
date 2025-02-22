import { Connection } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { GasOptimizer, SolanaTransaction } from './types';

export class GasOptimizerImpl implements GasOptimizer {
  constructor(private connection: Connection) {}

  async estimateGas(transaction: SolanaTransaction): Promise<number> {
    try {
      // Get recent block data
      const { blockhash } = await this.connection.getLatestBlockhash();

      // Calculate base gas cost
      const baseGas = 21000; // Base transaction cost
      const instructionGas = transaction.instructions.length * 5000; // Cost per instruction

      // Add compute units if specified
      const computeUnits = transaction.computeUnits || 0;

      return baseGas + instructionGas + computeUnits;
    } catch (error) {
      logger.error('Failed to estimate gas:', error);
      return 200000; // Default max compute units
    }
  }

  async getPriorityFee(): Promise<number> {
    try {
      // Get recent transactions
      const recentTxs = await this.connection.getRecentPerformanceSamples(100);

      // Calculate average priority fee
      const avgFee = recentTxs.reduce((sum, sample) => {
        return sum + (sample.numTransactions > 0 ? sample.samplePeriodSecs / sample.numTransactions : 0);
      }, 0) / recentTxs.length;

      // Add 20% margin
      return Math.max(avgFee * 1.2, 0.000001);
    } catch (error) {
      logger.error('Failed to get priority fee:', error);
      return 0.000001; // Default minimum priority fee
    }
  }

  async getComputeUnits(transaction: SolanaTransaction): Promise<number> {
    try {
      // Base compute units
      let units = 100000;

      // Add units per instruction
      units += transaction.instructions.length * 5000;

      // Add units for complex operations
      if (transaction.instructions.some(ix => ix.data.length > 1000)) {
        units += 50000; // Extra units for complex instructions
      }

      // Cap at maximum allowed
      return Math.min(units, 200000);
    } catch (error) {
      logger.error('Failed to calculate compute units:', error);
      return 200000; // Default max compute units
    }
  }
}
