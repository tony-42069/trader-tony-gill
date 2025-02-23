import { Message } from 'node-telegram-bot-api';
import { SniperService } from '../trading/sniper/types';
import { PositionManager } from '../trading/position/types';
import { logger } from '../utils/logger';
import { SolanaClientImpl } from '../utils/solana/client';
import { WalletManagerImpl } from '../utils/wallet/wallet';
import { TokenAnalyzerImpl } from '../analysis/analyzer';
import { TraderImpl } from '../trading/trader';
import { MonitoringServiceImpl } from '../trading/monitor';

export interface BotConfig {
  token: string;
  adminChatId: string;
  network: string;
  defaultSlippage: number;
  defaultMinLiquidity: number;
  maxRiskScore: number;
  sandwichProtection: boolean;
  simulateFirst: boolean;
  maxPendingTransactions: number;
  maxBlockAge: number;
  retryAttempts: number;
  priorityFee: number;
  computeUnits: number;
  maxGasPrice: number;
  maxExecutionTime: number;
  minConfirmations: number;
}

export interface BotContext {
  config: BotConfig;
  message?: Message;
  logger: typeof logger;
  solanaClient: SolanaClientImpl;
  walletManager: WalletManagerImpl;
  tokenAnalyzer: TokenAnalyzerImpl;
  trader: TraderImpl;
  monitoringService: MonitoringServiceImpl;
  sniperService: SniperService;
  positionManager: PositionManager;
}

export interface CommandHandler {
  command: string;
  description: string;
  adminOnly?: boolean;
  handler: (msg: Message, args: string[]) => Promise<void>;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: Array<Array<InlineKeyboardButton>>;
}

export interface ReplyKeyboardMarkup {
  keyboard: Array<Array<{ text: string }>>;
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export enum BotError {
  UNAUTHORIZED = 'Unauthorized access',
  INVALID_COMMAND = 'Invalid command',
  RATE_LIMITED = 'Too many requests',
  INTERNAL_ERROR = 'Internal error occurred'
}

export interface TelegramMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}

// Extend the Message type from node-telegram-bot-api to include reply method
declare module 'node-telegram-bot-api' {
  interface Message {
    reply(text: string, options?: TelegramMessageOptions): Promise<Message>;
  }
}
