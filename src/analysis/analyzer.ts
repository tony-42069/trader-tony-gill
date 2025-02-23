import { PublicKey, Connection } from '@solana/web3.js';
import { SolanaClientImpl } from '../utils/solana/client';
import { logger } from '../utils/logger';
import {
  TokenAnalyzer,
  TokenAnalysis,
  TokenMetadata,
  TokenPrice,
  TokenRisk,
  TokenWarning,
  TokenWarningType,
  AnalysisOptions
} from './types';
import { config } from '../config/settings';
import { ContractAnalyzer } from './contract';
import { RaydiumClient } from '../utils/raydium/client';

export class TokenAnalyzerImpl implements TokenAnalyzer {
  private cache: Map<string, TokenAnalysis>;
  private readonly CACHE_TTL = 60 * 1000; // 1 minute
  private contractAnalyzer: ContractAnalyzer;

  constructor(
    private solanaClient: SolanaClientImpl,
    private raydiumClient: RaydiumClient
  ) {
    this.cache = new Map();
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.contractAnalyzer = new ContractAnalyzer(connection, raydiumClient);
  }

  async analyzeToken(address: string | PublicKey): Promise<TokenAnalysis> {
    const tokenAddress = address.toString();
    const cached = this.cache.get(tokenAddress);

    if (cached && Date.now() - cached.lastAnalyzed.getTime() < this.CACHE_TTL) {
      return cached;
    }

    const metadata = await this.getTokenMetadata(address);
    const price = await this.getTokenPrice(address);
    const risk = await this.assessRisk(address);

    const analysis: TokenAnalysis = {
      metadata,
      price,
      risk,
      lastAnalyzed: new Date()
    };

    this.cache.set(tokenAddress, analysis);
    return analysis;
  }

  async getTokenMetadata(address: string | PublicKey): Promise<TokenMetadata> {
    const tokenAddress = address.toString();
    try {
      const accountInfo = await this.solanaClient.getAccountInfo(new PublicKey(tokenAddress));
      if (!accountInfo) {
        throw new Error('Token account not found');
      }

      const supply = await this.solanaClient.getTokenSupply(new PublicKey(tokenAddress));
      
      return {
        address: tokenAddress,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: supply.decimals,
        totalSupply: supply.amount,
        holders: 0,
        isVerified: false,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to fetch token metadata:', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getTokenPrice(address: string | PublicKey): Promise<TokenPrice> {
    try {
      const pool = await this.raydiumClient.getPool(address.toString());
      if (!pool) {
        return {
          price: 0,
          priceChange24h: 0,
          volume24h: 0,
          marketCap: 0,
          fullyDilutedMarketCap: 0,
          liquidity: 0,
          lastUpdated: new Date()
        };
      }

      const poolState = await pool.fetchPoolState();
      if (!poolState) {
        throw new Error('Failed to fetch pool state');
      }

      return {
        price: Number(poolState.price),
        priceChange24h: 0,
        volume24h: Number(poolState.volume24h),
        marketCap: 0,
        fullyDilutedMarketCap: 0,
        liquidity: Number(poolState.liquidity),
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Failed to fetch token price:', {
        address: address.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async assessRisk(address: string | PublicKey): Promise<TokenRisk> {
    try {
      const contractAnalysis = await this.contractAnalyzer.analyzeContract(address.toString());
      
      return {
        score: contractAnalysis.riskScore,
        buyTax: contractAnalysis.tax.buyTax,
        sellTax: contractAnalysis.tax.sellTax,
        isHoneypot: contractAnalysis.honeypot.isHoneypot,
        isRenounced: contractAnalysis.ownership.isRenounced,
        warnings: contractAnalysis.warnings.map(warning => this.mapWarningType(warning))
      };
    } catch (error) {
      logger.error('Failed to assess token risk:', {
        address: address.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async isValidToken(address: string | PublicKey): Promise<boolean> {
    try {
      const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
      const accountInfo = await this.solanaClient.getAccountInfo(pubkey);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  private mapWarningType(warning: any): TokenWarning {
    return {
      type: warning.type,
      severity: warning.severity,
      message: warning.message,
      details: warning.details
    };
  }
}