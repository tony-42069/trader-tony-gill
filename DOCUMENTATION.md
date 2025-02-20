# TraderTony Documentation

## 1. Project Overview

TraderTony is a sophisticated Solana trading bot that provides token analysis, trading, and monitoring capabilities through a Telegram interface. Built with TypeScript and leveraging the Gill framework, it offers a comprehensive suite of tools for Solana token trading.

### Core Features
- Token analysis with risk assessment
- Real-time price and liquidity monitoring
- Automated trading with sniper functionality
- Position management with take profit/stop loss
- Multi-user support with customizable alerts
- Secure wallet management

### Technology Stack
- TypeScript/Node.js
- Gill Framework
- @solana/web3.js v2
- node-telegram-bot-api
- Winston logging

## 2. Architecture

### System Components
```
trader-tony/
├── src/
│   ├── analysis/           # Token analysis system
│   ├── trading/           # Trading and position management
│   ├── bot/               # Telegram bot interface
│   ├── config/            # Configuration management
│   └── utils/             # Shared utilities
```

### Data Flow
1. User interacts through Telegram commands
2. Bot processes commands and validates input
3. Token analyzer performs safety checks
4. Trading system executes operations
5. Monitoring system tracks changes
6. Real-time alerts sent to users

### Security Model
- Secure wallet initialization
- Transaction validation
- Risk assessment before trades
- Rate limiting and cooldowns
- Multi-level error handling

## 3. Core Components

### 3.1 Token Analysis System

#### Token Analyzer
```typescript
interface TokenAnalysis {
  metadata: TokenMetadata;
  price: TokenPrice;
  risk: TokenRisk;
  lastAnalyzed: Date;
}

// Usage
const analysis = await tokenAnalyzer.analyzeToken(address, {
  includePrice: true,
  includeRisk: true
});
```

#### Risk Assessment
- Price volatility analysis
- Liquidity depth checking
- Contract verification
- Holder distribution analysis
- Tax and honeypot detection

#### Caching System
- In-memory cache with TTL
- Configurable update intervals
- Force refresh capability
- Cache invalidation on significant changes

### 3.2 Trading System

#### Trading Operations
```typescript
interface TradeResult {
  success: boolean;
  transactionHash?: string;
  tokenAddress: string;
  amount: number;
  price: number;
  value: number;
  fee: number;
  timestamp: Date;
}

// Execute trade
const result = await trader.buy({
  tokenAddress,
  amount,
  slippage: 1.0,
  antiMev: true
});
```

#### Position Management
- Take profit/stop loss automation
- Position tracking
- PnL calculation
- Auto-close conditions

#### Sniper System
```typescript
interface SniperParams {
  tokenAddress: string;
  amount: number;
  waitForLiquidity?: boolean;
  maxWaitTime?: number;
  buyTaxThreshold?: number;
}

// Snipe token
const result = await trader.snipe({
  tokenAddress,
  amount: 0.1,
  waitForLiquidity: true,
  maxWaitTime: 60000
});
```

### 3.3 Monitoring System

#### Real-time Monitoring
```typescript
interface MonitoredToken {
  address: string;
  symbol: string;
  basePrice: number;
  priceChangeAlert: number;
  liquidityChangeAlert: number;
  volumeChangeAlert: number;
  lastChecked: Date;
}

// Add token to monitoring
const token = await monitoringService.addToken(address, userId, {
  priceAlert: 5,
  liquidityAlert: 10,
  volumeAlert: 50
});
```

#### Alert System
- Price change alerts
- Liquidity change detection
- Volume spike notifications
- Custom alert thresholds
- Cooldown management

### 3.4 Wallet Management

#### Wallet Operations
```typescript
interface WalletState {
  publicKey: string;
  balance: number;
  isActive: boolean;
  transactions: TransactionHistory[];
  lastUpdated: Date;
}

// Initialize wallet
const wallet = await createWallet({
  seedPhrase: config.solana.seedPhrase,
  network: config.solana.network,
  balanceThresholds: config.trading.balanceThresholds
});
```

