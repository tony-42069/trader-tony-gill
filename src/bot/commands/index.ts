import TelegramBot from 'node-telegram-bot-api';
import { CommandHandler, BotContext } from '../types';
import { 
  mainKeyboard, 
  buyKeyboard,
  getWelcomeMessage,
  getSuccessMessage,
  getErrorMessage 
} from '../ui';
import { createAnalyzeCommand } from './analyze';
import { createSnipeCommand, handleSnipeCallback } from './snipe';
import { createMonitorCommand, handleMonitorCallback } from './monitor';
import { TransactionHistory } from '../../utils/wallet/types';

const createHandler = (
  bot: TelegramBot,
  context: BotContext,
  handler: (msg: TelegramBot.Message, args: string[]) => Promise<void>
): (msg: TelegramBot.Message, args: string[]) => Promise<void> => {
  return async (msg: TelegramBot.Message, args: string[]) => {
    await handler(msg, args);
  };
};

export const createStartCommand = (bot: TelegramBot, context: BotContext): CommandHandler => ({
  command: '/start',
  description: 'Initialize the bot and display welcome message',
  handler: createHandler(bot, context, async (msg: TelegramBot.Message, _args: string[]) => {
    const chatId = msg.chat.id.toString();

    const welcomeData = {
      walletAddress: context.walletManager.getPublicKey().toString(),
      balance: await context.walletManager.getBalance() / 1e9,
      orderCount: 0,
      securityStatus: '🔒 Secure'
    };

    // Send single welcome message with menu
    await bot.sendMessage(chatId, getWelcomeMessage(welcomeData), {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: mainKeyboard
    });
  })
});

export const createHelpCommand = (bot: TelegramBot, context: BotContext): CommandHandler => ({
  command: '/help',
  description: 'Display available commands and usage information',
  handler: createHandler(bot, context, async (msg: TelegramBot.Message, _args: string[]) => {
    const chatId = msg.chat.id.toString();

    const helpMessage = `
*TraderTony Help Center* 🤖

*Core Features*
🎯 SNIPERTONY - Advanced sniping system
💰 Smart Trading - Auto TP/SL, Anti-Rug
📊 Real-time Monitoring - Price & Volume
🔒 Secure Wallet Integration

*Available Commands*
/start - Launch TraderTony
/help - Show this menu
/snipe <token> <amount> - Quick snipe
/monitor <token> - Track token

*Need more help?*
Select an option from the menu below:
`;

    await bot.sendMessage(chatId, helpMessage, {
      reply_markup: mainKeyboard,
      parse_mode: 'Markdown'
    });
  })
});

export const createWalletCommand = (bot: TelegramBot, context: BotContext): CommandHandler => ({
  command: '/wallet',
  description: 'Display wallet information and balance',
  handler: createHandler(bot, context, async (msg: TelegramBot.Message, _args: string[]) => {
    const chatId = msg.chat.id.toString();

    try {
      const balance = await context.walletManager.getBalance();
      const publicKey = context.walletManager.getPublicKey().toString();
      const state = context.walletManager.getState();

      const walletMessage = `
*TraderTony Wallet* 💼

*Balance:* ${balance / 1e9} SOL
*Status:* ${state.isActive ? '🟢 Active' : '🔴 Inactive'}

*Your Address*
\`${publicKey}\` (tap to copy)

*Recent Activity*
${state.transactions.slice(0, 3).map((tx: TransactionHistory) => `
🔹 ${tx.type.toUpperCase()}: ${tx.amount} SOL
   ${tx.status} • ${new Date(tx.timestamp).toLocaleString()}
`).join('\n')}

Select an action below:
`;

      await bot.sendMessage(chatId, walletMessage, {
        reply_markup: buyKeyboard,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      await bot.sendMessage(
        chatId,
        getErrorMessage(`Error fetching wallet information: ${error instanceof Error ? error.message : 'Unknown error'}`),
        { parse_mode: 'Markdown' }
      );
    }
  })
});

// Create and export command factory
export const createCommands = (bot: TelegramBot, context: BotContext): CommandHandler[] => [
  createStartCommand(bot, context),
  createHelpCommand(bot, context),
  createWalletCommand(bot, context),
  createAnalyzeCommand(bot, context),
  createSnipeCommand(bot, context),
  createMonitorCommand(bot, context)
];

// Export callback handlers
export const handleCallbacks = {
  snipe: handleSnipeCallback,
  monitor: handleMonitorCallback
};
export * from './analyze';
export * from './snipe';
export * from './monitor';
