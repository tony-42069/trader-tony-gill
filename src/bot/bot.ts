import TelegramBot from 'node-telegram-bot-api';
import { BotConfig, BotContext } from './types';
import { BotRouter } from './router';
import { logger } from '../utils/logger';

export class TraderTonyBot {
  private bot: TelegramBot;
  private router: BotRouter;

  constructor(private context: BotContext) {
    this.bot = new TelegramBot(context.config.token, { polling: true });
    this.router = new BotRouter(context);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handle all messages
    this.bot.on('message', async (msg) => {
      try {
        await this.router.handleMessage(msg);
      } catch (error) {
        logger.error('Failed to handle message:', {
          chatId: msg.chat.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Handle errors
    this.bot.on('error', (error) => {
      logger.error('Telegram bot error:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram bot polling error:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });

    // Set bot commands
    const commands = this.router.getCommands().map(cmd => ({
      command: cmd.command,
      description: cmd.description
    }));

    this.bot.setMyCommands(commands).catch(error => {
      logger.error('Failed to set bot commands:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });

    logger.info('Bot handlers setup complete');
  }

  async start(): Promise<void> {
    try {
      const me = await this.bot.getMe();
      logger.info('Bot started successfully', {
        username: me.username,
        firstName: me.first_name
      });

      // Send startup message to admin
      await this.bot.sendMessage(
        this.context.config.adminChatId,
        '🚀 TraderTony Bot started!\n\nType /help to see available commands.'
      );

    } catch (error) {
      logger.error('Failed to start bot:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.bot.stopPolling();
      logger.info('Bot stopped successfully');

    } catch (error) {
      logger.error('Failed to stop bot:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
} 