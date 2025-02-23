import { AlertHandler, TokenAlert } from '../../analysis/monitoring/types';
import { logger } from '../../utils/logger';
import { formatNumber } from '../../utils/format';
import TelegramBot from 'node-telegram-bot-api';

export class TelegramAlertHandler implements AlertHandler {
  private bot: TelegramBot;

  constructor(
    private token: string,
    private chatId: string
  ) {
    this.bot = new TelegramBot(token, { polling: false });
  }

  async handleAlert(alert: TokenAlert): Promise<void> {
    try {
      const message = this.formatAlertMessage(alert);
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      logger.error('Failed to send alert:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private formatAlertMessage(alert: TokenAlert): string {
    const emoji = this.getAlertEmoji(alert);
    const title = this.getAlertTitle(alert);
    
    return [
      `${emoji} ${title}`,
      `Old Value: ${formatNumber(alert.oldValue)} SOL`,
      `New Value: ${formatNumber(alert.newValue)} SOL`,
      `Change: ${formatNumber(alert.percentageChange)}%`,
      `\nToken: ${alert.tokenAddress}`
    ].join('\n');
  }

  private getAlertEmoji(alert: TokenAlert): string {
    switch (alert.type) {
      case 'price_increase':
        return '📈';
      case 'price_decrease':
        return '📉';
      case 'liquidity_increase':
        return '💧';
      case 'liquidity_decrease':
        return '🔥';
      case 'volume_spike':
        return '🚀';
      case 'volume_drop':
        return '📉';
      case 'high_risk':
        return '⚠️';
      case 'contract_change':
        return '🔄';
      default:
        return '❓';
    }
  }

  private getAlertTitle(alert: TokenAlert): string {
    switch (alert.type) {
      case 'price_increase':
      case 'price_decrease':
        return 'Price Alert';
      case 'liquidity_increase':
      case 'liquidity_decrease':
        return 'Liquidity Alert';
      case 'volume_spike':
      case 'volume_drop':
        return 'Volume Alert';
      case 'high_risk':
        return 'Risk Alert';
      case 'contract_change':
        return 'Contract Alert';
      default:
        return 'Alert';
    }
  }
}

export function createTelegramAlertHandler(
  token: string,
  chatId: string
): AlertHandler {
  return new TelegramAlertHandler(token, chatId);
} 