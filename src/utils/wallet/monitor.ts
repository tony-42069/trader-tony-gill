import { WalletManager, BalanceMonitor, BalanceChangeEvent, ThresholdAlertEvent } from './types';
import { logger, createLogContext } from '../logger';
import EventEmitter from 'events';

const DEFAULT_CHECK_INTERVAL = 60000; // 1 minute
const DEFAULT_RETRY_INTERVAL = 5000;  // 5 seconds
const MAX_RETRIES = 3;

export class BalanceMonitorImpl extends EventEmitter implements BalanceMonitor {
  private isRunning: boolean = false;
  private lastCheck: number = 0;
  private monitoringInterval?: NodeJS.Timeout;
  private lastBalance: number = 0;
  private retryCount: number = 0;
  private logContext = createLogContext();

  constructor(
    private wallet: WalletManager,
    private checkInterval: number = DEFAULT_CHECK_INTERVAL
  ) {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.on('balanceChange', (event: BalanceChangeEvent) => {
      logger.info('Balance change detected', {
        ...event,
        publicKey: this.wallet.getPublicKey().toString()
      });
    });

    this.on('thresholdAlert', (event: ThresholdAlertEvent) => {
      logger.warn('Balance threshold alert', {
        ...event,
        publicKey: this.wallet.getPublicKey().toString()
      });
    });
  }

  startMonitoring(): void {
    if (this.isRunning) {
      logger.warn('Balance monitor already running');
      return;
    }

    this.isRunning = true;
    this.lastCheck = Date.now();

    // Initial balance check
    this.checkBalance().catch(error => {
      logger.error('Initial balance check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });

    // Start periodic monitoring
    this.monitoringInterval = setInterval(
      () => this.checkBalance(),
      this.checkInterval
    );

    logger.info('Balance monitoring started', {
      interval: this.checkInterval,
      publicKey: this.wallet.getPublicKey().toString()
    });
  }

  stopMonitoring(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.isRunning = false;
    logger.info('Balance monitoring stopped', {
      publicKey: this.wallet.getPublicKey().toString()
    });
  }

  async checkBalance(): Promise<number> {
    try {
      const currentBalance = await this.wallet.getBalance();
      this.lastCheck = Date.now();
      this.retryCount = 0; // Reset retry count on successful check

      // Check for balance changes
      if (currentBalance !== this.lastBalance) {
        const event: BalanceChangeEvent = {
          oldBalance: this.lastBalance,
          newBalance: currentBalance,
          change: currentBalance - this.lastBalance,
          timestamp: Date.now()
        };
        this.emit('balanceChange', event);
      }

      // Update last known balance
      this.lastBalance = currentBalance;

      return currentBalance;
    } catch (error) {
      this.handleError(error);
      return this.lastBalance;
    }
  }

  private async handleError(error: unknown): Promise<void> {
    logger.error('Balance check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      retryCount: this.retryCount,
      publicKey: this.wallet.getPublicKey().toString()
    });

    // Implement retry logic
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      logger.info('Retrying balance check', {
        attempt: this.retryCount,
        delay: DEFAULT_RETRY_INTERVAL
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_INTERVAL));
      await this.checkBalance();
    }

    // Max retries reached
    logger.error('Max retry attempts reached', {
      maxRetries: MAX_RETRIES,
      publicKey: this.wallet.getPublicKey().toString()
    });
  }

  getLastCheck(): number {
    return this.lastCheck;
  }

  isMonitoring(): boolean {
    return this.isRunning;
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

// Create monitor instance
export const createBalanceMonitor = (
  wallet: WalletManager,
  checkInterval?: number
): BalanceMonitor => {
  return new BalanceMonitorImpl(wallet, checkInterval);
};
