import { InlineKeyboardMarkup } from '../types';

export const mainKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '💰 Buy', callback_data: 'buy' },
      { text: '💳 Fund', callback_data: 'fund' }
    ],
    [
      { text: '📊 Monitor', callback_data: 'monitor' },
      { text: '⏰ Limit Orders', callback_data: 'limit_orders' }
    ],
    [
      { text: '💼 Wallet', callback_data: 'wallet' },
      { text: '⚙️ Settings', callback_data: 'settings' }
    ],
    [
      { text: '📈 DCA Orders', callback_data: 'dca' },
      { text: '👥 Refer Friends', callback_data: 'refer' }
    ],
    [
      { text: '🔄 Refresh', callback_data: 'refresh' }
    ]
  ]
};

export const sniperTonyKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🎯 Launch Sniper', callback_data: 'new_snipe' }
    ],
    [
      { text: '⚡ Quick Snipe', callback_data: 'quick_snipe' },
      { text: '📊 Custom Setup', callback_data: 'custom_snipe' }
    ],
    [
      { text: '🎚️ Auto TP/SL', callback_data: 'auto_exits' },
      { text: '🛡️ Anti-Rug', callback_data: 'protection' }
    ],
    [
      { text: '⚙️ Sniper Config', callback_data: 'sniper_settings' },
      { text: '📜 Snipe History', callback_data: 'snipe_history' }
    ],
    [
      { text: '« Back to Main', callback_data: 'main_menu' }
    ]
  ]
};

export const buyKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🎯 SniperTony Buy', callback_data: 'sniper_buy' },
      { text: '💰 Regular Buy', callback_data: 'regular_buy' }
    ],
    [
      { text: '⚡ Quick Buy', callback_data: 'quick_buy' },
      { text: '📊 Custom Buy', callback_data: 'custom_buy' }
    ],
    [
      { text: 'Set Amount', callback_data: 'set_amount' },
      { text: 'Set Slippage', callback_data: 'set_slippage' }
    ],
    [
      { text: '« Back', callback_data: 'main_menu' }
    ]
  ]
};

export const sniperSettingsKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '🎯 Sniper Mode', callback_data: 'sniper_mode' },
      { text: '⚡ Speed Settings', callback_data: 'speed_settings' }
    ],
    [
      { text: '🛡️ Protection Level', callback_data: 'protection_level' },
      { text: '📊 Risk Tolerance', callback_data: 'risk_settings' }
    ],
    [
      { text: '💰 Default Buy Amount', callback_data: 'default_amount' },
      { text: '📈 Auto TP/SL', callback_data: 'auto_exits' }
    ],
    [
      { text: '⚙️ Gas Settings', callback_data: 'gas_settings' },
      { text: '⏰ Timing Config', callback_data: 'timing_settings' }
    ],
    [
      { text: '« Back to Sniper', callback_data: 'sniper_menu' }
    ]
  ]
};

export const monitorKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '📊 Token Monitor', callback_data: 'token_monitor' },
      { text: '🎯 Sniper Alerts', callback_data: 'sniper_alerts' }
    ],
    [
      { text: '💰 Price Alerts', callback_data: 'price_alerts' },
      { text: '📈 Volume Alerts', callback_data: 'volume_alerts' }
    ],
    [
      { text: '🔔 My Alerts', callback_data: 'view_alerts' },
      { text: '⚙️ Alert Settings', callback_data: 'alert_settings' }
    ],
    [
      { text: '« Back', callback_data: 'main_menu' }
    ]
  ]
};
