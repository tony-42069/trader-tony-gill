import { logger } from './logger';
import { createLogContext } from './context';
import { PerformanceMetric, TradeExecutionLog, SnipeAttemptLog, PositionUpdateLog } from './types';

export function logPerformanceMetric(metric: PerformanceMetric) {
  const context = createLogContext();
  logger.info('Performance metric logged', { ...metric, context });
}

export function logTradeExecution(log: TradeExecutionLog) {
  const context = createLogContext();
  logger.info('Trade execution logged', { ...log, context });
}

export function logSnipeAttempt(log: SnipeAttemptLog) {
  const context = createLogContext();
  logger.info('Snipe attempt logged', { ...log, context });
}

export function logPositionUpdate(log: PositionUpdateLog) {
  const context = createLogContext();
  logger.info('Position update logged', { ...log, context });
}

export function logLiquidityChange(params: {
  token: string;
  oldLiquidity: number;
  newLiquidity: number;
  changePercent: number;
}) {
  logger.info('Liquidity change detected', {
    token: params.token,
    oldLiquidity: params.oldLiquidity,
    newLiquidity: params.newLiquidity,
    changePercent: params.changePercent
  });
}

export function logPriceAlert(params: {
  token: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
}) {
  logger.info('Price alert triggered', {
    token: params.token,
    oldPrice: params.oldPrice,
    newPrice: params.newPrice,
    changePercent: params.changePercent
  });
}

export function logVolumeSpike(params: {
  token: string;
  oldVolume: number;
  newVolume: number;
  changePercent: number;
}) {
  logger.info('Volume spike detected', {
    token: params.token,
    oldVolume: params.oldVolume,
    newVolume: params.newVolume,
    changePercent: params.changePercent
  });
}
