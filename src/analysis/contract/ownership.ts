import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { TokenRisk } from './types';

export class OwnershipAnalyzer {
  constructor(private readonly connection: Connection) {}

  async analyzeToken(tokenAddress: string): Promise<TokenRisk> {
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
        isHoneypot: false, // Not determined by ownership analysis
        buyTax: 0, // Not determined by ownership analysis
        sellTax: 0, // Not determined by ownership analysis
        isRenounced,
        warnings,
        score: isRenounced ? 0 : 50, // Lower score is better
        honeypotRisk: 0, // Not determined by ownership analysis
        taxRisk: 0, // Not determined by ownership analysis
        holdersRisk: 0, // Not determined by ownership analysis
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Ownership analysis failed:', {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isHoneypot: false,
        buyTax: 0,
        sellTax: 0,
        isRenounced: false,
        warnings: ['❌ Failed to analyze ownership'],
        score: 50, // Medium risk due to unknown status
        honeypotRisk: 0,
        taxRisk: 0,
        holdersRisk: 0,
        lastUpdated: new Date()
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
