import { Candle } from './types';

const MIN_POINTS = 5;
const PRICE_TOLERANCE = 0.02; // 2% tolerance for price comparisons
const VOLUME_RATIO = 1.5; // Volume should increase by 50%

interface Point {
  index: number;
  price: number;
}

interface Pattern {
  type: string;
  points: Point[];
  strength: number;
}

function findPivotHigh(candles: Candle[], index: number, lookback: number = 5): Point | null {
  if (index < lookback || index >= candles.length - lookback) return null;

  const current = candles[index];
  if (!current) return null;

  for (let i = 1; i <= lookback; i++) {
    const before = candles[index - i];
    const after = candles[index + i];
    if (!before || !after) return null;

    if (current.high <= before.high || current.high <= after.high) {
      return null;
    }
  }

  return {
    index,
    price: current.high
  };
}

function findPivotLow(candles: Candle[], index: number, lookback: number = 5): Point | null {
  if (index < lookback || index >= candles.length - lookback) return null;

  const current = candles[index];
  if (!current) return null;

  for (let i = 1; i <= lookback; i++) {
    const before = candles[index - i];
    const after = candles[index + i];
    if (!before || !after) return null;

    if (current.low >= before.low || current.low >= after.low) {
      return null;
    }
  }

  return {
    index,
    price: current.low
  };
}

function isWithinTolerance(price1: number, price2: number): boolean {
  return Math.abs(price1 - price2) / price1 <= PRICE_TOLERANCE;
}

function hasIncreasingVolume(candles: Candle[], startIndex: number, endIndex: number): boolean {
  if (startIndex >= endIndex || startIndex < 0 || endIndex >= candles.length) return false;

  const baseVolume = candles[startIndex]?.volume || 0;
  for (let i = startIndex + 1; i <= endIndex; i++) {
    const volume = candles[i]?.volume || 0;
    if (volume < baseVolume * VOLUME_RATIO) {
      return false;
    }
  }
  return true;
}

export function findHeadAndShoulders(candles: Candle[]): Pattern | null {
  const patterns: Point[] = [];
  let maxStrength = 0;

  for (let i = candles.length - 1; i >= 4; i--) {
    // Find potential right shoulder
    const rightShoulder = findPivotHigh(candles, i);
    if (!rightShoulder) continue;

    // Find potential head
    const headIndex = findPivotHigh(candles, i - 2);
    if (!headIndex) continue;

    // Find potential left shoulder
    const leftShoulder = findPivotHigh(candles, i - 4);
    if (!leftShoulder) continue;

    // Validate pattern
    if (!isValidHeadAndShoulders(leftShoulder, headIndex, rightShoulder)) {
      continue;
    }

    // Calculate neckline
    const neckline = calculateNeckline(leftShoulder, rightShoulder);
    if (!neckline) continue;

    // Calculate pattern strength
    const strength = calculatePatternStrength(
      [leftShoulder, headIndex, rightShoulder],
      neckline,
      candles
    );

    if (strength > maxStrength) {
      maxStrength = strength;
      patterns.length = 0; // Clear previous patterns
      patterns.push(leftShoulder, headIndex, rightShoulder);
    }
  }

  return patterns.length > 0
    ? {
        type: 'head_and_shoulders',
        points: patterns,
        strength: maxStrength
      }
    : null;
}

function isValidHeadAndShoulders(
  left: Point,
  head: Point,
  right: Point
): boolean {
  // Head should be higher than shoulders
  if (head.price <= left.price || head.price <= right.price) {
    return false;
  }

  // Shoulders should be at similar levels
  if (!isWithinTolerance(left.price, right.price)) {
    return false;
  }

  return true;
}

function calculateNeckline(start: Point, end: Point): { slope: number; intercept: number } | null {
  if (!start || !end || start.index === end.index) return null;

  const slope = (end.price - start.price) / (end.index - start.index);
  const intercept = start.price - slope * start.index;

  return { slope, intercept };
}

function calculatePatternStrength(points: Point[], neckline: { slope: number; intercept: number }, candles: Candle[]): number {
  let strength = 0;

  // Check volume profile
  const startIndex = points[0].index;
  const endIndex = points[points.length - 1].index;
  
  if (hasIncreasingVolume(candles, startIndex, endIndex)) {
    strength += 0.3;
  }

  // Check price symmetry
  const [left, head, right] = points;
  if (left && head && right) {
    const leftHeight = head.price - left.price;
    const rightHeight = head.price - right.price;
    const symmetry = Math.min(leftHeight, rightHeight) / Math.max(leftHeight, rightHeight);
    strength += symmetry * 0.4;
  }

  // Check neckline slope
  const slopeStrength = Math.abs(neckline.slope) < 0.1 ? 0.3 : 0.15;
  strength += slopeStrength;

  return strength;
}

