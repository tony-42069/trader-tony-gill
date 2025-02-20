import type { LogContext, TradeExecutionLog, SnipeAttemptLog, PositionUpdateLog } from './types';

export const logTradeExecution = (context: LogContext, trade: Omit<TradeExecutionLog, 'timestamp'>) => {
  context.log('trade', 'Trade executed', {
    ...trade,
    timestamp: new Date().toISOString()
  });
};

export const logSnipeAttempt = (context: LogContext, snipe: Omit<SnipeAttemptLog, 'timestamp'>) => {
  context.log('snipe', 'Snipe attempt initiated', {
    ...snipe,
    timestamp: new Date().toISOString()
  });
};

export const logSnipeResult = (
  context: LogContext,
  success: boolean,
  snipe: Omit<SnipeAttemptLog, 'timestamp'>,
  result: {
    actualPrice?: number;
    txHash?: string;
    error?: string;
  }
) => {
  context.log(
    success ? 'snipe' : 'error',
    success ? 'Snipe successful' : 'Snipe failed',
    {
      ...snipe,
      ...result,
      success,
      timestamp: new Date().toISOString()
    }
  );
};

export const logPositionUpdate = (
  context: LogContext,
  position: Omit<PositionUpdateLog, 'timestamp'>
) => {
  context.log('info', 'Position updated', {
    ...position,
    timestamp: new Date().toISOString()
  });
};

export const logLiquidityChange = (
  context: LogContext,
  data: {
    token: string;
    oldLiquidity: number;
    newLiquidity: number;
    changePercent: number;
  }
) => {
  context.log('info', 'Liquidity change detected', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const logPriceAlert = (
  context: LogContext,
  data: {
    token: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
    timeframe: string;
  }
) => {
  context.log('info', 'Price alert triggered', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

export const logVolumeSpike = (
  context: LogContext,
  data: {
    token: string;
    volume: number;
    averageVolume: number;
    multiplier: number;
    timeframe: string;
  }
) => {
  context.log('info', 'Volume spike detected', {
    ...data,
    timestamp: new Date().toISOString()
  });
};