#### Security Features
- Secure seed phrase handling
- Transaction validation
- Balance monitoring
- Automatic alerts

## 4. Bot Commands

### Token Analysis
```
/analyze <token_address> - Analyze token
Options:
  [risk] - Include risk analysis
  [price] - Include price data
```

### Trading
```
/snipe <token_address> <amount> [options] - Snipe token
Options:
  [slippage] - Max slippage %
  [wait_time] - Max wait time for liquidity

/position - View active positions
Options:
  [close] - Close position
  [tp] - Set take profit
  [sl] - Set stop loss
```

### Monitoring
```
/monitor <token_address> [options] - Monitor token
Options:
  [price_alert] - Price change %
  [liquidity_alert] - Liquidity change %
  [volume_alert] - Volume change %
```

### Wallet
```
/wallet - View wallet info
Options:
  [balance] - Check balance
  [history] - View transaction history
```

## 5. Configuration and Security

### ⚠️ CRITICAL SECURITY WARNINGS
- NEVER commit `.env` files or any files containing real credentials
- NEVER share or expose your seed phrases, private keys, or API tokens
- NEVER include real values in `.env.example` files
- ALWAYS add sensitive files to `.gitignore`
- ALWAYS rotate compromised credentials immediately
- ALWAYS use environment variables for sensitive data
- NEVER store secrets in code or configuration files
- REGULARLY audit your security practices

### Environment Variables
Required environment variables are defined in `.env.example`. To set up:
1. Copy `.env.example` to `.env`
2. Fill in your actual values in `.env`
3. Ensure `.env` is in `.gitignore`
4. Never commit `.env` to version control

### Trading Parameters
```typescript
export const config = {
  trading: {
    maxSlippage: 1.0,
    minLiquidity: 1000,
    takeProfit: 50.0,
    stopLoss: 20.0,
    priorityFee: 0.0001,
    maxBuyAmount: 1.0
  },
  risk: {
    maxRiskScore: 70,
    minHolders: 10,
    maxBuyTax: 10.0,
    maxSellTax: 10.0,
    requireVerified: true
  },
  monitoring: {
    priceChangeThreshold: 5.0,
    liquidityChangeThreshold: 10.0,
    volumeSpikeThreshold: 100.0,
    alertCooldown: 300,
    maxTokensPerUser: 10,
    checkInterval: 60
  }
};
```

## 6. Development Guide

### Setup Instructions

1. Clone and install:
```bash
git clone https://github.com/tony-42069/trader-tony-gill.git
cd trader-tony-gill
pnpm install
```

2. Configure environment (IMPORTANT):
```bash
# Create your .env file (NEVER commit this file)
cp .env.example .env

# Edit .env with your actual values
# NEVER share these values or commit this file
```

3. Build and run:
```bash
pnpm build
pnpm start
```

### Testing
```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test:unit
pnpm test:integration

# Run with coverage
pnpm test:coverage
```

### Error Handling
The system implements comprehensive error handling:

1. Input Validation
   - Command parameter validation
   - Address format checking
   - Amount range validation

2. Network Errors
   - RPC connection issues
   - Transaction timeouts
   - Rate limiting

3. Trading Errors
   - Insufficient balance
   - Excessive slippage
   - Failed transactions
   - Liquidity issues

4. Recovery Mechanisms
   - Automatic retry logic
   - Fallback RPC nodes
   - Transaction status tracking
   - Position recovery

### Best Practices

1. Code Organization
   - Follow modular architecture
   - Use TypeScript strictly
   - Document public interfaces
   - Write unit tests

2. Error Handling
   - Use custom error classes
   - Provide detailed error messages
   - Log errors with context
   - Handle edge cases

3. Security
   - Validate all inputs
   - Secure sensitive data
   - Implement rate limiting
   - Monitor system health

4. Performance
   - Use caching effectively
   - Optimize RPC calls
   - Batch operations
   - Monitor memory usage
