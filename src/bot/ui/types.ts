import { SnipeResult } from '../../trading/sniper';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from '../types';

export type KeyboardType = 'analyzing' | 'preparing' | 'executing' | 'success' | 'error';

export interface CallbackData {
  action: 'refresh' | 'retry' | 'view_tx' | 'confirm' | 'cancel' | 'back' | 'none';
  data?: string;
}

export interface SnipeState {
  status: KeyboardType;
  result?: SnipeResult;
  error?: string;
}

export interface MonitorState {
  active: boolean;
  tokenAddress?: string;
  lastUpdate?: Date;
  alerts: {
    price?: number;
    volume?: number;
    liquidity?: number;
  };
}

export interface UserSettings {
  defaultSlippage: number;
  maxGasPrice: number;
  notifications: {
    price: boolean;
    volume: boolean;
    liquidity: boolean;
  };
}

export interface MessageOptions {
  chat_id: number | string;
  message_id?: number;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}

export interface WelcomeMessageData {
  walletAddress: string;
  balance: number;
  orderCount: number;
  securityStatus: string;
  username?: string;
  version?: string;
  network?: string;
}

export interface SniperStatusData {
  status: string;
  snipeCount: number;
  successRate: number;
  protectionStatus: string;
  tokenAddress?: string; // Make optional
}
