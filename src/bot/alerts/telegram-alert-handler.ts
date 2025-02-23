import TelegramBot from 'node-telegram-bot-api';
import { AlertHandler } from '../../trading/monitor/types';
import { PriceAlert } from '../../trading/monitor/types';
import { logger } from '../../utils/logger';
import { formatNumber } from '../../utils/format';

export class TelegramAlertHandler implements AlertHandler {
  private bot: TelegramBot;

  constructor(
    private token: string,
    private chatId: string
  ) {
    this.bot = new TelegramBot(token, { polling: false });
  }

  async onPriceAlert(alert: PriceAlert): Promise<void> {
    try {
      const emoji = alert.changePercent >= 0 ? '📈' : '📉';
      const message = [
        `${emoji} Price Alert: ${alert.token.symbol}`,
        `Old Price: ${formatNumber(alert.oldValue)} SOL`,
        `New Price: ${formatNumber(alert.newValue)} SOL`,
        `Change: ${formatNumber(alert.changePercent)}%`,
        `\nToken: ${alert.token.address}`
      ].join('\n');

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      logger.error('Failed to send price alert:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async onLiquidityAlert(alert: PriceAlert): Promise<void> {
    try {
      const emoji = alert.changePercent >= 0 ? '💧' : '🔥';
      const message = [
        `${emoji} Liquidity Alert: ${alert.token.symbol}`,
        `Old Liquidity: ${formatNumber(alert.oldValue)} SOL`,
        `New Liquidity: ${formatNumber(alert.newValue)} SOL`,
        `Change: ${formatNumber(alert.changePercent)}%`,
        `\nToken: ${alert.token.address}`
      ].join('\n');

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      logger.error('Failed to send liquidity alert:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async onVolumeAlert(alert: PriceAlert): Promise<void> {
    try {
      const emoji = alert.changePercent >= 0 ? '🚀' : '📉';
      const message = [
        `${emoji} Volume Alert: ${alert.token.symbol}`,
        `Old Volume: ${formatNumber(alert.oldValue)} SOL`,
        `New Volume: ${formatNumber(alert.newValue)} SOL`,
        `Change: ${formatNumber(alert.changePercent)}%`,
        `\nToken: ${alert.token.address}`
      ].join('\n');

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      logger.error('Failed to send volume alert:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export function createTelegramAlertHandler(
  token: string,
  chatId: string
): AlertHandler {
  return new TelegramAlertHandler(token, chatId);
} 