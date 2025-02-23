import { TokenAnalyzer } from '../types';
import { logger } from '../../utils/logger';
import {
  MonitoringConfig,
  MonitoredToken,
  TokenAlert,
  TokenAlertType,
  TokenMonitor,
  AlertHandler
} from './types';

export class TokenMonitorImpl implements TokenMonitor {
  private tokens: Map<string, MonitoredToken> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly analyzer: TokenAnalyzer,
    private readonly alertHandler: AlertHandler,
    private readonly config: MonitoringConfig
  ) {}

  async addToken(
    tokenAddress: string,
    userId: string,
    customAlerts?: MonitoredToken['customAlerts']
  ): Promise<MonitoredToken> {
    // Check if user has reached their token limit
    const userTokens = Array.from(this.tokens.values()).filter(t => t.userId === userId);
    if (userTokens.length >= this.config.maxTokensPerUser) {
      throw new Error(`User has reached maximum token limit of ${this.config.maxTokensPerUser}`);
    }

    // Get initial token analysis
    const analysis = await this.analyzer.analyzeToken(tokenAddress, {
      includePrice: true,
      includeRisk: true
    });

    const token: MonitoredToken = {
      address: tokenAddress,
      userId,
      basePrice: analysis.price.price,
      baseLiquidity: analysis.price.liquidity,
      baseVolume: analysis.price.volume24h,
      lastChecked: new Date(),
      lastAlerted: new Date(),
      isActive: true,
      customAlerts
    };

    this.tokens.set(this.getTokenKey(tokenAddress, userId), token);
    return token;
  }

  async removeToken(tokenAddress: string, userId: string): Promise<boolean> {
    const key = this.getTokenKey(tokenAddress, userId);
    return this.tokens.delete(key);
  }

  async updateAlerts(
    tokenAddress: string,
    userId: string,
    alerts: MonitoredToken['customAlerts']
  ): Promise<MonitoredToken> {
    const key = this.getTokenKey(tokenAddress, userId);
    const token = this.tokens.get(key);
    if (!token) {
      throw new Error('Token not found');
    }

    token.customAlerts = alerts;
    this.tokens.set(key, token);
    return token;
  }

  async getMonitoredTokens(userId: string): Promise<MonitoredToken[]> {
    return Array.from(this.tokens.values()).filter(t => t.userId === userId);
  }

  async isTokenMonitored(tokenAddress: string, userId: string): Promise<boolean> {
    const key = this.getTokenKey(tokenAddress, userId);
    return this.tokens.has(key);
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(
      () => this.checkTokens(),
      this.config.checkInterval
    );

    logger.info('Token monitoring started', {
      tokenCount: this.tokens.size,
      checkInterval: this.config.checkInterval
    });
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Token monitoring stopped');
    }
  }

  private async checkTokens(): Promise<void> {
    const now = new Date();

    for (const token of this.tokens.values()) {
      if (!token.isActive) continue;

      try {
        const analysis = await this.analyzer.analyzeToken(token.address, {
          includePrice: true,
          includeRisk: true
        });

        // Check for price changes
        const priceChange = this.calculatePercentageChange(
          token.basePrice,
          analysis.price.price
        );

        const priceThreshold = token.customAlerts?.priceChange || this.config.priceChangeThreshold;
        if (Math.abs(priceChange) >= priceThreshold) {
          await this.createAlert(token, TokenAlertType.PRICE_INCREASE, {
            oldValue: token.basePrice,
            newValue: analysis.price.price,
            change: priceChange
          });
          token.basePrice = analysis.price.price;
        }

        // Check for liquidity changes
        const liquidityChange = this.calculatePercentageChange(
          token.baseLiquidity,
          analysis.price.liquidity
        );

        const liquidityThreshold = token.customAlerts?.liquidityChange || this.config.liquidityChangeThreshold;
        if (Math.abs(liquidityChange) >= liquidityThreshold) {
          await this.createAlert(token, TokenAlertType.LIQUIDITY_INCREASE, {
            oldValue: token.baseLiquidity,
            newValue: analysis.price.liquidity,
            change: liquidityChange
          });
          token.baseLiquidity = analysis.price.liquidity;
        }

        // Check for volume changes
        const volumeChange = this.calculatePercentageChange(
          token.baseVolume,
          analysis.price.volume24h
        );

        const volumeThreshold = token.customAlerts?.volumeChange || this.config.volumeChangeThreshold;
        if (Math.abs(volumeChange) >= volumeThreshold) {
          await this.createAlert(token, TokenAlertType.VOLUME_SPIKE, {
            oldValue: token.baseVolume,
            newValue: analysis.price.volume24h,
            change: volumeChange
          });
          token.baseVolume = analysis.price.volume24h;
        }

        // Update token state
        token.lastChecked = now;
        this.tokens.set(this.getTokenKey(token.address, token.userId), token);

      } catch (error) {
        logger.error('Failed to check token:', {
          tokenAddress: token.address,
          userId: token.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private async createAlert(
    token: MonitoredToken,
    type: TokenAlertType,
    {
      oldValue,
      newValue,
      change
    }: {
      oldValue: number;
      newValue: number;
      change: number;
    }
  ): Promise<void> {
    const now = new Date();
    const timeSinceLastAlert = now.getTime() - token.lastAlerted.getTime();

    // Check cooldown
    if (timeSinceLastAlert < this.config.alertCooldown) {
      return;
    }

    const alert: TokenAlert = {
      type,
      tokenAddress: token.address,
      userId: token.userId,
      oldValue,
      newValue,
      percentageChange: change,
      timestamp: now
    };

    await this.alertHandler.handleAlert(alert);
    token.lastAlerted = now;
  }

  private getTokenKey(tokenAddress: string, userId: string): string {
    return `${tokenAddress}:${userId}`;
  }
} 