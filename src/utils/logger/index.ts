import { logTradeExecution, logSnipeAttempt, logPositionUpdate } from './trading';
import { logError } from './errors';
import { logPerformance } from './logger';

export * from './types';
export * from './errors';
export * from './trading';
export * from './init';
export { logger, createLogContext, logPerformance, withPerformanceLogging } from './logger';

// Re-export commonly used utilities
export const log = {
  trade: logTradeExecution,
  snipe: logSnipeAttempt,
  error: logError,
  position: logPositionUpdate,
  performance: logPerformance
};

// Initialize logger on import
import { initializeLogger } from './init';
export const defaultContext = initializeLogger();
