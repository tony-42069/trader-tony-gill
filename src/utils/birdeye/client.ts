import { config } from '../../config/settings';
import { logger } from '../logger';
import { BirdeyeClient, BirdeyeTokenMetadata, BirdeyeTokenPrice, BirdeyeError } from './types';

const BIRDEYE_API_URL = 'https://public-api.birdeye.so';
const MAX_RETRIES = 3;
const RATE_LIMIT_PER_MINUTE = 60;

export class BirdeyeClientImpl implements BirdeyeClient {
  private readonly apiKey: string;
  private requestCount = 0;
  private lastRequestTime = Date.now();
  private requestQueue: Promise<any> = Promise.resolve();

  constructor() {
    this.apiKey = config.birdeye.apiKey;
    this.validateApiKey();
  }

  private validateApiKey() {
    if (!this.apiKey) {
      throw new Error('Birdeye API key is required');
    }
    // Log key length for debugging
    logger.info('API Key validation:', {
      length: this.apiKey.length,
      prefix: this.apiKey.substring(0, 4) + '...'
    });
  }

  private async checkRateLimit() {
    const now = Date.now();
    if (now - this.lastRequestTime > 60000) {
      // Reset counter after 1 minute
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    if (this.requestCount >= RATE_LIMIT_PER_MINUTE) {
      const waitTime = 60000 - (now - this.lastRequestTime);
      logger.warn('Rate limit reached, waiting:', { waitTime });
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }

  private async fetchWithRetry(endpoint: string, retries = MAX_RETRIES): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.checkRateLimit();

        const url = `${BIRDEYE_API_URL}${endpoint}`;
        logger.info('Making Birdeye API request:', {
          url,
          attempt,
          remainingRetries: retries - attempt
        });

        const response = await fetch(url, {
          headers: {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json',
            'X-Chain': 'solana',
            'User-Agent': 'TraderTony/1.0.0'
          }
        });

        if (!response.ok) {
          const responseText = await response.text();
          logger.error('Birdeye API error response:', {
            status: response.status,
            statusText: response.statusText,
            responseText,
            attempt
          });

          if (response.status === 401) {
            throw new Error('API key authentication failed');
          }

          if (response.status === 429) {
            // Rate limit hit, wait longer before retry
            await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
            continue;
          }

          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'API request failed');
        }

        return data.data || data;
      } catch (error) {
        logger.error('Birdeye API error:', {
          endpoint,
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  private async queueRequest<T>(operation: () => Promise<T>): Promise<T> {
    // Queue requests to prevent concurrent API calls
    this.requestQueue = this.requestQueue.then(async () => {
      try {
        return await operation();
      } catch (error) {
        throw error;
      }
    });

    return this.requestQueue;
  }

  async getTokenMetadata(address: string): Promise<BirdeyeTokenMetadata> {
    return this.queueRequest(async () => {
      const data = await this.fetchWithRetry(`/defi/v3/token/meta-data/single?address=${address}`);
      if (!data) {
        throw new Error('Token not found');
      }

      return {
        address: data.address || address,
        name: data.name || 'Unknown Token',
        symbol: data.symbol || 'UNKNOWN',
        decimals: data.decimals || 0,
        totalSupply: data.totalSupply || '0',
        holders: data.holderCount || 0,
        verified: data.verified || false,
        createdAt: data.createdAt || new Date().toISOString()
      };
    });
  }

  async getTokenPrice(address: string): Promise<BirdeyeTokenPrice> {
    return this.queueRequest(async () => {
      const data = await this.fetchWithRetry(`/defi/token_overview?address=${address}`);
      if (!data) {
        throw new Error('Price data not found');
      }

      return {
        value: data.price || 0,
        change24h: data.priceChange24h || 0,
        volume24h: data.v24h || 0,
        marketCap: data.mc || 0,
        liquidity: data.liquidity || 0,
        lastUpdated: new Date().toISOString()
      };
    });
  }
}

// Create default client instance
export const createBirdeyeClient = (): BirdeyeClient => {
  return new BirdeyeClientImpl();
};
