import { Message } from 'node-telegram-bot-api';
import { Logger } from 'winston';
import { SolanaClientImpl } from '../utils/solana/client';
import { WalletManagerImpl } from '../utils/wallet/wallet';
import { TokenAnalyzerImpl } from '../analysis/analyzer';
import { TraderImpl } from '../trading/trader';
import { MonitoringServiceImpl } from '../trading/monitor';

export interface BotConfig {
  token: string;
  adminChatId: string;
  allowedUsers?: string[];
}

export interface BotContext {
  logger: Logger;
  solanaClient: SolanaClientImpl;
  walletManager: WalletManagerImpl;
  tokenAnalyzer: TokenAnalyzerImpl;
  trader: TraderImpl;
  monitoringService: MonitoringServiceImpl;
}

export interface CommandHandler {
  command: string;
  description: string;
  adminOnly?: boolean;
  handler: (msg: Message, args: string[]) => Promise<void>;
}

export interface KeyboardButton {
  text: string;
  callback_data: string;
}

export interface KeyboardLayout {
  inline_keyboard: KeyboardButton[][];
}

export enum BotError {
  UNAUTHORIZED = 'Unauthorized access',
  INVALID_COMMAND = 'Invalid command',
  RATE_LIMITED = 'Too many requests',
  INTERNAL_ERROR = 'Internal error occurred'
}
