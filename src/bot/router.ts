import { Message } from 'node-telegram-bot-api';
import { BotContext, CommandHandler } from './types';
import { SniperCommands } from './commands/sniper';
import { logger } from '../utils/logger';

export class BotRouter {
  private commands: Map<string, CommandHandler> = new Map();
  private sniperCommands: SniperCommands;

  constructor(private context: BotContext) {
    this.sniperCommands = new SniperCommands(
      context.sniperService,
      context.positionManager
    );
    this.registerCommands();
  }

  private registerCommands(): void {
    // Sniper commands
    this.registerCommand({
      command: 'snipe',
      description: 'Snipe a token when liquidity is added',
      handler: (msg: Message, args: string[]) => this.sniperCommands.handleSnipe(msg, args)
    });

    this.registerCommand({
      command: 'stopsnipe',
      description: 'Stop monitoring a token for sniping',
      handler: (msg: Message, args: string[]) => this.sniperCommands.handleStopSnipe(msg, args)
    });

    // Position management commands
    this.registerCommand({
      command: 'positions',
      description: 'View all open positions',
      handler: (msg: Message) => this.sniperCommands.handlePositions(msg)
    });

    this.registerCommand({
      command: 'close',
      description: 'Close a position',
      handler: (msg: Message, args: string[]) => this.sniperCommands.handleClosePosition(msg, args)
    });

    this.registerCommand({
      command: 'update',
      description: 'Update position take profit or stop loss',
      handler: (msg: Message, args: string[]) => this.sniperCommands.handleUpdatePosition(msg, args)
    });
  }

  private registerCommand(handler: CommandHandler): void {
    this.commands.set(handler.command, handler);
  }

  async handleMessage(msg: Message): Promise<void> {
    try {
      const text = msg.text || '';
      if (!text.startsWith('/')) return;

      const [command, ...args] = text.slice(1).split(' ');
      const handler = this.commands.get(command.toLowerCase());

      if (!handler) {
        await msg.reply('Unknown command. Type /help for available commands.');
        return;
      }

      if (handler.adminOnly && !this.isAdmin(msg.from?.id)) {
        await msg.reply('This command is only available to admins.');
        return;
      }

      await handler.handler(msg, args);

    } catch (error) {
      logger.error('Failed to handle message:', {
        chatId: msg.chat.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      await msg.reply(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private isAdmin(userId?: number): boolean {
    if (!userId) return false;
    return this.context.config.adminChatId === userId.toString();
  }

  getCommands(): CommandHandler[] {
    return Array.from(this.commands.values());
  }
} 