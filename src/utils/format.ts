/**
 * Format a number with appropriate decimal places and separators
 */
export function formatNumber(value: number): string {
  // Handle special cases
  if (isNaN(value)) return 'N/A';
  if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
  if (value === 0) return '0';

  // Determine decimal places based on magnitude
  let decimals = 2;
  if (Math.abs(value) < 0.01) decimals = 6;
  else if (Math.abs(value) < 1) decimals = 4;
  else if (Math.abs(value) >= 1000) decimals = 0;

  // Format with appropriate decimals and separators
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a percentage value with appropriate decimal places
 */
export function formatPercentage(value: number): string {
  // Handle special cases
  if (isNaN(value)) return 'N/A';
  if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
  if (value === 0) return '0';

  // Determine decimal places based on magnitude
  let decimals = 2;
  if (Math.abs(value) < 0.01) decimals = 4;
  else if (Math.abs(value) < 0.1) decimals = 3;
  else if (Math.abs(value) >= 100) decimals = 0;

  // Format with appropriate decimals
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a currency value with appropriate symbol and decimal places
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  // Handle special cases
  if (isNaN(value)) return 'N/A';
  if (!isFinite(value)) return value > 0 ? '∞' : '-∞';
  if (value === 0) return `0 ${currency}`;

  // Determine decimal places based on magnitude
  let decimals = 2;
  if (Math.abs(value) < 0.01) decimals = 6;
  else if (Math.abs(value) < 1) decimals = 4;
  else if (Math.abs(value) >= 1000) decimals = 0;

  // Format with appropriate decimals and currency
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)} ${currency}`;
} 