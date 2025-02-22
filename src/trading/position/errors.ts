export enum PositionErrorCode {
  INVALID_TOKEN = 'invalid_token',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  POSITION_NOT_FOUND = 'position_not_found',
  POSITION_ALREADY_CLOSED = 'position_already_closed',
  INVALID_POSITION_SIZE = 'invalid_position_size',
  INVALID_STOP_PRICE = 'invalid_stop_price',
  INVALID_TAKE_PROFIT = 'invalid_take_profit',
  UPDATE_FAILED = 'update_failed',
  CLOSE_FAILED = 'close_failed'
}

export class PositionError extends Error {
  constructor(
    message: string,
    public code: PositionErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PositionError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PositionError.prototype);
  }

  static invalidToken(tokenAddress: string, details?: Record<string, any>): PositionError {
    return new PositionError(
      `Invalid token address: ${tokenAddress}`,
      PositionErrorCode.INVALID_TOKEN,
      details
    );
  }

  static insufficientBalance(
    required: number,
    available: number,
    details?: Record<string, any>
  ): PositionError {
    return new PositionError(
      `Insufficient balance. Required: ${required}, Available: ${available}`,
      PositionErrorCode.INSUFFICIENT_BALANCE,
      { required, available, ...details }
    );
  }

  static positionNotFound(id: string, details?: Record<string, any>): PositionError {
    return new PositionError(
      `Position not found: ${id}`,
      PositionErrorCode.POSITION_NOT_FOUND,
      details
    );
  }

  static positionAlreadyClosed(id: string, details?: Record<string, any>): PositionError {
    return new PositionError(
      `Position already closed: ${id}`,
      PositionErrorCode.POSITION_ALREADY_CLOSED,
      details
    );
  }

  static invalidPositionSize(
    size: number,
    min: number,
    max: number,
    details?: Record<string, any>
  ): PositionError {
    return new PositionError(
      `Invalid position size: ${size}. Must be between ${min} and ${max}`,
      PositionErrorCode.INVALID_POSITION_SIZE,
      { size, min, max, ...details }
    );
  }

  static invalidStopPrice(
    price: number,
    entryPrice: number,
    details?: Record<string, any>
  ): PositionError {
    return new PositionError(
      `Invalid stop price: ${price}. Must be below entry price: ${entryPrice}`,
      PositionErrorCode.INVALID_STOP_PRICE,
      { price, entryPrice, ...details }
    );
  }

  static invalidTakeProfit(
    price: number,
    entryPrice: number,
    details?: Record<string, any>
  ): PositionError {
    return new PositionError(
      `Invalid take profit price: ${price}. Must be above entry price: ${entryPrice}`,
      PositionErrorCode.INVALID_TAKE_PROFIT,
      { price, entryPrice, ...details }
    );
  }

  static updateFailed(id: string, error: Error, details?: Record<string, any>): PositionError {
    return new PositionError(
      `Failed to update position ${id}: ${error.message}`,
      PositionErrorCode.UPDATE_FAILED,
      { error: error.message, ...details }
    );
  }

  static closeFailed(id: string, error: Error, details?: Record<string, any>): PositionError {
    return new PositionError(
      `Failed to close position ${id}: ${error.message}`,
      PositionErrorCode.CLOSE_FAILED,
      { error: error.message, ...details }
    );
  }
}
