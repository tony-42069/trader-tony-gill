import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';

export interface OwnershipAnalysis {
  isRenounced: boolean;
  owner?: string;
  warnings: string[];
}

export class OwnershipAnalyzer {
  constructor(private readonly connection: Connection) {}

  async analyzeToken(tokenAddress: string): Promise<OwnershipAnalysis> {
    try {
      const owner = await this.getTokenOwner(tokenAddress);
      const isRenounced = !owner;
      const warnings: string[] = [];

      if (!isRenounced) {
        warnings.push('⚠️ Contract ownership not renounced');
        if (owner) {
          warnings.push(`⚠️ Owner: ${owner}`);
        }
      }

      return {
        isRenounced,
        owner,
        warnings
      };
    } catch (error) {
      logger.error('Ownership analysis failed:', {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isRenounced: false,
        warnings: ['❌ Failed to analyze ownership']
      };
    }
  }

  private async getTokenOwner(tokenAddress: string): Promise<string | undefined> {
    try {
      const tokenInfo = await this.connection.getAccountInfo(new PublicKey(tokenAddress));
      if (!tokenInfo?.owner) return undefined;
      return tokenInfo.owner.toString();
    } catch (error) {
      logger.error('Failed to get token owner:', {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  }
}
