import { PublicKey } from '@solana/web3.js';
import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { logger } from '../../utils/logger';
import { config } from '../../config/settings';
import { PositionError } from './errors';
import { PositionSizingMethod } from './types';

export class PositionSizer {
  constructor(
    private tokenAnalyzer: TokenAnalyzerImpl,
    private config: {
      maxPositionSize: number;
      minPositionSize: number;
      maxPositionValue: number;
      defaultRiskPerTrade: number;
      defaultWinRate: number;
      defaultKellyFraction: number;
      volatilityMultiplier: number;
    }
  ) {}

  async calculateSize(
    tokenAddress: string | PublicKey,
    method: PositionSizingMethod,
    params: {
      riskAmount?: number;
      winRate?: number;
      kelly?: number;
      availableBalance: number;
    }
  ): Promise<number> {
    const address = tokenAddress.toString();

    try {
      // Get token analysis for price and risk data
      const analysis = await this.tokenAnalyzer.analyzeToken(address, {
        includePrice: true,
        includeRisk: true
      });

      let size: number;

      switch (method) {
        case PositionSizingMethod.FIXED:
          size = await this.calculateFixedSize(analysis.price.price, params.availableBalance);
          break;

        case PositionSizingMethod.RISK_BASED:
          size = await this.calculateRiskBasedSize(
            analysis.price.price,
            params.riskAmount || this.config.defaultRiskPerTrade,
            analysis.risk.score,
            params.availableBalance
          );
          break;

        case PositionSizingMethod.KELLY:
          size = await this.calculateKellySize(
            analysis.price.price,
            params.winRate || this.config.defaultWinRate,
            params.kelly || this.config.defaultKellyFraction,
            params.availableBalance
          );
          break;

        case PositionSizingMethod.DYNAMIC:
          size = await this.calculateDynamicSize(
            analysis.price.price,
            analysis.price.volume24h,
            analysis.risk.score,
            params.availableBalance
          );
          break;

        default:
          throw new Error(`Unknown position sizing method: ${method}`);
      }

      // Validate final size
      return this.validateAndAdjustSize(size, analysis.price.price);

    } catch (error) {
      logger.error('Position sizing failed:', {
        address,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async calculateFixedSize(price: number, availableBalance: number): Promise<number> {
    // Use a fixed percentage of available balance
    const fixedPercentage = 0.1; // 10% of available balance
    return Math.min(
      (availableBalance * fixedPercentage),
      this.config.maxPositionSize
    );
  }

  private async calculateRiskBasedSize(
    price: number,
    riskAmount: number,
    riskScore: number,
    availableBalance: number
  ): Promise<number> {
    // Adjust risk based on token's risk score
    const adjustedRisk = riskAmount * (1 - riskScore / 100);
    
    // Calculate position size based on risk amount
    const size = (adjustedRisk / price) * availableBalance;
    
    return Math.min(size, this.config.maxPositionSize);
  }

  private async calculateKellySize(
    price: number,
    winRate: number,
    kellyFraction: number,
    availableBalance: number
  ): Promise<number> {
    // Kelly Criterion formula: f = (bp - q) / b
    // where: b = odds of win - 1, p = probability of win, q = probability of loss
    const b = 1.5; // Assuming average win is 1.5x the risk
    const p = winRate / 100;
    const q = 1 - p;
    
    const kellyPercentage = ((b * p) - q) / b;
    
    // Apply Kelly fraction to avoid over-betting
    const adjustedKelly = kellyPercentage * kellyFraction;
    
    // Calculate position size
    const size = (availableBalance * adjustedKelly);
    
    return Math.min(size, this.config.maxPositionSize);
  }

  private async calculateDynamicSize(
    price: number,
    volume24h: number,
    riskScore: number,
    availableBalance: number
  ): Promise<number> {
    // Calculate base size as percentage of 24h volume
    const volumeBasedSize = (volume24h * 0.001) / price; // 0.1% of daily volume
    
    // Adjust for risk score
    const riskAdjustment = 1 - (riskScore / 100);
    
    // Adjust for volatility
    const volatilityAdjustment = this.config.volatilityMultiplier;
    
    // Calculate final size
    const size = volumeBasedSize * riskAdjustment * volatilityAdjustment;
    
    return Math.min(
      size,
      this.config.maxPositionSize,
      availableBalance * 0.5 // Max 50% of available balance
    );
  }

  private validateAndAdjustSize(size: number, price: number): number {
    // Check minimum size
    if (size < this.config.minPositionSize) {
      throw PositionError.invalidPositionSize(
        size,
        this.config.minPositionSize,
        this.config.maxPositionSize
      );
    }

    // Check maximum size
    if (size > this.config.maxPositionSize) {
      size = this.config.maxPositionSize;
    }

    // Check maximum position value
    const value = size * price;
    if (value > this.config.maxPositionValue) {
      size = this.config.maxPositionValue / price;
    }

    return size;
  }
}
