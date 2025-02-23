import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { BN } from 'bn.js';

// Type alias for BN instance
type BNType = InstanceType<typeof BN>;

export interface HolderAnalysis {
  totalHolders: number;
  topHolders: HolderInfo[];
  concentration: {
    top10Percent: number;
    top50Percent: number;
    top100Percent: number;
  };
  circulatingSupply: BNType;
  details?: string;
  warnings: string[];
  topHolderPercentage: number;
}

export interface HolderInfo {
  address: string;
  balance: BNType;
  percentage: number;
  isContract: boolean;
  isLocked: boolean;
}

export class HolderAnalyzer {
  constructor(private connection: Connection) {}

  async analyzeToken(tokenAddress: string | PublicKey): Promise<HolderAnalysis> {
    const address = tokenAddress.toString();
    
    try {
      // Get token supply and holder data
      const tokenSupply = await this.getTokenSupply(address);
      const holders = await this.getTokenHolders(address);
      
      // Sort holders by balance
      holders.sort((a, b) => b.percentage - a.percentage);

      // Calculate concentration
      const concentration = this.calculateConcentration(holders);

      // Filter out locked/contract holders
      const circulatingSupply = this.calculateCirculatingSupply(tokenSupply, holders);

      const warnings: string[] = [];
      if (holders.length < 100) {
        warnings.push('Low number of holders');
      }
      if (concentration.top10Percent > 80) {
        warnings.push('High concentration in top holders');
      }
      if (circulatingSupply.muln(100).div(tokenSupply).toNumber() < 2000) {
        warnings.push('Low circulating supply');
      }

      const topHolderPercentage = holders.length > 0 ? holders[0].percentage : 0;

      return {
        totalHolders: holders.length,
        topHolders: holders.slice(0, 10), // Top 10 holders
        concentration,
        circulatingSupply,
        details: this.generateDetails(holders, concentration, circulatingSupply, tokenSupply),
        warnings,
        topHolderPercentage
      };

    } catch (error) {
      logger.error('Holder analysis failed:', {
        address,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        totalHolders: 0,
        topHolders: [],
        concentration: {
          top10Percent: 0,
          top50Percent: 0,
          top100Percent: 0
        },
        circulatingSupply: new BN(0),
        details: 'Failed to analyze holders: ' + (error instanceof Error ? error.message : 'Unknown error'),
        warnings: ['Analysis failed'],
        topHolderPercentage: 0
      };
    }
  }

  private async getTokenSupply(tokenAddress: string): Promise<BNType> {
    try {
      // Get token supply from SPL token program
      // This is a placeholder - actual implementation would use token program
      return new BN(1000000000);
    } catch (error) {
      logger.error('Failed to get token supply:', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return new BN(0);
    }
  }

  private async getTokenHolders(tokenAddress: string): Promise<HolderInfo[]> {
    try {
      // Get token holder data
      // This is a placeholder - actual implementation would fetch holder data
      return [
        {
          address: 'placeholder',
          balance: new BN(1000000),
          percentage: 10,
          isContract: false,
          isLocked: false
        }
      ];
    } catch (error) {
      logger.error('Failed to get token holders:', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private calculateConcentration(holders: HolderInfo[]): {
    top10Percent: number;
    top50Percent: number;
    top100Percent: number;
  } {
    try {
      const totalSupply = holders.reduce(
        (sum, holder) => sum.add(holder.balance),
        new BN(0)
      );

      if (totalSupply.isZero()) {
        return {
          top10Percent: 0,
          top50Percent: 0,
          top100Percent: 0
        };
      }

      // Calculate percentages for different holder groups
      const top10 = holders.slice(0, Math.ceil(holders.length * 0.1));
      const top50 = holders.slice(0, Math.ceil(holders.length * 0.5));
      const top100 = holders;

      return {
        top10Percent: this.calculateGroupPercentage(top10, totalSupply),
        top50Percent: this.calculateGroupPercentage(top50, totalSupply),
        top100Percent: this.calculateGroupPercentage(top100, totalSupply)
      };
    } catch (error) {
      logger.error('Failed to calculate concentration:', error);
      return {
        top10Percent: 0,
        top50Percent: 0,
        top100Percent: 0
      };
    }
  }

  private calculateGroupPercentage(holders: HolderInfo[], totalSupply: BNType): number {
    const groupSum = holders.reduce(
      (sum, holder) => sum.add(holder.balance),
      new BN(0)
    );
    return groupSum.muln(100).div(totalSupply).toNumber() / 100;
  }

  private calculateCirculatingSupply(
    totalSupply: BNType,
    holders: HolderInfo[]
  ): BNType {
    try {
      // Subtract locked and contract balances
      const lockedAmount = holders
        .filter(h => h.isLocked || h.isContract)
        .reduce((sum, h) => sum.add(h.balance), new BN(0));

      return totalSupply.sub(lockedAmount);
    } catch (error) {
      logger.error('Failed to calculate circulating supply:', error);
      return totalSupply;
    }
  }

  private generateDetails(
    holders: HolderInfo[],
    concentration: { top10Percent: number; top50Percent: number; top100Percent: number },
    circulatingSupply: BNType,
    totalSupply: BNType
  ): string {
    const details: string[] = [];

    details.push(`Total Holders: ${holders.length}`);
    details.push(`Circulating Supply: ${circulatingSupply.toString()} (${
      circulatingSupply.muln(100).div(totalSupply).toNumber() / 100
    }%)`);

    details.push('\nConcentration:');
    details.push(`Top 10% Holders: ${concentration.top10Percent}%`);
    details.push(`Top 50% Holders: ${concentration.top50Percent}%`);

    // Add warnings
    if (holders.length < 100) {
      details.push('\n⚠️ Low number of holders');
    }

    if (concentration.top10Percent > 80) {
      details.push('⚠️ High concentration in top holders');
    }

    if (circulatingSupply.muln(100).div(totalSupply).toNumber() < 2000) {
      details.push('⚠️ Low circulating supply');
    }

    return details.join('\n');
  }
}
