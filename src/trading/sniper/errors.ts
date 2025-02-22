import { SnipeErrorCode } from './types';

export class SnipeError extends Error {
  constructor(
    message: string,
    public code: SnipeErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SnipeError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SnipeError.prototype);
  }

  static insufficientFunds(
    required: number,
    available: number,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Insufficient funds. Required: ${required} SOL, Available: ${available} SOL`,
      SnipeErrorCode.INSUFFICIENT_FUNDS,
      { required, available, ...details }
    );
  }

  static excessiveSlippage(
    expected: number,
    actual: number,
    maxSlippage: number,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Excessive slippage. Expected: ${expected}, Actual: ${actual}, Max: ${maxSlippage}%`,
      SnipeErrorCode.EXCESSIVE_SLIPPAGE,
      { expected, actual, maxSlippage, ...details }
    );
  }

  static highGasPrice(
    current: number,
    maximum: number,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Gas price too high. Current: ${current}, Maximum: ${maximum}`,
      SnipeErrorCode.HIGH_GAS_PRICE,
      { current, maximum, ...details }
    );
  }

  static simulationFailed(
    error: Error,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Transaction simulation failed: ${error.message}`,
      SnipeErrorCode.SIMULATION_FAILED,
      { error: error.message, ...details }
    );
  }

  static sandwichDetected(
    frontRun?: any,
    backRun?: any,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      'Potential sandwich attack detected',
      SnipeErrorCode.SANDWICH_DETECTED,
      { frontRun, backRun, ...details }
    );
  }

  static transactionFailed(
    txHash: string,
    error: Error,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Transaction failed: ${error.message}`,
      SnipeErrorCode.TRANSACTION_FAILED,
      { txHash, error: error.message, ...details }
    );
  }

  static timeout(
    elapsed: number,
    maxWait: number,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Transaction timed out after ${elapsed}ms (max: ${maxWait}ms)`,
      SnipeErrorCode.TIMEOUT,
      { elapsed, maxWait, ...details }
    );
  }

  static invalidToken(
    tokenAddress: string,
    reason: string,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Invalid token ${tokenAddress}: ${reason}`,
      SnipeErrorCode.INVALID_TOKEN,
      { tokenAddress, reason, ...details }
    );
  }

  static lowLiquidity(
    tokenAddress: string,
    liquidity: number,
    required: number,
    details?: Record<string, any>
  ): SnipeError {
    return new SnipeError(
      `Insufficient liquidity for token ${tokenAddress}. Found: ${liquidity} SOL, Required: ${required} SOL`,
      SnipeErrorCode.LOW_LIQUIDITY,
      { tokenAddress, liquidity, required, ...details }
    );
  }

  // Helper method to check if error is a specific code
  static isErrorCode(error: unknown, code: SnipeErrorCode): boolean {
    return error instanceof SnipeError && error.code === code;
  }

  // Helper methods to check specific error types
  static isInsufficientFunds(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.INSUFFICIENT_FUNDS);
  }

  static isExcessiveSlippage(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.EXCESSIVE_SLIPPAGE);
  }

  static isHighGasPrice(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.HIGH_GAS_PRICE);
  }

  static isSimulationFailed(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.SIMULATION_FAILED);
  }

  static isSandwichDetected(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.SANDWICH_DETECTED);
  }

  static isTransactionFailed(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.TRANSACTION_FAILED);
  }

  static isTimeout(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.TIMEOUT);
  }

  static isInvalidToken(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.INVALID_TOKEN);
  }

  static isLowLiquidity(error: unknown): boolean {
    return SnipeError.isErrorCode(error, SnipeErrorCode.LOW_LIQUIDITY);
  }
}
