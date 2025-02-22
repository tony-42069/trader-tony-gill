# TraderTony Testing Guide

## Quick Start Testing Sequence

### 1. Initial Setup Verification
```bash
# Start the bot
pnpm start

# Initial command to verify bot is responsive
/start
Expected: Welcome message with menu keyboard
```

### 2. Component Testing

#### A. Token Analysis Testing
```bash
# Test with wSOL (known good token)
/analyze So11111111111111111111111111111111111111112

Expected Output:
- Token Name: Wrapped SOL
- Symbol: wSOL
- Current Price: [price in USD]
- 24h Volume: [volume in USD]
- Liquidity: [amount in SOL]
- Risk Score: [0-100]
- Verification Status
- Warning Indicators (if any)
```

#### B. Monitoring System Testing
```bash
# Set up monitoring for wSOL
/monitor So11111111111111111111111111111111111111112 5 10 50
Parameters:
- Token: wSOL
- Price alert: 5% change
- Liquidity alert: 10% change
- Volume alert: 50% spike

Expected Output:
- Confirmation message
- Current token status
- Alert thresholds display
```

#### C. Trading System Testing
```bash
# Test sniper with minimal amount
/snipe So11111111111111111111111111111111111111112 0.01
Parameters:
- Token: wSOL
- Amount: 0.01 SOL
- Default slippage: 1%

Expected Sequence:
1. Risk analysis display
2. Confirmation prompt
3. Transaction execution
4. Position creation
```

#### D. Position Management Testing
```bash
# Check current positions
/position

# Set take profit
/position tp 50

# Set stop loss
/position sl 20

Expected Output:
- Position details
- Entry price
- Current price
- PnL calculation
- TP/SL confirmation
```

## Error Testing Scenarios

### 1. Invalid Input Testing
```bash
# Invalid token address
/analyze InvalidTokenAddress
Expected: "Invalid token address" error

# Invalid amount
/snipe So11111111111111111111111111111111111111112 -1
Expected: "Invalid amount" error

# Invalid alert threshold
/monitor So11111111111111111111111111111111111111112 -5
Expected: "Invalid alert threshold" error
```

### 2. Balance Testing
```bash
# Amount exceeding balance
/snipe So11111111111111111111111111111111111111112 1000
Expected: "Insufficient balance" error

# Amount exceeding max limit
/snipe So11111111111111111111111111111111111111112 5
Expected: "Amount exceeds maximum limit" error
```

### 3. Network Testing
```bash
# Multiple rapid commands
/analyze So11111111111111111111111111111111111111112
/analyze So11111111111111111111111111111111111111112
Expected: Rate limiting message
```

## Success Criteria Checklist

### Token Analysis
- [ ] Shows accurate price data
- [ ] Displays liquidity information
- [ ] Calculates risk score
- [ ] Shows verification status
- [ ] Lists any warnings

### Monitoring System
- [ ] Successfully adds tokens to monitoring
- [ ] Tracks price changes
- [ ] Detects liquidity changes
- [ ] Identifies volume spikes
- [ ] Sends alerts when thresholds met
- [ ] Respects cooldown periods

### Trading System
- [ ] Validates input parameters
- [ ] Performs pre-trade checks
- [ ] Executes trades
- [ ] Creates positions
- [ ] Updates position status
- [ ] Handles take profit/stop loss
- [ ] Manages transaction errors

### Error Handling
- [ ] Provides clear error messages
- [ ] Recovers from errors gracefully
- [ ] Maintains system stability
- [ ] Logs errors appropriately

## Troubleshooting Guide

### Common Issues and Solutions

1. Bot Not Responding
   - Check bot token validity
   - Verify network connection
   - Restart bot process

2. Transaction Failures
   - Check SOL balance
   - Verify RPC connection
   - Check slippage settings
   - Verify token contract

3. Monitoring Issues
   - Check alert thresholds
   - Verify token address
   - Check cooldown settings
   - Verify user permissions

4. Position Management Issues
   - Check position existence
   - Verify token liquidity
   - Check take profit/stop loss values
   - Verify price feed

### Error Messages and Actions

| Error Message | Possible Cause | Action |
|--------------|----------------|---------|
| "Invalid token address" | Malformed address | Verify token address |
| "Insufficient balance" | Low SOL balance | Add funds to wallet |
| "Price impact too high" | Low liquidity | Adjust amount or slippage |
| "Rate limit exceeded" | Too many requests | Wait and retry |
| "Network error" | RPC issues | Check connection/switch RPC |

## Performance Verification

### Response Times
- Command response: < 2 seconds
- Analysis completion: < 5 seconds
- Trade execution: < 10 seconds
- Alert triggering: < 30 seconds

### System Load
- Memory usage < 500MB
- CPU usage < 50%
- Network calls optimized
- Cache hit rate > 80%

## Testing Notes

1. Always start with small amounts (0.01 SOL)
2. Test during different market conditions
3. Verify all alerts and notifications
4. Check error logging and recovery
5. Monitor system resources
6. Test rate limiting and cooldowns
7. Verify data accuracy

## Emergency Procedures

1. Stop Trading
```bash
/settings trading disable
Expected: Trading disabled confirmation
```

2. Stop Monitoring
```bash
/settings monitoring disable
Expected: Monitoring disabled confirmation
```

3. Emergency Position Close
```bash
/position close all
Expected: All positions closed confirmation
