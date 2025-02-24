import { InlineKeyboardMarkup } from './types';

export const mainMenuKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '💰 Wallet', callback_data: 'wallet' },
      { text: '🎯 Snipe', callback_data: 'snipe' }
    ],
    [
      { text: '📊 Monitor', callback_data: 'monitor' },
      { text: '⚙️ Settings', callback_data: 'settings' }
    ],
    [
      { text: '❓ Help', callback_data: 'help' }
    ]
  ]
};

export const walletKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '💵 Balance', callback_data: 'wallet_balance' },
      { text: '📋 Address', callback_data: 'wallet_address' }
    ],
    [
      { text: '🔄 Refresh', callback_data: 'wallet_refresh' },
      { text: '⬅️ Back', callback_data: 'main_menu' }
    ]
  ]
};

export const snipeKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🚀 Quick Snipe', callback_data: 'snipe_quick' },
      { text: '⚡ Auto Snipe', callback_data: 'snipe_auto' }
    ],
    [
      { text: '📝 Custom Settings', callback_data: 'snipe_settings' },
      { text: '⬅️ Back', callback_data: 'main_menu' }
    ]
  ]
};

export const monitorKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '👀 View Monitored', callback_data: 'monitor_view' },
      { text: '➕ Add Token', callback_data: 'monitor_add' }
    ],
    [
      { text: '🔄 Refresh All', callback_data: 'monitor_refresh' },
      { text: '⬅️ Back', callback_data: 'main_menu' }
    ]
  ]
};

export const settingsKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '⚙️ Trading', callback_data: 'settings_trading' },
      { text: '🛡️ Risk', callback_data: 'settings_risk' }
    ],
    [
      { text: '📊 Monitoring', callback_data: 'settings_monitoring' },
      { text: '⬅️ Back', callback_data: 'main_menu' }
    ]
  ]
};

export const confirmationKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '✅ Confirm', callback_data: 'confirm' },
      { text: '❌ Cancel', callback_data: 'cancel' }
    ]
  ]
};

export const backKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '⬅️ Back', callback_data: 'main_menu' }
    ]
  ]
};
