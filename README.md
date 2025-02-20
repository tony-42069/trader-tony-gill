# TraderTony - Solana Trading Bot

A Telegram-based trading bot for Solana tokens, built with TypeScript and the Gill framework.

## Features

- 🤖 Telegram Bot Interface
- 💰 Secure Wallet Management
- 📊 Real-time Balance Monitoring
- 🔄 Automated Trading
- 📈 Price & Liquidity Tracking
- ⚡ Sniper Functionality
- 🛡️ Risk Management
- 📝 Comprehensive Logging

## Tech Stack

- TypeScript
- Node.js
- Gill (Solana Web3 Framework)
- Solana Web3.js
- Node-Telegram-Bot-API
- Winston Logger

## Prerequisites

- Node.js 16+
- pnpm
- Solana CLI (optional)
- Telegram Bot Token
- Solana RPC URL

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tony-42069/trader-tony-gill.git
   cd trader-tony-gill
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ADMIN_CHAT_ID=your_chat_id_here
   SOLANA_RPC_URL=your_rpc_url_here
   WALLET_ID=your_wallet_id_here
   WALLET_SEED_PHRASE=your_seed_phrase_here
   ```

## Configuration

The bot can be configured through various settings files:

- `src/config/settings.ts`: Main configuration
- `src/config/types.ts`: TypeScript interfaces
- `src/config/validation.ts`: Configuration validation

Key configuration options:
```typescript
{
  trading: {
    maxSlippage: 1.0,         // Maximum slippage percentage
    minLiquidity: 1000,       // Minimum liquidity in USD
    takeProfit: 50.0,         // Take profit percentage
    stopLoss: 20.0,           // Stop loss percentage
    priorityFee: 0.0001       // Priority fee in SOL
  },
  risk: {
    maxRiskScore: 70,         // Maximum acceptable risk score
    minHolders: 10,           // Minimum number of holders
    maxBuyTax: 10.0,          // Maximum acceptable buy tax
    maxSellTax: 10.0          // Maximum acceptable sell tax
  }
}
```

## Usage

1. Build the project:
   ```bash
   pnpm build
   ```

2. Start the bot:
   ```bash
   pnpm start
   ```

3. Development mode:
   ```bash
   pnpm dev
   ```

## Project Structure

```
src/
├── analysis/          # Token analysis tools
├── bot/              # Telegram bot implementation
├── config/           # Configuration management
├── trading/          # Trading functionality
├── utils/
│   ├── logger/       # Logging system
│   ├── solana/       # Solana client
│   └── wallet/       # Wallet management
└── types/            # Global type definitions
```

## Security

- Never share your seed phrase or private keys
- Keep your .env file secure
- Use secure RPC endpoints
- Monitor transaction logs
- Set appropriate trading limits

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License

## Disclaimer

Trading cryptocurrencies carries significant risk. This bot is for educational purposes only. Always do your own research and never trade with funds you cannot afford to lose.
