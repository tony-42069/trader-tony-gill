import { PublicKey } from '@solana/web3.js';
import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { logger } from '../../utils/logger';
import { config } from '../../config/settings';
import {
  MonitoringService,
  MonitoredToken,
  TokenUpdate,
  PriceAlert,
  AlertType,
  AlertHandler,
  MonitorErrorCode
} from './types';
import { MonitorError } from './errors';

export class MonitoringServiceImpl implements MonitoringService {
  private monitoredTokens: Map<string, MonitoredToken>;
  private monitoringInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(
    private tokenAnalyzer: TokenAnalyzerImpl,
    private alertHandler: AlertHandler,
    private config: {
      priceChangeThreshold: number;
      liquidityChangeThreshold: number;
      volumeChangeThreshold: number;
      alertCooldown: number;
      maxTokensPerUser: number;
      checkInterval: number;
    }
  ) {
    this.monitoredTokens = new Map();
  }

  async addToken(
    tokenAddress: string | PublicKey,
    userId: string,
    options?: {
      priceAlert?: number;
      liquidityAlert?: number;
      volumeAlert?: number;
    }
  ): Promise<MonitoredToken> {
    const address = tokenAddress.toString();

    // Check if token is already monitored by this user
    const existingToken = Array.from(this.monitoredTokens.values()).find(
      token => token.address === address && token.userId === userId
    );

    if (existingToken) {
      throw new MonitorError(
        'Token is already being monitored',
        MonitorErrorCode.TOKEN_ALREADY_MONITORED,
        { address, userId }
      );
    }

    // Check user's token limit
    const userTokenCount = Array.from(this.monitoredTokens.values()).filter(
      token => token.userId === userId
    ).length;

    if (userTokenCount >= this.config.maxTokensPerUser) {
      throw new MonitorError(
        'Maximum number of monitored tokens reached',
        MonitorErrorCode.MAX_TOKENS_REACHED,
        { userId, maxTokens: this.config.maxTokensPerUser }
      );
    }

    try {
      // Get initial token data
      const analysis = await this.tokenAnalyzer.analyzeToken(address, {
        includePrice: true
      });

      const token: MonitoredToken = {
        address,
        symbol: analysis.metadata.symbol,
        userId,
        basePrice: analysis.price.price,
        baseLiquidity: analysis.price.liquidity,
        baseVolume: analysis.price.volume24h,
        lastPrice: analysis.price.price,
        lastLiquidity: analysis.price.liquidity,
        lastVolume: analysis.price.volume24h,
        priceChangeAlert: options?.priceAlert ?? this.config.priceChangeThreshold,
        liquidityChangeAlert: options?.liquidityAlert ?? this.config.liquidityChangeThreshold,
        volumeChangeAlert: options?.volumeAlert ?? this.config.volumeChangeThreshold,
        lastAlertTime: 0,
        addedAt: new Date(),
        lastChecked: new Date(),
        isActive: true
      };

      const key = `${address}_${userId}`;
      this.monitoredTokens.set(key, token);

      logger.info('Token added to monitoring', {
        address,
        userId,
        symbol: token.symbol
      });

      return token;

    } catch (error) {
      throw new MonitorError(
        'Failed to add token to monitoring',
        MonitorErrorCode.UPDATE_FAILED,
        { address, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async removeToken(
    tokenAddress: string | PublicKey,
    userId: string
  ): Promise<boolean> {
    const address = tokenAddress.toString();
    const key = `${address}_${userId}`;

    if (!this.monitoredTokens.has(key)) {
      throw new MonitorError(
        'Token not found in monitoring',
        MonitorErrorCode.TOKEN_NOT_FOUND,
        { address, userId }
      );
    }

    const result = this.monitoredTokens.delete(key);
    logger.info('Token removed from monitoring', { address, userId });
    return result;
  }

  async getUserTokens(userId: string): Promise<MonitoredToken[]> {
    return Array.from(this.monitoredTokens.values()).filter(
      token => token.userId === userId
    );
  }

  async getTokenStatus(
    tokenAddress: string | PublicKey,
    userId: string
  ): Promise<TokenUpdate | null> {
    const address = tokenAddress.toString();
    const key = `${address}_${userId}`;
    const token = this.monitoredTokens.get(key);

    if (!token) {
      return null;
    }

    try {
      const analysis = await this.tokenAnalyzer.analyzeToken(address, {
        includePrice: true
      });

      return {
        price: analysis.price.price,
        priceChange: ((analysis.price.price - token.basePrice) / token.basePrice) * 100,
        liquidity: analysis.price.liquidity,
        liquidityChange: ((analysis.price.liquidity - token.baseLiquidity) / token.baseLiquidity) * 100,
        volume: analysis.price.volume24h,
        volumeChange: ((analysis.price.volume24h - token.baseVolume) / token.baseVolume) * 100,
        lastUpdated: new Date()
      };

    } catch (error) {
      throw new MonitorError(
        'Failed to get token status',
        MonitorErrorCode.UPDATE_FAILED,
        { address, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  async updateAlerts(
    tokenAddress: string | PublicKey,
    userId: string,
    alerts: {
      price?: number;
      liquidity?: number;
      volume?: number;
    }
  ): Promise<MonitoredToken> {
    const address = tokenAddress.toString();
    const key = `${address}_${userId}`;
    const token = this.monitoredTokens.get(key);

    if (!token) {
      throw new MonitorError(
        'Token not found in monitoring',
        MonitorErrorCode.TOKEN_NOT_FOUND,
        { address, userId }
      );
    }

    // Validate alert values
    if (alerts.price && alerts.price <= 0) {
      throw new MonitorError(
        'Invalid price alert value',
        MonitorErrorCode.INVALID_ALERT_VALUE,
        { value: alerts.price }
      );
    }

    if (alerts.liquidity && alerts.liquidity <= 0) {
      throw new MonitorError(
        'Invalid liquidity alert value',
        MonitorErrorCode.INVALID_ALERT_VALUE,
        { value: alerts.liquidity }
      );
    }

    if (alerts.volume && alerts.volume <= 0) {
      throw new MonitorError(
        'Invalid volume alert value',
        MonitorErrorCode.INVALID_ALERT_VALUE,
        { value: alerts.volume }
      );
    }

    // Update alert thresholds
    const updatedToken: MonitoredToken = {
      ...token,
      priceChangeAlert: alerts.price ?? token.priceChangeAlert,
      liquidityChangeAlert: alerts.liquidity ?? token.liquidityChangeAlert,
      volumeChangeAlert: alerts.volume ?? token.volumeChangeAlert
    };

    this.monitoredTokens.set(key, updatedToken);
    return updatedToken;
  }

  async startMonitoring(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    logger.info('Starting token monitoring service');

    this.monitoringInterval = setInterval(
      () => this.checkTokens(),
      this.config.checkInterval
    );
  }

  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    logger.info('Token monitoring service stopped');
  }

  private async checkTokens(): Promise<void> {
    const now = Date.now();

    for (const token of this.monitoredTokens.values()) {
      try {
        // Skip if cooldown hasn't elapsed
        if (now - token.lastAlertTime < this.config.alertCooldown) {
          continue;
        }

        const analysis = await this.tokenAnalyzer.analyzeToken(token.address, {
          includePrice: true
        });

        // Calculate changes
        const priceChange = ((analysis.price.price - token.lastPrice) / token.lastPrice) * 100;
        const liquidityChange = ((analysis.price.liquidity - token.lastLiquidity) / token.lastLiquidity) * 100;
        const volumeChange = ((analysis.price.volume24h - token.lastVolume) / token.lastVolume) * 100;

        // Check price alerts
        if (Math.abs(priceChange) >= token.priceChangeAlert) {
          const alert: PriceAlert = {
            type: priceChange > 0 ? AlertType.PRICE_INCREASE : AlertType.PRICE_DECREASE,
            token,
            oldValue: token.lastPrice,
            newValue: analysis.price.price,
            changePercent: priceChange,
            timestamp: new Date()
          };
          await this.alertHandler.onPriceAlert(alert);
          token.lastAlertTime = now;
        }

        // Check liquidity alerts
        if (Math.abs(liquidityChange) >= token.liquidityChangeAlert) {
          const alert: PriceAlert = {
            type: liquidityChange > 0 ? AlertType.LIQUIDITY_INCREASE : AlertType.LIQUIDITY_DECREASE,
            token,
            oldValue: token.lastLiquidity,
            newValue: analysis.price.liquidity,
            changePercent: liquidityChange,
            timestamp: new Date()
          };
          await this.alertHandler.onLiquidityAlert(alert);
          token.lastAlertTime = now;
        }

        // Check volume alerts
        if (Math.abs(volumeChange) >= token.volumeChangeAlert) {
          const alert: PriceAlert = {
            type: volumeChange > 0 ? AlertType.VOLUME_SPIKE : AlertType.VOLUME_DROP,
            token,
            oldValue: token.lastVolume,
            newValue: analysis.price.volume24h,
            changePercent: volumeChange,
            timestamp: new Date()
          };
          await this.alertHandler.onVolumeAlert(alert);
          token.lastAlertTime = now;
        }

        // Update token state
        token.lastPrice = analysis.price.price;
        token.lastLiquidity = analysis.price.liquidity;
        token.lastVolume = analysis.price.volume24h;
        token.lastChecked = new Date();

      } catch (error) {
        logger.error('Error checking token:', {
          address: token.address,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}
