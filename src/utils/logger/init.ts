import { logger } from './logger';
import { createLogContext } from './context';
import { TradingError } from './errors';

export function initializeLogger() {
  try {
    const context = createLogContext();
    logger.info('Logger initialized', { context });
    return context;
  } catch (error) {
    if (error instanceof TradingError) {
      throw error;
    }
    throw new TradingError(
      'Failed to initialize logger',
      'INITIALIZATION_ERROR',
      { originalError: error }
    );
  }
}

// Cleanup function for graceful shutdown
export function cleanupLogger() {
  logger.info('Logger cleanup initiated');
}
