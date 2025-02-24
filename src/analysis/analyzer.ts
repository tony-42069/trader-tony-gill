import { Connection, PublicKey } from '@solana/web3.js';
import { RaydiumClient } from '../utils/raydium/types';
import { SolanaClient } from '../utils/solana/types';
import { TokenAnalysis, TokenAnalyzer } from './types';
import { ContractAnalyzer } from './contract';
import { logger } from '../utils/logger';
import { HolderAnalyzer } from './contract/holders';
import { OwnershipAnalyzer } from './contract/ownership';
import { TokenPrice, TokenRisk, TokenMetadata } from './contract/types';

export class TokenAnalyzerImpl implements TokenAnalyzer {
  readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  readonly cache = new Map<string, { analysis: TokenAnalysis; timestamp: number }>();
  
  private contractAnalyzer: ContractAnalyzer;
  
  constructor(
    readonly solanaClient: SolanaClient,
    readonly raydiumClient: RaydiumClient
  ) {
    const connection = solanaClient.getConnection();
    this.contractAnalyzer = new ContractAnalyzer(connection, raydiumClient);
  }

  async analyzeToken(tokenAddress: string): Promise<TokenAnalysis> {
    try {
      // Check cache first
      const cached = this.cache.get(tokenAddress);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.analysis;
      }

      // Get token metadata
      const metadata = await this.getTokenMetadata(tokenAddress);
      
      // Get token price
      const price = await this.getTokenPrice(tokenAddress);
      
      // Get contract risk analysis
      const contractAnalysis = await this.contractAnalyzer.analyzeContract(tokenAddress);
      
      // Combine all data
      const analysis: TokenAnalysis = {
        tokenAddress,
        metadata,
        price,
        risk: {
          isHoneypot: contractAnalysis.honeypot.isHoneypot,
          buyTax: contractAnalysis.tax.buyTax,
          sellTax: contractAnalysis.tax.sellTax,
          isRenounced: contractAnalysis.ownership.isRenounced,
          warnings: [
            ...contractAnalysis.honeypot.warnings,
            ...contractAnalysis.tax.warnings,
            ...contractAnalysis.ownership.warnings,
            ...contractAnalysis.holders.warnings
          ],
          score: this.calculateRiskScore(
            contractAnalysis.honeypot.honeypotRisk,
            contractAnalysis.tax.taxRisk,
            contractAnalysis.holders.holdersRisk
          ),
          honeypotRisk: contractAnalysis.honeypot.honeypotRisk,
          taxRisk: contractAnalysis.tax.taxRisk,
          holdersRisk: contractAnalysis.holders.holdersRisk,
          lastUpdated: new Date()
        },
        lastAnalyzed: new Date()
      };

      // Cache the result
      this.cache.set(tokenAddress, { analysis, timestamp: Date.now() });

      return analysis;
    } catch (error) {
      logger.error('Token analysis failed:', {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    try {
      // Get price data from Raydium
      const pool = await this.raydiumClient.getPool(tokenAddress);
      if (!pool) {
        return {
          price: 0,
          priceChange24h: 0,
          volume24h: 0,
          marketCap: 0,
          liquidity: 0,
          lastUpdated: new Date()
        };
      }

      const poolState = await pool.getState();
      const baseReserve = BigInt(poolState.baseReserve.toString());
      const quoteReserve = BigInt(poolState.quoteReserve.toString());

      // Calculate price from reserves
      const price = Number(quoteReserve) / Number(baseReserve);
      
      // Calculate liquidity in SOL
      const liquidity = Number(quoteReserve) / 1e9; // Convert lamports to SOL
      
      // Get 24h volume (placeholder)
      const volume24h = liquidity * 0.1; // Placeholder: 10% of liquidity
      
      // Get market cap (placeholder)
      const marketCap = price * 1000000; // Placeholder
      
      // Get 24h price change (placeholder)
      const priceChange24h = 0; // Placeholder

      return {
        price,
        priceChange24h,
        volume24h,
        marketCap,
        liquidity,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Failed to get token price:', {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        liquidity: 0,
        lastUpdated: new Date()
      };
    }
  }

  async getRiskScore(tokenAddress: string): Promise<number> {
    const analysis = await this.analyzeToken(tokenAddress);
    return analysis.risk?.score || 0;
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata> {
    try {
      // Get token metadata from Solana
      const tokenInfo = await this.solanaClient.getAccountInfo(new PublicKey(tokenAddress));
      
      // Placeholder implementation
      return {
        name: 'Token',
        symbol: 'TKN',
        decimals: 9,
        totalSupply: BigInt(1000000000),
        holders: 100,
        verified: false,
        isVerified: false,
        address: tokenAddress
      };
    } catch (error) {
      logger.error('Failed to get token metadata:', {
        tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        name: 'Unknown',
        symbol: 'UNK',
        decimals: 9,
        totalSupply: BigInt(0),
        holders: 0,
        verified: false,
        isVerified: false,
        address: tokenAddress
      };
    }
  }

  async isHoneypot(tokenAddress: string): Promise<boolean> {
    const analysis = await this.analyzeToken(tokenAddress);
    return analysis.risk?.isHoneypot || false;
  }

  async getTaxInfo(tokenAddress: string): Promise<{ buyTax: number; sellTax: number }> {
    const analysis = await this.analyzeToken(tokenAddress);
    return {
      buyTax: analysis.risk?.buyTax || 0,
      sellTax: analysis.risk?.sellTax || 0
    };
  }

  async isRenounced(tokenAddress: string): Promise<boolean> {
    const analysis = await this.analyzeToken(tokenAddress);
    return analysis.risk?.isRenounced || false;
  }

  async getHolderCount(tokenAddress: string): Promise<number> {
    const analysis = await this.analyzeToken(tokenAddress);
    return analysis.metadata?.holders || 0;
  }

  private calculateRiskScore(honeypotRisk: number, taxRisk: number, holderRisk: number): number {
    // Weight the different risk factors
    const honeypotWeight = 0.5;
    const taxWeight = 0.3;
    const holderWeight = 0.2;
    
    return Math.min(
      Math.round(
        honeypotRisk * honeypotWeight +
        taxRisk * taxWeight +
        holderRisk * holderWeight
      ),
      100
    );
  }
}
