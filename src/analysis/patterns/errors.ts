import { PatternErrorCode } from './types';

export class PatternError extends Error {
  constructor(
    message: string,
    public code: PatternErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PatternError';

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PatternError.prototype);
  }

  static insufficientData(
    tokenAddress: string,
    required: number,
    available: number,
    details?: Record<string, any>
  ): PatternError {
    return new PatternError(
      `Insufficient data for pattern analysis. Required: ${required} candles, Available: ${available}`,
      PatternErrorCode.INSUFFICIENT_DATA,
      {
        tokenAddress,
        required,
        available,
        ...details
      }
    );
  }

  static invalidTimeframe(
    timeframe: string,
    supported: string[],
    details?: Record<string, any>
  ): PatternError {
    return new PatternError(
      `Invalid timeframe: ${timeframe}. Supported timeframes: ${supported.join(', ')}`,
      PatternErrorCode.INVALID_TIMEFRAME,
      {
        timeframe,
        supported,
        ...details
      }
    );
  }

  static patternNotFound(
    pattern: string,
    tokenAddress: string,
    details?: Record<string, any>
  ): PatternError {
    return new PatternError(
      `Pattern ${pattern} not found for token ${tokenAddress}`,
      PatternErrorCode.PATTERN_NOT_FOUND,
      {
        pattern,
        tokenAddress,
        ...details
      }
    );
  }

  static analysisFailed(
    tokenAddress: string,
    error: Error,
    details?: Record<string, any>
  ): PatternError {
    return new PatternError(
      `Pattern analysis failed for token ${tokenAddress}: ${error.message}`,
      PatternErrorCode.ANALYSIS_FAILED,
      {
        tokenAddress,
        error: error.message,
        ...details
      }
    );
  }

  static invalidParameters(
    message: string,
    params: Record<string, any>,
    details?: Record<string, any>
  ): PatternError {
    return new PatternError(
      `Invalid parameters: ${message}`,
      PatternErrorCode.INVALID_PARAMETERS,
      {
        params,
        ...details
      }
    );
  }

  // Helper method to check if error is a specific code
  static isErrorCode(error: unknown, code: PatternErrorCode): boolean {
    return error instanceof PatternError && error.code === code;
  }

  // Helper method to check if error is insufficient data
  static isInsufficientData(error: unknown): boolean {
    return PatternError.isErrorCode(error, PatternErrorCode.INSUFFICIENT_DATA);
  }

  // Helper method to check if error is invalid timeframe
  static isInvalidTimeframe(error: unknown): boolean {
    return PatternError.isErrorCode(error, PatternErrorCode.INVALID_TIMEFRAME);
  }

  // Helper method to check if error is pattern not found
  static isPatternNotFound(error: unknown): boolean {
    return PatternError.isErrorCode(error, PatternErrorCode.PATTERN_NOT_FOUND);
  }

  // Helper method to check if error is analysis failed
  static isAnalysisFailed(error: unknown): boolean {
    return PatternError.isErrorCode(error, PatternErrorCode.ANALYSIS_FAILED);
  }

  // Helper method to check if error is invalid parameters
  static isInvalidParameters(error: unknown): boolean {
    return PatternError.isErrorCode(error, PatternErrorCode.INVALID_PARAMETERS);
  }
}
