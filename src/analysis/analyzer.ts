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
    // Create a new Connection instance with confirmed commitment
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.contractAnalyzer = new ContractAnalyzer(
      connection,
      raydiumClient
    );
  }

  async analyzeToken(
    address: string | PublicKey,
    options: AnalysisOptions = {}
  ): Promise<TokenAnalysis> {
    const tokenAddress = address.toString();
    const cached = this.cache.get(tokenAddress);

    // Return cached result if valid and not forcing update
    if (
      cached &&
      !options.forceUpdate &&
      Date.now() - cached.lastAnalyzed.getTime() < this.CACHE_TTL
    ) {
      return cached;
    }

    try {
      // Validate token
      if (!await this.isValidToken(address)) {
        throw new Error('Invalid token address');
      }

      // Get metadata (always required)
      const metadata = await this.getTokenMetadata(address);

      // Get price data if requested
      const price = options.includePrice
        ? await this.getTokenPrice(address)
        : undefined;

      // Assess risk if requested
      const risk = options.includeRisk
        ? await this.assessRisk(address)
        : undefined;

      const analysis: TokenAnalysis = {
        metadata,
        price: price || {
          price: 0,
          priceChange24h: 0,
          volume24h: 0,
          marketCap: 0,
          fullyDilutedMarketCap: 0,
          liquidity: 0,
          lastUpdated: new Date()
        },
        risk: risk || {
          score: 0,
          buyTax: 0,
          sellTax: 0,
          isHoneypot: false,
          isRenounced: false,
          warnings: []
        },
        lastAnalyzed: new Date()
      };

      // Cache the result
      this.cache.set(tokenAddress, analysis);

      return analysis;
    } catch (error) {
      logger.error('Token analysis failed:', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getTokenMetadata(address: string | PublicKey): Promise<TokenMetadata> {
    const tokenAddress = address.toString();
    
    try {
      // TODO: Implement token metadata fetching using Solana client
      // This is a placeholder implementation
      return {
        address: tokenAddress,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 9,
        totalSupply: BigInt(0),
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
    const tokenAddress = address.toString();
    
    try {
      // TODO: Implement price fetching using Raydium/Orca APIs
      // This is a placeholder implementation
      return {
        price: 0,
        priceChange24h: 0,
        volume24h: 0,
        marketCap: 0,
        fullyDilutedMarketCap: 0,
        liquidity: 0,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Failed to fetch token price:', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async assessRisk(address: string | PublicKey): Promise<TokenRisk> {
    const tokenAddress = address.toString();
    const warnings: TokenWarning[] = [];
    
    try {
      const metadata = await this.getTokenMetadata(address);
      const price = await this.getTokenPrice(address);

      // Check liquidity
      if (price.liquidity < config.trading.minLiquidity) {
        warnings.push({
          type: TokenWarningType.LOW_LIQUIDITY,
          severity: 'high',
          message: 'Token has insufficient liquidity',
          details: `Liquidity: ${price.liquidity} SOL`
        });
      }

      // Check verification
      if (!metadata.isVerified) {
        warnings.push({
          type: TokenWarningType.UNVERIFIED_CONTRACT,
          severity: 'medium',
          message: 'Token contract is not verified'
        });
      }

      // Perform contract analysis
      const contractAnalysis = await this.contractAnalyzer.analyzeContract(tokenAddress);

      // Add contract warnings
      for (const warning of contractAnalysis.warnings) {
        warnings.push(this.mapWarningType(warning));
      }

      return {
        score: contractAnalysis.riskScore,
        buyTax: contractAnalysis.tax.buyTax,
        sellTax: contractAnalysis.tax.sellTax,
        isHoneypot: contractAnalysis.honeypot.isHoneypot,
        isRenounced: contractAnalysis.ownership.isRenounced,
        warnings
      };
    } catch (error) {
      logger.error('Failed to assess token risk:', {
        address: tokenAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async isValidToken(address: string | PublicKey): Promise<boolean> {
    try {
      const pubkey = typeof address === 'string' ? new PublicKey(address) : address;
      // TODO: Implement proper token validation
      // This is a placeholder that just checks if it's a valid public key
      return PublicKey.isOnCurve(pubkey.toBytes());
    } catch {
      return false;
    }
  }

  private mapWarningType(warning: string): TokenWarning {
    if (warning.includes('honeypot')) {
      return {
        type: TokenWarningType.HONEYPOT,
        severity: 'high',
        message: warning
      };
    }
    if (warning.includes('High buy tax') || warning.includes('High sell tax')) {
      return {
        type: TokenWarningType.HIGH_TAX,
        severity: 'high',
        message: warning
      };
    }
    if (warning.includes('ownership not renounced')) {
      return {
        type: TokenWarningType.OWNERSHIP_NOT_RENOUNCED,
        severity: 'medium',
        message: warning
      };
    }
    if (warning.includes('concentration')) {
      return {
        type: TokenWarningType.HIGH_CONCENTRATION,
        severity: 'medium',
        message: warning
      };
    }
    if (warning.includes('Low number of holders')) {
      return {
        type: TokenWarningType.LOW_HOLDERS,
        severity: 'low',
        message: warning
      };
    }
    return {
      type: TokenWarningType.UNKNOWN,
      severity: 'medium',
      message: warning
    };
  }
}