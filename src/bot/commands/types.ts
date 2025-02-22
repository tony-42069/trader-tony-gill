import TelegramBot, { Message } from 'node-telegram-bot-api';

export interface BotCommand {
  name: string;
  description: string;
  execute: (bot: TelegramBot, msg: Message, args: string[]) => Promise<void>;
}
