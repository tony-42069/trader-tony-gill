import TelegramBot from 'node-telegram-bot-api';
import { BotContext } from '../types';
import { PublicKey } from '@solana/web3.js';
import { snipeKeyboard } from '../keyboards';
import { formatPnL } from '../../trading';

export const createSnipeCommand = (bot: TelegramBot, context: BotContext) => ({
  command: '/snipe',
  description: 'Snipe a token',
  handler: async (msg: TelegramBot.Message, args: string[]) => {
    const chatId = msg.chat.id.toString();

    if (!args.length) {
      await bot.sendMessage(
        chatId,
        'Please provide a token address and amount to snipe.\nUsage: /snipe <token_address> <amount_in_sol> [slippage] [max_wait_time]'
      );
      return;
    }

    const [tokenAddress, amountStr, slippageStr, maxWaitTimeStr] = args;
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
      await bot.sendMessage(chatId, '❌ Invalid amount specified');
      return;
    }

    try {
      // Validate token address
      new PublicKey(tokenAddress);

      // Parse optional parameters
      const slippage = slippageStr ? parseFloat(slippageStr) : undefined;
      const maxWaitTime = maxWaitTimeStr ? parseInt(maxWaitTimeStr) * 1000 : undefined; // Convert to ms

      await bot.sendMessage(chatId, '🔍 Analyzing token...');

      // Run initial analysis
      const analysis = await context.tokenAnalyzer.analyzeToken(tokenAddress, {
        includePrice: true,
        includeRisk: true
      });

      const riskMessage = `
*Risk Analysis*
Score: ${analysis.risk.score}/100
Buy Tax: ${analysis.risk.buyTax}%
Sell Tax: ${analysis.risk.sellTax}%
Honeypot Risk: ${analysis.risk.isHoneypot ? '⚠️ High' : '✅ Low'}
Verified: ${analysis.metadata.isVerified ? '✅' : '❌'}
Warnings: ${analysis.risk.warnings.length}

Do you want to proceed with sniping?
`;

      // Ask for confirmation
      await bot.sendMessage(chatId, riskMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Snipe',
                callback_data: `snipe_confirm_${tokenAddress}_${amount}_${slippage || ''}_${maxWaitTime || ''}`
              },
              {
                text: '❌ Cancel',
                callback_data: 'snipe_cancel'
              }
            ]
          ]
        }
      });

    } catch (error) {
      context.logger.error('Snipe command failed:', error);
      await bot.sendMessage(
        chatId,
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
});

export const handleSnipeCallback = async (
  bot: TelegramBot,
  context: BotContext,
  query: TelegramBot.CallbackQuery
) => {
  if (!query.message || !query.data) return;

  const chatId = query.message.chat.id.toString();

  if (query.data === 'snipe_cancel') {
    await bot.editMessageText('❌ Snipe cancelled', {
      chat_id: chatId,
      message_id: query.message.message_id
    });
    return;
  }

  if (query.data.startsWith('snipe_confirm_')) {
    const [, , tokenAddress, amountStr, slippageStr, maxWaitTimeStr] = query.data.split('_');
    const amount = parseFloat(amountStr);
    const slippage = slippageStr ? parseFloat(slippageStr) : undefined;
    const maxWaitTime = maxWaitTimeStr ? parseInt(maxWaitTimeStr) : undefined;

    try {
      await bot.editMessageText('🚀 Sniping token...', {
        chat_id: chatId,
        message_id: query.message.message_id
      });

      const result = await context.trader.snipe({
        tokenAddress,
        amount,
        slippage,
        waitForLiquidity: true,
        maxWaitTime,
        antiMev: true
      });

      if (result.success) {
        const message = `
*Snipe Successful* ✅

*Token Info*
Symbol: ${result.analysis.metadata.symbol}
Address: \`${tokenAddress}\`
Entry Price: $${result.price.toFixed(6)}
Amount: ${result.amount} SOL
Value: $${result.value.toFixed(2)}

*Transaction*
Hash: \`${result.transactionHash}\`
Fee: ${result.fee} SOL
${result.waitTime ? `Wait Time: ${(result.waitTime / 1000).toFixed(1)}s` : ''}

Use /position to monitor your position.
`;

        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: snipeKeyboard
        });
      }

    } catch (error) {
      context.logger.error('Snipe execution failed:', error);
      await bot.editMessageText(
        `❌ Snipe failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
    }
  }
};
