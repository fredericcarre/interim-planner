/**
 * Format a number as currency (EUR)
 * @param amount The amount to format
 * @param currency Currency code (default: EUR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a number with French locale
 * @param value The number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format hours display
 * @param hours Number of hours
 * @returns Formatted string (e.g., "7.5h" or "7h")
 */
export function formatHours(hours: number): string {
  if (hours % 1 === 0) {
    return `${hours}h`;
  }
  return `${formatNumber(hours, 1)}h`;
}

/**
 * Format hourly rate display
 * @param rate Hourly rate
 * @returns Formatted string (e.g., "12,50 €/h")
 */
export function formatHourlyRate(rate: number): string {
  return `${formatCurrency(rate)}/h`;
}

/**
 * Parse a French formatted number string back to number
 * @param value String with French number format (e.g., "1 234,56")
 * @returns Number value
 */
export function parseFormattedNumber(value: string): number {
  // Remove spaces and replace comma with dot
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Round to specific decimal places
 * @param value Number to round
 * @param decimals Decimal places
 * @returns Rounded number
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
