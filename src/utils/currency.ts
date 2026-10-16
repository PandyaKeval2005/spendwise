/**
 * Currency Formatting Utilities
 * Prioritizes Indian Number Formatting (₹12,500.00 / ₹1,25,000.00)
 */

export function formatCurrency(
  amount: number | string | null | undefined,
  symbol = '₹',
  includeDecimals = true
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return `${symbol}0.00`;

  const isNegative = num < 0;
  const absAmount = Math.abs(num);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function formatCompactCurrency(
  amount: number | string | null | undefined,
  symbol = '₹'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return `${symbol}0`;

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) {
    // 1 Crore
    return `${sign}${symbol}${(abs / 10000000).toFixed(2)} Cr`;
  } else if (abs >= 100000) {
    // 1 Lakh
    return `${sign}${symbol}${(abs / 100000).toFixed(2)} L`;
  } else if (abs >= 1000) {
    // 1 Thousand
    return `${sign}${symbol}${(abs / 1000).toFixed(1)} k`;
  }

  return `${sign}${symbol}${abs.toFixed(0)}`;
}
