/**
 * Default rates for interim bonuses in France
 */
export const DEFAULT_PRECARITE_RATE = 0.10; // 10% prime de précarité
export const DEFAULT_CONGES_PAYES_RATE = 0.10; // 10% indemnité congés payés

/**
 * Calculate base salary (hours × rate)
 */
export function calculateBase(hours: number, hourlyRate: number): number {
  return Math.round(hours * hourlyRate * 100) / 100;
}

/**
 * Calculate gross salary with interim bonuses
 * Formula: base + 10% précarité + 10% congés payés (on base + précarité)
 *
 * @param hours Number of hours worked
 * @param hourlyRate Hourly rate in EUR
 * @param precariteRate Prime de précarité rate (default 10%)
 * @param congesPayesRate Congés payés rate (default 10%)
 * @returns Object with breakdown and total gross
 */
export function calculateGrossWithBonuses(
  hours: number,
  hourlyRate: number,
  precariteRate: number = DEFAULT_PRECARITE_RATE,
  congesPayesRate: number = DEFAULT_CONGES_PAYES_RATE
): {
  base: number;
  precarite: number;
  congesPayes: number;
  total: number;
} {
  const base = hours * hourlyRate;
  const precarite = base * precariteRate;
  const congesPayes = (base + precarite) * congesPayesRate;
  const total = base + precarite + congesPayes;

  return {
    base: Math.round(base * 100) / 100,
    precarite: Math.round(precarite * 100) / 100,
    congesPayes: Math.round(congesPayes * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Calculate gross salary from hours and hourly rate (with bonuses)
 * @param hours Number of hours worked
 * @param hourlyRate Hourly rate in EUR
 * @returns Gross amount rounded to 2 decimals (including précarité + congés payés)
 */
export function calculateGross(hours: number, hourlyRate: number): number {
  const { total } = calculateGrossWithBonuses(hours, hourlyRate);
  return total;
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
