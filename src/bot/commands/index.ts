import TelegramBot from 'node-telegram-bot-api';
import { CommandHandler, BotContext } from '../types';
import { mainMenuKeyboard, walletKeyboard } from '../keyboards';
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
    const firstName = msg.from?.first_name || 'User';

    const welcomeMessage = `
Welcome to TraderTony, ${firstName}! 🚀

I'm your Solana trading assistant. Here's what I can do:

🔹 Monitor token prices and liquidity
🔹 Execute trades with custom parameters
🔹 Manage your wallet and positions
🔹 Provide real-time market insights

Use the menu below to get started:
`;

    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: mainMenuKeyboard,
      parse_mode: 'Markdown'
    });
  })
});

export const createHelpCommand = (bot: TelegramBot, context: BotContext): CommandHandler => ({
  command: '/help',
  description: 'Display available commands and usage information',
  handler: createHandler(bot, context, async (msg: TelegramBot.Message, _args: string[]) => {
    const chatId = msg.chat.id.toString();

    const helpMessage = `
*Available Commands:*

📝 *Basic Commands*
/start - Initialize the bot
/help - Show this help message
/menu - Display main menu

💰 *Wallet Commands*
/wallet - View wallet info and balance
/address - Show your wallet address

🎯 *Trading Commands*
/snipe <token> - Quick snipe a token
/monitor <token> - Monitor token price
/position - View active positions

⚙️ *Settings Commands*
/settings - Configure bot settings
/risk - Adjust risk parameters
/fees - Set priority fees

Need more help? Use the menu below:
`;

    await bot.sendMessage(chatId, helpMessage, {
      reply_markup: mainMenuKeyboard,
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
*Wallet Information* 💼

*Address:* \`${publicKey}\`
*Balance:* ${balance / 1e9} SOL
*Status:* ${state.isActive ? '🟢 Active' : '🔴 Inactive'}
*Last Updated:* ${new Date(state.lastUpdated).toLocaleString()}

Recent Transactions:
${state.transactions.slice(0, 3).map((tx: TransactionHistory) => `
🔹 ${tx.type.toUpperCase()}: ${tx.amount} SOL
   Status: ${tx.status}
   Time: ${new Date(tx.timestamp).toLocaleString()}
`).join('\n')}

Use the menu below to manage your wallet:
`;

      await bot.sendMessage(chatId, walletMessage, {
        reply_markup: walletKeyboard,
        parse_mode: 'Markdown'
      });
    } catch (error) {
      await bot.sendMessage(
        chatId,
        `Error fetching wallet information: ${error instanceof Error ? error.message : 'Unknown error'}`
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
