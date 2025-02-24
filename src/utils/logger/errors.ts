import { logger } from './logger';
import { createLogContext } from './context';

export class TradingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'TradingError';
  }
}

export class ValidationError extends TradingError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', metadata);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends TradingError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', metadata);
    this.name = 'NetworkError';
  }
}

export class ConfigurationError extends TradingError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', metadata);
    this.name = 'ConfigurationError';
  }
}

export function logError(error: Error) {
  const context = createLogContext();
  if (error instanceof TradingError) {
    logger.error(error.message, {
      context,
      code: error.code,
      metadata: error.metadata,
      stack: error.stack
    });
  } else {
    logger.error(error.message, {
      context,
      stack: error.stack
    });
  }
}
