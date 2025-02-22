import { Candle } from './types';

export function isDoji(candle: Candle): boolean {
  const bodySize = Math.abs(candle.close - candle.open);
  const wickSize = candle.high - candle.low;
  return bodySize <= wickSize * 0.1;
}

export function isBullish(candle: Candle): boolean {
  return candle.close > candle.open;
}

export function isBearish(candle: Candle): boolean {
  return candle.close < candle.open;
}

export function getBodySize(candle: Candle): number {
  return Math.abs(candle.close - candle.open);
}

export function getUpperWickSize(candle: Candle): number {
  return isBullish(candle)
    ? candle.high - candle.close
    : candle.high - candle.open;
}

export function getLowerWickSize(candle: Candle): number {
  return isBullish(candle)
    ? candle.open - candle.low
    : candle.close - candle.low;
}

export function findHammer(candles: Candle[]): Candle | null {
  if (candles.length < 1) return null;
  
  const current = candles[0];
  if (!current) return null;

  const bodySize = getBodySize(current);
  const upperWick = getUpperWickSize(current);
  const lowerWick = getLowerWickSize(current);

  // Lower wick should be at least 2x body size
  // Upper wick should be minimal
  return (lowerWick >= bodySize * 2 && upperWick <= bodySize * 0.1)
    ? current
    : null;
}

export function findInvertedHammer(candles: Candle[]): Candle | null {
  if (candles.length < 1) return null;
  
  const current = candles[0];
  if (!current) return null;

  const bodySize = getBodySize(current);
  const upperWick = getUpperWickSize(current);
  const lowerWick = getLowerWickSize(current);

  // Upper wick should be at least 2x body size
  // Lower wick should be minimal
  return (upperWick >= bodySize * 2 && lowerWick <= bodySize * 0.1)
    ? current
    : null;
}

export function findEngulfing(candles: Candle[]): Candle | null {
  if (candles.length < 2) return null;
  
  const current = candles[0];
  const previous = candles[1];
  if (!current || !previous) return null;

  const currentBody = getBodySize(current);
  const previousBody = getBodySize(previous);

  // Current candle body should engulf previous candle body
  return (currentBody > previousBody * 1.5 &&
          ((isBullish(current) && isBearish(previous)) ||
           (isBearish(current) && isBullish(previous))))
    ? current
    : null;
}

export function findMorningStar(candles: Candle[]): Candle[] | null {
  if (candles.length < 3) return null;
  
  const [third, second, first] = candles;
  if (!first || !second || !third) return null;

  // First candle should be bearish
  if (!isBearish(first)) return null;

  // Second candle should be small (doji-like)
  const secondBodySize = getBodySize(second);
  if (secondBodySize > getBodySize(first) * 0.3) return null;

  // Third candle should be bullish
  if (!isBullish(third)) return null;

  // Third candle should close above midpoint of first candle
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close <= firstMidpoint) return null;

  return [first, second, third];
}

export function findEveningStar(candles: Candle[]): Candle[] | null {
  if (candles.length < 3) return null;
  
  const [third, second, first] = candles;
  if (!first || !second || !third) return null;

  // First candle should be bullish
  if (!isBullish(first)) return null;

  // Second candle should be small (doji-like)
  const secondBodySize = getBodySize(second);
  if (secondBodySize > getBodySize(first) * 0.3) return null;

  // Third candle should be bearish
  if (!isBearish(third)) return null;

  // Third candle should close below midpoint of first candle
  const firstMidpoint = (first.open + first.close) / 2;
  if (third.close >= firstMidpoint) return null;

  return [first, second, third];
}

export function findThreeWhiteSoldiers(candles: Candle[]): Candle[] | null {
  if (candles.length < 3) return null;
  
  const [third, second, first] = candles;
  if (!first || !second || !third) return null;

  // All candles should be bullish
  if (!isBullish(first) || !isBullish(second) || !isBullish(third)) return null;

  // Each candle should open within previous candle's body
  if (second.open < first.open || third.open < second.open) return null;

  // Each candle should close higher than previous
  if (second.close <= first.close || third.close <= second.close) return null;

  // Small upper wicks
  if (getUpperWickSize(first) > getBodySize(first) * 0.1) return null;
  if (getUpperWickSize(second) > getBodySize(second) * 0.1) return null;
  if (getUpperWickSize(third) > getBodySize(third) * 0.1) return null;

  return [first, second, third];
}

export function findThreeBlackCrows(candles: Candle[]): Candle[] | null {
  if (candles.length < 3) return null;
  
  const [third, second, first] = candles;
  if (!first || !second || !third) return null;

  // All candles should be bearish
  if (!isBearish(first) || !isBearish(second) || !isBearish(third)) return null;

  // Each candle should open within previous candle's body
  if (second.open > first.open || third.open > second.open) return null;

  // Each candle should close lower than previous
  if (second.close >= first.close || third.close >= second.close) return null;

  // Small lower wicks
  if (getLowerWickSize(first) > getBodySize(first) * 0.1) return null;
  if (getLowerWickSize(second) > getBodySize(second) * 0.1) return null;
  if (getLowerWickSize(third) > getBodySize(third) * 0.1) return null;

  return [first, second, third];
}
