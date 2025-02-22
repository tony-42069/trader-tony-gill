import { PublicKey } from '@solana/web3.js';

export enum PatternType {
  // Trend Patterns
  UPTREND = 'uptrend',
  DOWNTREND = 'downtrend',
  SIDEWAYS = 'sideways',
  
  // Reversal Patterns
  DOUBLE_TOP = 'double_top',
  DOUBLE_BOTTOM = 'double_bottom',
  HEAD_AND_SHOULDERS = 'head_and_shoulders',
  INVERSE_HEAD_AND_SHOULDERS = 'inverse_head_and_shoulders',
  
  // Continuation Patterns
  BULL_FLAG = 'bull_flag',
  BEAR_FLAG = 'bear_flag',
  ASCENDING_TRIANGLE = 'ascending_triangle',
  DESCENDING_TRIANGLE = 'descending_triangle',
  SYMMETRICAL_TRIANGLE = 'symmetrical_triangle',
  
  // Candlestick Patterns
  DOJI = 'doji',
  HAMMER = 'hammer',
  SHOOTING_STAR = 'shooting_star',
  ENGULFING_BULLISH = 'engulfing_bullish',
  ENGULFING_BEARISH = 'engulfing_bearish',
  MORNING_STAR = 'morning_star',
  EVENING_STAR = 'evening_star'
}

export enum PatternSignal {
  STRONG_BUY = 'strong_buy',
  BUY = 'buy',
  NEUTRAL = 'neutral',
  SELL = 'sell',
  STRONG_SELL = 'strong_sell'
}

export enum TimeFrame {
  M1 = '1m',   // 1 minute
  M5 = '5m',   // 5 minutes
  M15 = '15m', // 15 minutes
  M30 = '30m', // 30 minutes
  H1 = '1h',   // 1 hour
  H4 = '4h',   // 4 hours
  D1 = '1d',   // 1 day
  W1 = '1w'    // 1 week
}

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PatternMatch {
  type: PatternType;
  signal: PatternSignal;
  timeframe: TimeFrame;
  confidence: number; // 0-100
  startTime: Date;
  endTime: Date;
  priceTarget?: number;
  stopLoss?: number;
  description: string;
  details?: {
    keyLevels?: number[];
    trendLines?: { start: number; end: number }[];
    pivotPoints?: number[];
    volumeProfile?: { price: number; volume: number }[];
  };
}

export interface PatternScan {
  tokenAddress: string;
  tokenSymbol: string;
  timestamp: Date;
  timeframe: TimeFrame;
  patterns: PatternMatch[];
  trendStrength?: number; // 0-100
  volumeProfile?: {
    averageVolume: number;
    volumeSpikes: { timestamp: Date; volume: number }[];
  };
}

export interface PatternAnalyzer {
  // Pattern scanning
  scanToken(
    tokenAddress: string | PublicKey,
    timeframe: TimeFrame,
    options?: {
      startTime?: Date;
      endTime?: Date;
      minConfidence?: number;
      patterns?: PatternType[];
    }
  ): Promise<PatternScan>;

  // Historical data
  getCandles(
    tokenAddress: string | PublicKey,
    timeframe: TimeFrame,
    limit?: number
  ): Promise<Candle[]>;

  // Pattern detection
  detectPattern(
    candles: Candle[],
    pattern: PatternType,
    options?: {
      minConfidence?: number;
      lookback?: number;
    }
  ): Promise<PatternMatch | null>;

  // Trend analysis
  analyzeTrend(
    candles: Candle[],
    options?: {
      period?: number;
      smoothing?: number;
    }
  ): Promise<{
    trend: PatternType;
    strength: number;
    support?: number;
    resistance?: number;
  }>;
}

export interface PatternAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  pattern: PatternMatch;
  timestamp: Date;
  priceAtAlert: number;
  volumeAtAlert: number;
  additionalSignals?: {
    momentum?: number; // -100 to 100
    volumeProfile?: number; // 0-100
    trendAlignment?: boolean;
  };
}

export interface PatternError {
  code: PatternErrorCode;
  message: string;
  details?: Record<string, any>;
}

export enum PatternErrorCode {
  INSUFFICIENT_DATA = 'insufficient_data',
  INVALID_TIMEFRAME = 'invalid_timeframe',
  PATTERN_NOT_FOUND = 'pattern_not_found',
  ANALYSIS_FAILED = 'analysis_failed',
  INVALID_PARAMETERS = 'invalid_parameters'
}
