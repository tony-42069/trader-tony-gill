import TelegramBot from 'node-telegram-bot-api';
import { AlertHandler, PriceAlert, AlertType } from '../trading/monitor/types';
import { logger } from '../utils/logger';
import { formatPnL } from '../trading';

export class TelegramAlertHandler implements AlertHandler {
  constructor(private bot: TelegramBot) {}

  private async sendAlert(alert: PriceAlert, emoji: string, type: string): Promise<void> {
    try {
      const message = `
${emoji} *${type} Alert*

*${alert.token.symbol}*
Address: \`${alert.token.address}\`

Old Value: ${this.formatValue(alert.oldValue, alert.type)}
New Value: ${this.formatValue(alert.newValue, alert.type)}
Change: ${formatPnL(alert.changePercent)}

Time: ${alert.timestamp.toLocaleString()}

Use /monitor to check all your monitored tokens.`;

      await this.bot.sendMessage(alert.token.userId, message, {
        parse_mode: 'Markdown'
      });

    } catch (error) {
      logger.error('Failed to send alert:', {
        type,
        tokenAddress: alert.token.address,
        userId: alert.token.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private formatValue(value: number, type: AlertType): string {
    switch (type) {
      case AlertType.PRICE_INCREASE:
      case AlertType.PRICE_DECREASE:
        return `$${value.toFixed(6)}`;
      case AlertType.LIQUIDITY_INCREASE:
      case AlertType.LIQUIDITY_DECREASE:
        return `${value.toFixed(2)} SOL`;
      case AlertType.VOLUME_SPIKE:
      case AlertType.VOLUME_DROP:
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  }

  async onPriceAlert(alert: PriceAlert): Promise<void> {
    const emoji = alert.type === AlertType.PRICE_INCREASE ? '📈' : '📉';
    await this.sendAlert(alert, emoji, 'Price');
  }

  async onLiquidityAlert(alert: PriceAlert): Promise<void> {
    const emoji = alert.type === AlertType.LIQUIDITY_INCREASE ? '💧' : '🔥';
    await this.sendAlert(alert, emoji, 'Liquidity');
  }

  async onVolumeAlert(alert: PriceAlert): Promise<void> {
    const emoji = alert.type === AlertType.VOLUME_SPIKE ? '🚀' : '📊';
    await this.sendAlert(alert, emoji, 'Volume');
  }
}
