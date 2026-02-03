/**
 * Calculate gross salary from hours and hourly rate
 * @param hours Number of hours worked
 * @param hourlyRate Hourly rate in EUR
 * @returns Gross amount rounded to 2 decimals
 */
export function calculateGross(hours: number, hourlyRate: number): number {
  const gross = hours * hourlyRate;
  return Math.round(gross * 100) / 100;
}

/**
 * Calculate estimated net salary from gross using coefficient
 * @param gross Gross amount
 * @param netCoefficient Coefficient to estimate net (e.g., 0.6993)
 * @returns Net amount rounded to 2 decimals
 */
export function calculateNet(gross: number, netCoefficient: number): number {
  const net = gross * netCoefficient;
  return Math.round(net * 100) / 100;
}

/**
 * Calculate both gross and net from hours, rate, and coefficient
 * @param hours Number of hours worked
 * @param hourlyRate Hourly rate in EUR
 * @param netCoefficient Coefficient to estimate net
 * @returns Object with gross and net amounts
 */
export function calculateSalary(
  hours: number,
  hourlyRate: number,
  netCoefficient: number
): { gross: number; net: number } {
  const gross = calculateGross(hours, hourlyRate);
  const net = calculateNet(gross, netCoefficient);
  return { gross, net };
}

/**
 * Default net coefficient (approximate for France)
 * This represents roughly 70% of gross, accounting for social charges
 */
export const DEFAULT_NET_COEFFICIENT = 0.6993;

/**
 * Validate that a coefficient is in a reasonable range
 * @param coefficient The coefficient to validate
 * @returns true if valid, false otherwise
 */
export function isValidCoefficient(coefficient: number): boolean {
  return coefficient > 0 && coefficient <= 1;
}

/**
 * Convert coefficient to percentage string
 * @param coefficient The coefficient (e.g., 0.6993)
 * @returns Percentage string (e.g., "69.93%")
 */
export function coefficientToPercent(coefficient: number): string {
  return `${(coefficient * 100).toFixed(2)}%`;
}

/**
 * Convert percentage to coefficient
 * @param percent The percentage (e.g., 69.93)
 * @returns Coefficient (e.g., 0.6993)
 */
export function percentToCoefficient(percent: number): number {
  return percent / 100;
}
