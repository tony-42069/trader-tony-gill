import { PublicKey } from '@solana/web3.js';
import { SolanaClientImpl } from '../utils/solana/client';
import { logger } from '../utils/logger';
import { FallbackTokenData } from './types';

export class FallbackTokenAnalyzer {
  constructor(private readonly solanaClient: SolanaClientImpl) {}

  async analyzeToken(address: string): Promise<FallbackTokenData> {
    try {
      logger.info('Using fallback token analyzer', { address });
      
      const tokenPubkey = new PublicKey(address);
      
      // Get account info
      const accountInfo = await this.solanaClient.getAccountInfo(tokenPubkey);
      const hasAccount = accountInfo !== null;

      let supply = BigInt(0);
      let decimals = 0;
      let holders = 0;

      if (hasAccount) {
        try {
          // Get token supply
          const supplyResponse = await this.solanaClient.getTokenSupply(tokenPubkey);
          if (supplyResponse) {
            supply = BigInt(supplyResponse.value.amount);
            decimals = supplyResponse.value.decimals;
          }

          // Get largest token accounts
          const holdersResponse = await this.solanaClient.getTokenLargestAccounts(tokenPubkey);
          if (holdersResponse?.value) {
            holders = holdersResponse.value.length;
          }
        } catch (error) {
          logger.warn('Failed to get token details', { error, address });
        }
      }

      const fallbackData: FallbackTokenData = {
        address,
        supply,
        decimals,
        holders,
        accountInfo: hasAccount,
        analysis: {
          hasValidAccount: hasAccount,
          holderCount: holders,
          isInitialized: hasAccount
        }
      };

      logger.info('Fallback analysis complete', { 
        address,
        hasAccount,
        holders,
        decimals
      });

      return fallbackData;
    } catch (error) {
      logger.error('Fallback analysis failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        address 
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
