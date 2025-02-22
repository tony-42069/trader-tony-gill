import { Candle } from './types';

export interface TrendPoint {
  index: number;
  price: number;
  volume?: number;
}

export interface TrendLine {
  slope: number;
  intercept: number;
  points: TrendPoint[];
  strength: number;
}

export function findPivotPoints(
  candles: Candle[],
  lookback: number = 5
): TrendPoint[] {
  const pivots: TrendPoint[] = [];
  if (candles.length < lookback * 2 + 1) return pivots;

  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];
    if (!current) continue;

    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= lookback; j++) {
      const before = candles[i - j];
      const after = candles[i + j];
      if (!before || !after) {
        isHigh = false;
        isLow = false;
        break;
      }

      if (current.high <= before.high || current.high <= after.high) {
        isHigh = false;
      }
      if (current.low >= before.low || current.low >= after.low) {
        isLow = false;
      }
    }

    if (isHigh) {
      pivots.push({
        index: i,
        price: current.high,
        volume: current.volume
      });
    } else if (isLow) {
      pivots.push({
        index: i,
        price: current.low,
        volume: current.volume
      });
    }
  }

  return pivots;
}

export function calculateTrendLine(points: TrendPoint[]): TrendLine | null {
  if (points.length < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  const n = points.length;

  for (const point of points) {
    sumX += point.index;
    sumY += point.price;
    sumXY += point.index * point.price;
    sumX2 += point.index * point.index;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    points: [...points],
    strength: calculateTrendStrength(points, slope, intercept)
  };
}

function calculateTrendStrength(
  points: TrendPoint[],
  slope: number,
  intercept: number
): number {
  let totalDeviation = 0;
  let maxPrice = -Infinity;
  let minPrice = Infinity;

  for (const point of points) {
    const expectedPrice = slope * point.index + intercept;
    const deviation = Math.abs(point.price - expectedPrice) / point.price;
    totalDeviation += deviation;

    maxPrice = Math.max(maxPrice, point.price);
    minPrice = Math.min(minPrice, point.price);
  }

  const averageDeviation = totalDeviation / points.length;
  const priceRange = maxPrice - minPrice;
  const rangeStrength = priceRange / maxPrice;

  return (1 - averageDeviation) * 0.7 + rangeStrength * 0.3;
}

export function findSupportResistance(
  candles: Candle[],
  period: number = 20,
  tolerance: number = 0.02
): { support: number[]; resistance: number[] } {
  const levels = {
    support: [] as number[],
    resistance: [] as number[]
  };

  if (candles.length < period) return levels;

  // Filter out invalid candles and extract prices
  const validCandles = candles.slice(0, period).filter((candle): candle is Candle => candle !== undefined);
  if (validCandles.length === 0) return levels;

  const prices = validCandles.reduce((acc, candle) => {
    acc.push(candle.high, candle.low);
    return acc;
  }, [] as number[]);

  prices.sort((a, b) => a - b);
  if (prices.length === 0) return levels;

  let currentLevel = prices[0];
  let count = 1;

  for (let i = 1; i < prices.length; i++) {
    const price = prices[i];
    if (typeof price !== 'number' || typeof currentLevel !== 'number') {
      currentLevel = typeof price === 'number' ? price : prices[i + 1];
      continue;
    }

    const diff = Math.abs(price - currentLevel) / currentLevel;

    if (diff <= tolerance) {
      count++;
    } else {
      if (count >= 3) {
        const level = currentLevel;
        let isSupport = true;
        let isResistance = true;

        // Verify level with valid candles only
        for (const candle of validCandles) {
          if (candle.low > level * (1 + tolerance)) {
            isSupport = false;
          }
          if (candle.high < level * (1 - tolerance)) {
            isResistance = false;
          }
        }

        if (isSupport) levels.support.push(level);
        if (isResistance) levels.resistance.push(level);
      }
      currentLevel = price;
      count = 1;
    }
  }

  return levels;
}

export function findVolumeProfile(
  candles: Candle[],
  period: number = 20
): { price: number; volume: number }[] {
  const profile: { price: number; volume: number }[] = [];
  if (candles.length < period) return profile;

  const priceMap = new Map<number, number>();

  for (const candle of candles.slice(0, period)) {
    if (!candle) continue;

    const price = Math.round(candle.close * 100) / 100; // Round to 2 decimals
    const volume = candle.volume || 0;
    priceMap.set(price, (priceMap.get(price) || 0) + volume);
  }

  return Array.from(priceMap.entries())
    .map(([price, volume]) => ({ price, volume }))
    .sort((a, b) => b.volume - a.volume);
}

export function findBreakoutPoints(
  candles: Candle[],
  period: number = 20,
  volumeThreshold: number = 2
): TrendPoint[] {
  const breakouts: TrendPoint[] = [];
  if (candles.length < period + 1) return breakouts;

  const avgVolume = candles
    .slice(1, period + 1)
    .reduce((sum, candle) => sum + (candle?.volume || 0), 0) / period;

  for (let i = 0; i < candles.length - period; i++) {
    const current = candles[i];
    const prev = candles[i + 1];
    if (!current || !prev) continue;

    const volume = current.volume || 0;
    if (volume < avgVolume * volumeThreshold) continue;

    const priceChange = (current.close - prev.close) / prev.close;
    if (Math.abs(priceChange) >= 0.05) { // 5% price movement
      breakouts.push({
        index: i,
        price: current.close,
        volume
      });
    }
  }

  return breakouts;
}
