import TelegramBot from 'node-telegram-bot-api';
import { BotContext } from '../types';
import { PublicKey } from '@solana/web3.js';
import { monitorKeyboard } from '../keyboards';
import { formatPnL } from '../../trading';
import { MonitorError, MonitorErrorCode, MonitoredToken } from '../../trading/monitor';

export const createMonitorCommand = (bot: TelegramBot, context: BotContext) => ({
  command: '/monitor',
  description: 'Monitor a token',
  handler: async (msg: TelegramBot.Message, args: string[]) => {
    const chatId = msg.chat.id.toString();

    if (!args.length) {
      const tokens = await context.monitoringService.getUserTokens(chatId);
      if (!tokens.length) {
        await bot.sendMessage(
          chatId,
          'You are not monitoring any tokens.\n\nUsage: /monitor <token_address> [price_alert] [liquidity_alert]'
        );
        return;
      }

      // Show monitored tokens
      const message = `
*Monitored Tokens* 📊

${tokens.map((token: MonitoredToken) => `
*${token.symbol}*
Address: \`${token.address}\`
Price Alert: ${token.priceChangeAlert}%
Liquidity Alert: ${token.liquidityChangeAlert}%
Volume Alert: ${token.volumeChangeAlert}%
Last Checked: ${token.lastChecked.toLocaleString()}
`).join('\n')}

Use the menu below to manage your monitored tokens:
`;

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: monitorKeyboard
      });
      return;
    }

    const [tokenAddress, priceAlertStr, liquidityAlertStr, volumeAlertStr] = args;

    try {
      // Validate token address
      new PublicKey(tokenAddress);

      // Parse alert thresholds
      const priceAlert = priceAlertStr ? parseFloat(priceAlertStr) : undefined;
      const liquidityAlert = liquidityAlertStr ? parseFloat(liquidityAlertStr) : undefined;
      const volumeAlert = volumeAlertStr ? parseFloat(volumeAlertStr) : undefined;

      await bot.sendMessage(chatId, '🔍 Analyzing token...');

      // Run initial analysis
      const analysis = await context.tokenAnalyzer.analyzeToken(tokenAddress, {
        includePrice: true,
        includeRisk: true
      });

      // Add token to monitoring
      const token = await context.monitoringService.addToken(tokenAddress, chatId, {
        priceAlert,
        liquidityAlert,
        volumeAlert
      });

      const message = `
*Token Added to Monitoring* ✅

Symbol: ${token.symbol}
Address: \`${token.address}\`

*Current Status*
Price: $${analysis.price.price.toFixed(6)}
Liquidity: ${analysis.price.liquidity.toFixed(2)} SOL
Volume: $${analysis.price.volume24h.toLocaleString()}

*Alert Settings*
Price Change: ${token.priceChangeAlert}%
Liquidity Change: ${token.liquidityChangeAlert}%
Volume Change: ${token.volumeChangeAlert}%

You will be notified when these thresholds are reached.
`;

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: monitorKeyboard
      });

    } catch (error) {
      let errorMessage = 'Failed to add token to monitoring';

      if (error instanceof MonitorError) {
        switch (error.code) {
          case MonitorErrorCode.TOKEN_ALREADY_MONITORED:
            errorMessage = 'This token is already being monitored';
            break;
          case MonitorErrorCode.MAX_TOKENS_REACHED:
            errorMessage = 'Maximum number of monitored tokens reached';
            break;
          case MonitorErrorCode.INVALID_ALERT_VALUE:
            errorMessage = 'Invalid alert value provided';
            break;
        }
      }

      context.logger.error('Monitor command failed:', error);
      await bot.sendMessage(
        chatId,
        `❌ ${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
});

export const handleMonitorCallback = async (
  bot: TelegramBot,
  context: BotContext,
  query: TelegramBot.CallbackQuery
) => {
  if (!query.message || !query.data) return;

  const chatId = query.message.chat.id.toString();

  if (query.data === 'monitor_view') {
    try {
      const tokens = await context.monitoringService.getUserTokens(chatId);
      if (!tokens.length) {
        await bot.editMessageText(
          'You are not monitoring any tokens.\n\nUse /monitor <token_address> to start monitoring.',
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: monitorKeyboard
          }
        );
        return;
      }

      // Get current status for all tokens
      const statusPromises = tokens.map(token =>
        context.monitoringService.getTokenStatus(token.address, chatId)
      );
      const statuses = await Promise.all(statusPromises);

      const message = `
*Monitored Tokens Status* 📊

${tokens.map((token: MonitoredToken, i: number) => {
  const status = statuses[i];
  if (!status) return '';
  return `
*${token.symbol}*
Price: $${status.price.toFixed(6)} (${formatPnL(status.priceChange)})
Liquidity: ${status.liquidity.toFixed(2)} SOL (${formatPnL(status.liquidityChange)})
Volume: $${status.volume.toLocaleString()} (${formatPnL(status.volumeChange)})
Last Updated: ${status.lastUpdated.toLocaleString()}
`;
}).join('\n')}
`;

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: monitorKeyboard
      });

    } catch (error) {
      context.logger.error('Monitor view failed:', error);
      await bot.editMessageText(
        `❌ Failed to get token status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: monitorKeyboard
        }
      );
    }
  }

  if (query.data === 'monitor_add') {
    await bot.editMessageText(
      'To add a token to monitoring, use:\n/monitor <token_address> [price_alert] [liquidity_alert] [volume_alert]\n\nExample:\n/monitor Ae9qw... 10 20 50',
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: monitorKeyboard
      }
    );
  }

  if (query.data === 'monitor_refresh') {
    try {
      const tokens = await context.monitoringService.getUserTokens(chatId);
      if (!tokens.length) {
        await bot.editMessageText(
          'No tokens to refresh.\n\nUse /monitor <token_address> to start monitoring.',
          {
            chat_id: chatId,
            message_id: query.message.message_id,
            reply_markup: monitorKeyboard
          }
        );
        return;
      }

      await bot.editMessageText('🔄 Refreshing token data...', {
        chat_id: chatId,
        message_id: query.message.message_id
      });

      // Get fresh status for all tokens
      const statusPromises = tokens.map(token =>
        context.monitoringService.getTokenStatus(token.address, chatId)
      );
      const statuses = await Promise.all(statusPromises);

      const message = `
*Token Status Updated* ✅

${tokens.map((token: MonitoredToken, i: number) => {
  const status = statuses[i];
  if (!status) return '';
  return `
*${token.symbol}*
Price: $${status.price.toFixed(6)} (${formatPnL(status.priceChange)})
Liquidity: ${status.liquidity.toFixed(2)} SOL (${formatPnL(status.liquidityChange)})
Volume: $${status.volume.toLocaleString()} (${formatPnL(status.volumeChange)})
Last Updated: ${status.lastUpdated.toLocaleString()}
`;
}).join('\n')}
`;

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: monitorKeyboard
      });

    } catch (error) {
      context.logger.error('Monitor refresh failed:', error);
      await bot.editMessageText(
        `❌ Failed to refresh token data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          reply_markup: monitorKeyboard
        }
      );
    }
  }
};
