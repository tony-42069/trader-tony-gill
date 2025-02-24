import { AlertHandler } from '../../analysis/monitoring/types';
import { TelegramAlertHandler } from './telegram-alert-handler';

export * from './telegram-alert-handler';

export function createTelegramAlertHandler(
  token: string,
  chatId: string
): AlertHandler {
  return new TelegramAlertHandler(token, chatId);
}
