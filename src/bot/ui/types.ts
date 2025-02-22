import { SnipeResult } from '../../trading/sniper';

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

export interface KeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: KeyboardButton[][];
}

export interface MessageOptions {
  chat_id: number | string;
  message_id?: number;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: InlineKeyboardMarkup;
}
