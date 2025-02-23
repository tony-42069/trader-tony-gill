import { PublicKey } from '@solana/web3.js';
import { SolanaClientImpl } from '../utils/solana/client';
import { TokenAmount } from '../utils/solana/types';
import { logger } from '../utils/logger';

export interface TokenHolder {
  address: string;
  amount: number;
}

export interface FallbackTokenData {
  supply: number;
  holders: TokenHolder[];
  hasAccount: boolean;
}

export class FallbackAnalyzer {
  constructor(private readonly solanaClient: SolanaClientImpl) {}

  async analyzeToken(tokenAddress: string): Promise<FallbackTokenData> {
    try {
      const tokenMint = new PublicKey(tokenAddress);
      let supply = 0;
      let holders: TokenHolder[] = [];
      let hasAccount = false;

      // Get token supply
      try {
        const supplyResponse = await this.solanaClient.getTokenSupply(tokenMint);
        if (supplyResponse) {
          supply = supplyResponse.amount;
        }
      } catch (error) {
        logger.error('Failed to fetch token supply:', {
          token: tokenAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Get largest token holders
      try {
        const holdersResponse = await this.solanaClient.getTokenLargestAccounts(tokenMint);
        if (holdersResponse) {
          holders = holdersResponse.map(holder => ({
            address: holder.address.toString(),
            amount: Number(holder.amount.amount) / Math.pow(10, holder.amount.decimals)
          }));
        }
      } catch (error) {
        logger.error('Failed to fetch token holders:', {
          token: tokenAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Check if token account exists
      try {
        const accountInfo = await this.solanaClient.getAccountInfo(tokenMint);
        hasAccount = accountInfo !== null;
      } catch (error) {
        logger.error('Failed to check token account:', {
          token: tokenAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return {
        supply,
        holders,
        hasAccount
      };
    } catch (error) {
      logger.error('Fallback analysis failed:', {
        token: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async isValidToken(address: string): Promise<boolean> {
    try {
      const tokenPubkey = new PublicKey(address);
      const accountInfo = await this.solanaClient.getAccountInfo(tokenPubkey);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }
}
