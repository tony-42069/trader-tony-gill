import type { LogContext } from './types';

export const errorCodes = {
  INITIALIZATION_ERROR: 'INIT_ERR',
  TRADING_ERROR: 'TRADE_ERR',
  SNIPE_ERROR: 'SNIPE_ERR',
  WALLET_ERROR: 'WALLET_ERR',
  RPC_ERROR: 'RPC_ERR',
  VALIDATION_ERROR: 'VALIDATION_ERR',
  NETWORK_ERROR: 'NETWORK_ERR',
  UNKNOWN_ERROR: 'UNKNOWN_ERR'
} as const;

export type ErrorCode = typeof errorCodes[keyof typeof errorCodes];

export class TraderError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'TraderError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TraderError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      stack: this.stack
    };
  }
}

export const logError = (context: LogContext, error: Error | TraderError) => {
  const metadata = error instanceof TraderError ? error.metadata : {};
  const errorCode = error instanceof TraderError ? error.code : errorCodes.UNKNOWN_ERROR;

  context.log('error', error.message, {
    errorName: error.name,
    errorCode,
    stack: error.stack,
    ...metadata,
    timestamp: new Date().toISOString()
  });

  return error; // Allow for error chaining
};

export const createError = (
  message: string,
  code: ErrorCode,
  metadata?: Record<string, any>
): TraderError => {
  return new TraderError(message, code, metadata);
};
