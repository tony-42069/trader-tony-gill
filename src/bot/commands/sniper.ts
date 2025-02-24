import { Message } from 'node-telegram-bot-api';
import { SniperService, SnipeConfig } from '../../trading/sniper/types';
import { PositionManager } from '../../trading/position/types';
import { logger } from '../../utils/logger';
import { formatNumber } from '../../utils/format';

export class SniperCommands {
  constructor(
    private sniperService: SniperService,
    private positionManager: PositionManager
  ) {}

  async handleSnipe(msg: Message, args: string[]): Promise<void> {
    try {
      if (args.length < 2) {
        throw new Error('Usage: /snipe <token_address> <amount> [max_slippage] [take_profit] [stop_loss]');
      }

      const [tokenAddress, amountStr, slippageStr, takeProfitStr, stopLossStr] = args;
      const amount = parseFloat(amountStr);
      const maxSlippage = slippageStr ? parseFloat(slippageStr) : 1.0; // Default 1%
      const takeProfit = takeProfitStr ? parseFloat(takeProfitStr) : undefined;
      const stopLoss = stopLossStr ? parseFloat(stopLossStr) : undefined;

      // Validate inputs
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      const config: SnipeConfig = {
        tokenAddress,
        amount,
        maxSlippage,
        quoteMint: 'So11111111111111111111111111111111111111112', // Native SOL
        minLiquidity: 1.0, // 1 SOL minimum liquidity
        maxRiskScore: 70,
        maxBuyAmount: amount,
        sandwichProtection: true,
        simulateFirst: true,
        maxPendingTransactions: 1,
        maxBlockAge: 150,
        retryAttempts: 3,
        priorityFee: 0.000001,
        computeUnits: 200000,
        maxGasPrice: 100000,
        maxExecutionTime: 60000,
        minConfirmations: 1
      };

      // Start monitoring for liquidity
      await this.sniperService.startMonitoring(config);

      logger.info('Started sniper', {
        chatId: msg.chat.id,
        token: tokenAddress,
        amount,
        maxSlippage,
        takeProfit,
        stopLoss
      });

      // Send confirmation message
      const response = [
        '🎯 Sniper started!',
        `Token: ${tokenAddress}`,
        `Amount: ${formatNumber(amount)} SOL`,
        `Max Slippage: ${maxSlippage}%`,
        takeProfit ? `Take Profit: ${formatNumber(takeProfit)}%` : undefined,
        stopLoss ? `Stop Loss: ${formatNumber(stopLoss)}%` : undefined,
        '\nMonitoring for liquidity...'
      ].filter(Boolean).join('\n');

      await msg.reply(response, { parse_mode: 'HTML' });

    } catch (error) {
      logger.error('Snipe command failed:', {
        chatId: msg.chat.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      await msg.reply(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { parse_mode: 'HTML' }
      );
    }
  }

  async handleStopSnipe(msg: Message, args: string[]): Promise<void> {
    try {
      if (args.length < 1) {
        throw new Error('Usage: /stopsnipe <token_address>');
      }

      const [tokenAddress] = args;
      await this.sniperService.stopMonitoring(tokenAddress);

      logger.info('Stopped sniper', {
        chatId: msg.chat.id,
        token: tokenAddress
      });

      await msg.reply(
        `✅ Stopped monitoring ${tokenAddress}`,
        { parse_mode: 'HTML' }
      );

    } catch (error) {
      logger.error('Stop snipe command failed:', {
        chatId: msg.chat.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      await msg.reply(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { parse_mode: 'HTML' }
      );
    }
  }

  async handlePositions(msg: Message): Promise<void> {
    try {
      const positions = await this.positionManager.getOpenPositions();
      
      if (positions.length === 0) {
        await msg.reply('No open positions', { parse_mode: 'HTML' });
        return;
      }

      const response = ['📊 Open Positions:'];

      for (const position of positions) {
        const pnlStr = position.unrealizedPnl >= 0 ? '📈' : '📉';
        response.push(
          `\n${position.tokenSymbol} (${position.tokenAddress.slice(0, 8)}...)`,
          `💰 Amount: ${formatNumber(position.amount)} SOL`,
          `📈 Entry: ${formatNumber(position.entryPrice)} SOL`,
          `📊 Current: ${formatNumber(position.currentPrice)} SOL`,
          `💵 PnL: ${formatNumber(position.pnl)} SOL (${formatNumber(position.pnl / position.entryPrice * 100)}%)`,
          position.takeProfit ? `TP: ${formatNumber(position.takeProfit)} SOL` : '❌ No Take Profit',
          position.stopLoss ? `SL: ${formatNumber(position.stopLoss)} SOL` : '❌ No Stop Loss',
          `⏰ Opened: ${position.createdAt.toLocaleString()}`
        );
      }

      await msg.reply(response.filter(Boolean).join('\n'), { parse_mode: 'HTML' });

    } catch (error) {
      logger.error('Positions command failed:', {
        chatId: msg.chat.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      await msg.reply(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { parse_mode: 'HTML' }
      );
    }
  }

  async handleClosePosition(msg: Message, args: string[]): Promise<void> {
    try {
      if (args.length < 1) {
        throw new Error('Usage: /close <position_id>');
      }

      const [positionId] = args;
      const position = await this.positionManager.closePosition(positionId);

      const pnlStr = position.realizedPnl! >= 0 ? '📈' : '📉';
      const response = [
        '✅ Position closed!',
        `Token: ${position.tokenSymbol}`,
        `Exit Price: ${formatNumber(position.exitPrice!)} SOL`,
        `PnL: ${pnlStr} ${formatNumber(position.realizedPnlPercent!)}% (${formatNumber(position.realizedPnl!)} SOL)`
      ].join('\n');

      await msg.reply(response, { parse_mode: 'HTML' });

    } catch (error) {
      logger.error('Close position command failed:', {
        chatId: msg.chat.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      await msg.reply(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { parse_mode: 'HTML' }
      );
    }
  }

  async handleUpdatePosition(msg: Message, args: string[]): Promise<void> {
    try {
      if (args.length < 3) {
        throw new Error('Usage: /update <position_id> <tp|sl> <price>');
      }

      const [positionId, type, priceStr] = args;
      const price = parseFloat(priceStr);

      if (isNaN(price) || price <= 0) {
        throw new Error('Invalid price');
      }

      let position;
      if (type.toLowerCase() === 'tp') {
        position = await this.positionManager.updateTakeProfit(positionId, price);
      } else if (type.toLowerCase() === 'sl') {
        position = await this.positionManager.updateStopLoss(positionId, price);
      } else {
        throw new Error('Invalid update type. Use "tp" for take profit or "sl" for stop loss');
      }

      const response = [
        '✅ Position updated!',
        `Token: ${position.tokenSymbol}`,
        `Current Price: ${formatNumber(position.currentPrice)} SOL`,
        position.takeProfit ? `Take Profit: ${formatNumber(position.takeProfit)} SOL` : undefined,
        position.stopLoss ? `Stop Loss: ${formatNumber(position.stopLoss)} SOL` : undefined
      ].filter(Boolean).join('\n');

      await msg.reply(response, { parse_mode: 'HTML' });

    } catch (error) {
      logger.error('Update position command failed:', {
        chatId: msg.chat.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      await msg.reply(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { parse_mode: 'HTML' }
      );
    }
  }
} 