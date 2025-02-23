import { TelegramBot } from '../types';
import { AlertHandler } from '../../analysis/monitoring/types';
import { TelegramAlertHandler } from './telegram-alert-handler';

export * from './telegram-alert-handler';

export function createTelegramAlertHandler(
  bot: TelegramBot,
  chatId: string
): AlertHandler {
  return new TelegramAlertHandler(bot, chatId);
} 