export function findDoubleTop(candles: Candle[]): Pattern | null {
  const patterns: Point[] = [];
  let maxStrength = 0;

  for (let i = candles.length - 1; i >= 2; i--) {
    // Find potential second peak
    const second = findPivotHigh(candles, i);
    if (!second) continue;

    // Find potential first peak
    const first = findPivotHigh(candles, i - 2);
    if (!first) continue;

    // Validate pattern
    if (!isValidDoubleTop(first, second)) {
      continue;
    }

    // Calculate pattern strength
    const strength = calculateDoublePatternStrength(
      [first, second],
      candles
    );

    if (strength > maxStrength) {
      maxStrength = strength;
      patterns.length = 0;
      patterns.push(first, second);
    }
  }

  return patterns.length > 0
    ? {
        type: 'double_top',
        points: patterns,
        strength: maxStrength
      }
    : null;
}

function isValidDoubleTop(first: Point, second: Point): boolean {
  // Peaks should be at similar levels
  return isWithinTolerance(first.price, second.price);
}

export function findDoubleBottom(candles: Candle[]): Pattern | null {
  const patterns: Point[] = [];
  let maxStrength = 0;

  for (let i = candles.length - 1; i >= 2; i--) {
    // Find potential second trough
    const second = findPivotLow(candles, i);
    if (!second) continue;

    // Find potential first trough
    const first = findPivotLow(candles, i - 2);
    if (!first) continue;

    // Validate pattern
    if (!isValidDoubleBottom(first, second)) {
      continue;
    }

    // Calculate pattern strength
    const strength = calculateDoublePatternStrength(
      [first, second],
      candles
    );

    if (strength > maxStrength) {
      maxStrength = strength;
      patterns.length = 0;
      patterns.push(first, second);
    }
  }

  return patterns.length > 0
    ? {
        type: 'double_bottom',
        points: patterns,
        strength: maxStrength
      }
    : null;
}

function isValidDoubleBottom(first: Point, second: Point): boolean {
  // Troughs should be at similar levels
  return isWithinTolerance(first.price, second.price);
}

function calculateDoublePatternStrength(points: Point[], candles: Candle[]): number {
  let strength = 0;

  // Check volume profile
  const startIndex = points[0].index;
  const endIndex = points[points.length - 1].index;
  
  if (hasIncreasingVolume(candles, startIndex, endIndex)) {
    strength += 0.4;
  }

  // Check price levels
  const [first, second] = points;
  if (first && second) {
    // Check how close the peaks/troughs are
    const similarity = 1 - Math.abs(first.price - second.price) / first.price;
    strength += similarity * 0.4;

    // Check time spacing
    const spacing = second.index - first.index;
    const spacingScore = Math.min(spacing / 10, 1) * 0.2;
    strength += spacingScore;
  }

  return strength;
}

export function findTrendline(candles: Candle[], pivotCount: number = 3): Pattern | null {
  const points: Point[] = [];
  let strength = 0;

  // Find pivot points
  for (let i = candles.length - 1; i >= 0; i--) {
    const pivot = findPivotLow(candles, i);
    if (pivot) {
      points.push(pivot);
      if (points.length >= pivotCount) break;
    }
  }

  if (points.length < pivotCount) return null;

  // Calculate trendline
  const { slope, intercept } = calculateTrendline(points);
  if (slope === 0) return null;

  // Calculate strength based on how well points fit the line
  strength = calculateTrendlineStrength(points, slope, intercept);

  return {
    type: slope > 0 ? 'uptrend' : 'downtrend',
    points,
    strength
  };
}

function calculateTrendline(points: Point[]): { slope: number; intercept: number } {
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

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function calculateTrendlineStrength(
  points: Point[],
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

export function findVolumeTrend(candles: Candle[], period: number = 10): 'increasing' | 'decreasing' | 'neutral' {
  if (candles.length < period) return 'neutral';

  const volumes = candles.slice(0, period).map(c => c?.volume || 0);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / period;
  const recentVolume = volumes[0];

  if (recentVolume > avgVolume * 1.5) return 'increasing';
  if (recentVolume < avgVolume * 0.5) return 'decreasing';
  return 'neutral';
}

export function findVolumeSpike(candles: Candle[], threshold: number = 2): number[] {
  const spikes: number[] = [];
  if (candles.length < 2) return spikes;

  for (let i = 0; i < candles.length - 1; i++) {
    const current = candles[i];
    const previous = candles[i + 1];
    if (!current || !previous) continue;

    if (current.volume > previous.volume * threshold) {
      spikes.push(i);
    }
  }

  return spikes;
}

export function findVolumeSupport(candles: Candle[], period: number = 20): number {
  if (candles.length < period) return 0;

  const volumes = candles.slice(0, period).map(c => c?.volume || 0);
  return Math.min(...volumes);
}
