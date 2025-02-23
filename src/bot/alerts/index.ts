import { TelegramBot } from '../types';
import { AlertHandler } from '../../analysis/monitoring/types';
import { TelegramAlertHandler } from './telegram-alert-handler';

export * from './telegram-alert-handler';

export const createTelegramAlertHandler = (bot: TelegramBot): AlertHandler => {
  return new TelegramAlertHandler(bot);
}; 