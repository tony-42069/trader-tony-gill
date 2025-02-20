import TelegramBot from 'node-telegram-bot-api';
import { Logger } from 'winston';
import { BotConfig, BotContext, CommandHandler, BotError } from './types';
import {
  mainMenuKeyboard,
  walletKeyboard,
  snipeKeyboard,
  monitorKeyboard,
  settingsKeyboard
} from './keyboards';
import { handleCallbacks } from './commands';

export class TraderTonyBot {
  private bot: TelegramBot;
  private commands: Map<string, CommandHandler>;
  private rateLimits: Map<string, number>;
  private readonly RATE_LIMIT_WINDOW = 1000; // 1 second
  private readonly MAX_REQUESTS = 5; // Max 5 requests per second

  constructor(
    private config: BotConfig,
    private context: BotContext
  ) {
    this.bot = new TelegramBot(config.token, { polling: true });
    this.commands = new Map();
    this.rateLimits = new Map();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.bot.on('polling_error', (error: Error) => {
      this.context.logger.error('Telegram polling error:', error.message);
    });

    this.bot.on('error', (error: Error) => {
      this.context.logger.error('Telegram bot error:', error.message);
    });

    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  private setupCallbackQueryHandler(): void {
    this.bot.on('callback_query', async (query) => {
      if (!query.message || !query.data) return;

      const chatId = query.message.chat.id.toString();

      try {
        // Authorization check
        if (!this.isAuthorized(chatId)) {
          await this.bot.answerCallbackQuery(query.id, {
            text: BotError.UNAUTHORIZED,
            show_alert: true
          });
          return;
        }

        // Rate limiting
        if (this.isRateLimited(chatId)) {
          await this.bot.answerCallbackQuery(query.id, {
            text: BotError.RATE_LIMITED,
            show_alert: true
          });
          return;
        }

      // Handle callback data based on prefix
      const [prefix] = query.data.split('_');
      const handler = handleCallbacks[prefix as keyof typeof handleCallbacks];
      
      if (handler) {
        await handler(this.bot, this.context, query);
      } else {
        await this.handleCallbackQuery(query);
      }
        
      } catch (error) {
        this.context.logger.error('Error handling callback query:', error);
        await this.bot.answerCallbackQuery(query.id, {
          text: `${BotError.INTERNAL_ERROR}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          show_alert: true
        });
      }
    });
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery): Promise<void> {
    if (!query.message || !query.data) return;

    const chatId = query.message.chat.id.toString();
    const data = query.data;

    // Handle navigation
    if (data === 'main_menu') {
      await this.showMainMenu(chatId);
      await this.bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle wallet actions
    if (data.startsWith('wallet_')) {
      await this.handleWalletCallback(chatId, data);
      await this.bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle sniper actions
    if (data.startsWith('snipe_')) {
      await this.handleSnipeCallback(chatId, data);
      await this.bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle monitor actions
    if (data.startsWith('monitor_')) {
      await this.handleMonitorCallback(chatId, data);
      await this.bot.answerCallbackQuery(query.id);
      return;
    }

    // Handle settings actions
    if (data.startsWith('settings_')) {
      await this.handleSettingsCallback(chatId, data);
      await this.bot.answerCallbackQuery(query.id);
      return;
    }

    await this.bot.answerCallbackQuery(query.id);
  }

  private async showMainMenu(chatId: string): Promise<void> {
    const message = `
*TraderTony Menu* 🤖

Choose an option:
🔹 Wallet - Manage your wallet
🔹 Snipe - Trade tokens
🔹 Monitor - Track prices
🔹 Settings - Configure bot
`;

    await this.bot.sendMessage(chatId, message, {
      reply_markup: mainMenuKeyboard,
      parse_mode: 'Markdown'
    });
  }

  private async handleWalletCallback(chatId: string, data: string): Promise<void> {
    switch (data) {
      case 'wallet_balance':
        const balance = await this.context.walletManager.getBalance();
        await this.bot.sendMessage(chatId, `Current Balance: ${balance / 1e9} SOL`, {
          reply_markup: walletKeyboard
        });
        break;

      case 'wallet_address':
        const address = this.context.walletManager.getPublicKey().toString();
        await this.bot.sendMessage(chatId, `Wallet Address: \`${address}\``, {
          parse_mode: 'Markdown',
          reply_markup: walletKeyboard
        });
        break;

      case 'wallet_refresh':
        await this.commands.get('/wallet')?.handler(
          { chat: { id: parseInt(chatId) } } as TelegramBot.Message,
          []
        );
        break;
    }
  }

  private async handleSnipeCallback(chatId: string, data: string): Promise<void> {
    // Placeholder for snipe functionality
    await this.bot.sendMessage(chatId, 'Snipe functionality coming soon!', {
      reply_markup: snipeKeyboard
    });
  }

  private async handleMonitorCallback(chatId: string, data: string): Promise<void> {
    // Placeholder for monitor functionality
    await this.bot.sendMessage(chatId, 'Monitor functionality coming soon!', {
      reply_markup: monitorKeyboard
    });
  }

  private async handleSettingsCallback(chatId: string, data: string): Promise<void> {
    // Placeholder for settings functionality
    await this.bot.sendMessage(chatId, 'Settings functionality coming soon!', {
      reply_markup: settingsKeyboard
    });
  }

  private isAuthorized(chatId: string): boolean {
    if (chatId === this.config.adminChatId) return true;
    return this.config.allowedUsers?.includes(chatId) ?? false;
  }

  private isRateLimited(chatId: string): boolean {
    const now = Date.now();
    const lastRequest = this.rateLimits.get(chatId) || 0;
    
    if (now - lastRequest < this.RATE_LIMIT_WINDOW) {
      return true;
    }
    
    this.rateLimits.set(chatId, now);
    return false;
  }

  public registerCommand(handler: CommandHandler): void {
    this.commands.set(handler.command, handler);
    this.context.logger.info(`Registered command: ${handler.command}`);
  }

  public async start(): Promise<void> {
    this.setupCallbackQueryHandler();
    this.bot.on('message', async (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id.toString();

      try {
        // Authorization check
        if (!this.isAuthorized(chatId)) {
          await this.bot.sendMessage(chatId, BotError.UNAUTHORIZED);
          this.context.logger.warn(`Unauthorized access attempt from chat ID: ${chatId}`);
          return;
        }

        // Rate limiting
        if (this.isRateLimited(chatId)) {
          await this.bot.sendMessage(chatId, BotError.RATE_LIMITED);
          return;
        }

        // Command parsing
        if (!msg.text?.startsWith('/')) return;

        const [command, ...args] = msg.text.split(' ');
        const handler = this.commands.get(command);

        if (!handler) {
          await this.bot.sendMessage(chatId, BotError.INVALID_COMMAND);
          return;
        }

        // Admin command check
        if (handler.adminOnly && chatId !== this.config.adminChatId) {
          await this.bot.sendMessage(chatId, BotError.UNAUTHORIZED);
          return;
        }

        // Execute command
        await handler.handler(msg, args);
        this.context.logger.info(`Executed command ${command} for chat ID: ${chatId}`);

      } catch (error) {
        this.context.logger.error('Error processing message:', error);
        await this.bot.sendMessage(
          chatId,
          `${BotError.INTERNAL_ERROR}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    this.context.logger.info('TraderTony bot started successfully');
  }

  public async stop(): Promise<void> {
    await this.bot.stopPolling();
    this.context.logger.info('TraderTony bot stopped');
  }

  public async sendMessage(chatId: string, message: string): Promise<void> {
    await this.bot.sendMessage(chatId, message);
  }

  public getBot(): TelegramBot {
    return this.bot;
  }
}
