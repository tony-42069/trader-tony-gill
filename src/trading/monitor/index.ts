import TelegramBot from 'node-telegram-bot-api';
import { TokenAnalyzerImpl } from '../../analysis/analyzer';
import { logger } from '../../utils/logger';
import { config } from '../../config/settings';
import { MonitoringServiceImpl } from './service';
import { AlertHandler } from './types';

export * from './types';
export { MonitorError } from './errors';
export * from './service';

// Create alert handler that uses Telegram bot
export const createTelegramAlertHandler = (
  bot: TelegramBot,
  formatPnL: (value: number) => string
): AlertHandler => ({
  async onPriceAlert(alert) {
    const message = `
*Price Alert* 📊

Token: ${alert.token.symbol}
Address: \`${alert.token.address}\`
Change: ${formatPnL(alert.changePercent)}
Old Price: $${alert.oldValue.toFixed(6)}
New Price: $${alert.newValue.toFixed(6)}
`;

    await bot.sendMessage(alert.token.userId, message, {
      parse_mode: 'Markdown'
    });
  },

  async onLiquidityAlert(alert) {
    const message = `
*Liquidity Alert* 💧

Token: ${alert.token.symbol}
Address: \`${alert.token.address}\`
Change: ${formatPnL(alert.changePercent)}
Old Liquidity: ${alert.oldValue.toFixed(2)} SOL
New Liquidity: ${alert.newValue.toFixed(2)} SOL
`;

    await bot.sendMessage(alert.token.userId, message, {
      parse_mode: 'Markdown'
    });
  },

  async onVolumeAlert(alert) {
    const message = `
*Volume Alert* 📈

Token: ${alert.token.symbol}
Address: \`${alert.token.address}\`
Change: ${formatPnL(alert.changePercent)}
Old Volume: $${alert.oldValue.toLocaleString()}
New Volume: $${alert.newValue.toLocaleString()}
`;

    await bot.sendMessage(alert.token.userId, message, {
      parse_mode: 'Markdown'
    });
  }
});

// Create monitoring service factory
export const createMonitoringService = (
  tokenAnalyzer: TokenAnalyzerImpl,
  alertHandler: AlertHandler
) => {
  logger.info('Initializing monitoring service');
  
  return new MonitoringServiceImpl(
    tokenAnalyzer,
    alertHandler,
    {
      priceChangeThreshold: config.monitoring.priceChangeThreshold,
      liquidityChangeThreshold: config.monitoring.liquidityChangeThreshold,
      volumeChangeThreshold: config.monitoring.volumeSpikeThreshold,
      alertCooldown: config.monitoring.alertCooldown,
      maxTokensPerUser: config.monitoring.maxPoolsPerUser,
      checkInterval: config.monitoring.checkInterval
    }
  );
};
