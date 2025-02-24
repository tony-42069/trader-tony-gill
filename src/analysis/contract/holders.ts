import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { BN } from 'bn.js';
import { TokenRisk } from './types';

// Type alias for BN instance
type BNType = InstanceType<typeof BN>;

export interface HolderInfo {
  address: string;
  balance: BNType;
  percentage: number;
  isContract: boolean;
  isLocked: boolean;
}

export class HolderAnalyzer {
  constructor(private connection: Connection) {}

  async analyzeToken(tokenAddress: string | PublicKey): Promise<TokenRisk> {
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
      
      // Calculate risk score based on holder concentration
      const holdersRisk = this.calculateHolderRisk(holders, concentration);

      return {
        isHoneypot: false, // Not determined by holder analysis
        buyTax: 0, // Not determined by holder analysis
        sellTax: 0, // Not determined by holder analysis
        isRenounced: false, // Not determined by holder analysis
        warnings,
        score: holdersRisk,
        honeypotRisk: 0, // Not determined by holder analysis
        taxRisk: 0, // Not determined by holder analysis
        holdersRisk,
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Holder analysis failed:', {
        address,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isHoneypot: false,
        buyTax: 0,
        sellTax: 0,
        isRenounced: false,
        warnings: ['Analysis failed'],
        score: 50, // Medium risk due to unknown status
        honeypotRisk: 0,
        taxRisk: 0,
        holdersRisk: 50,
        lastUpdated: new Date()
      };
    }
  }

  private calculateHolderRisk(
    holders: HolderInfo[],
    concentration: {
      top10Percent: number;
      top50Percent: number;
      top100Percent: number;
    }
  ): number {
    let risk = 0;
    
    // Risk based on number of holders
    if (holders.length < 10) {
      risk += 40;
    } else if (holders.length < 50) {
      risk += 30;
    } else if (holders.length < 100) {
      risk += 20;
    } else if (holders.length < 500) {
      risk += 10;
    }
    
    // Risk based on top holder concentration
    if (holders.length > 0) {
      const topHolder = holders[0];
      if (topHolder.percentage > 50) {
        risk += 40;
      } else if (topHolder.percentage > 30) {
        risk += 30;
      } else if (topHolder.percentage > 20) {
        risk += 20;
      } else if (topHolder.percentage > 10) {
        risk += 10;
      }
    }
    
    // Risk based on top 10% concentration
    if (concentration.top10Percent > 90) {
      risk += 20;
    } else if (concentration.top10Percent > 80) {
      risk += 15;
    } else if (concentration.top10Percent > 70) {
      risk += 10;
    } else if (concentration.top10Percent > 60) {
      risk += 5;
    }
    
    return Math.min(risk, 100);
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
}
