import { describe, it, expect } from 'vitest';
import {
  calculateBase,
  calculateGross,
  calculateGrossWithBonuses,
  calculateNet,
  calculateSalary,
  isValidCoefficient,
  coefficientToPercent,
  percentToCoefficient,
  DEFAULT_NET_COEFFICIENT,
  DEFAULT_PRECARITE_RATE,
  DEFAULT_CONGES_PAYES_RATE,
} from './calculations';

describe('calculateBase', () => {
  it('should calculate base salary (hours × rate)', () => {
    expect(calculateBase(8, 12)).toBe(96);
    expect(calculateBase(7.5, 15)).toBe(112.5);
    expect(calculateBase(0, 12)).toBe(0);
  });
});

describe('calculateGrossWithBonuses', () => {
  it('should calculate gross with précarité and congés payés', () => {
    // 8h × 12€ = 96€ base
    // + 10% précarité = 9.6€
    // + 10% congés payés on (96 + 9.6) = 10.56€
    // Total = 116.16€
    const result = calculateGrossWithBonuses(8, 12);
    expect(result.base).toBe(96);
    expect(result.precarite).toBe(9.6);
    expect(result.congesPayes).toBe(10.56);
    expect(result.total).toBe(116.16);
  });

  it('should handle zero hours', () => {
    const result = calculateGrossWithBonuses(0, 12);
    expect(result.base).toBe(0);
    expect(result.precarite).toBe(0);
    expect(result.congesPayes).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should allow custom rates', () => {
    // 10h × 10€ = 100€ base
    // + 5% précarité = 5€
    // + 5% congés payés on (100 + 5) = 5.25€
    // Total = 110.25€
    const result = calculateGrossWithBonuses(10, 10, 0.05, 0.05);
    expect(result.base).toBe(100);
    expect(result.precarite).toBe(5);
    expect(result.congesPayes).toBe(5.25);
    expect(result.total).toBe(110.25);
  });
});

describe('calculateGross', () => {
  it('should calculate gross with interim bonuses (base × 1.21)', () => {
    // 8h × 12€ × 1.21 = 116.16€
    expect(calculateGross(8, 12)).toBe(116.16);
    // 7.5h × 15€ × 1.21 = 136.125 → 136.13€
    expect(calculateGross(7.5, 15)).toBe(136.13);
    expect(calculateGross(0, 12)).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    // 7.33h × 11.11€ = 81.4363 base × 1.21 = 98.537923 → 98.54€
    expect(calculateGross(7.33, 11.11)).toBe(98.54);
    // 1h × 0.999€ = 0.999 base × 1.21 = 1.20879 → 1.21€
    expect(calculateGross(1, 0.999)).toBe(1.21);
  });
});

describe('calculateNet', () => {
  it('should calculate net correctly', () => {
    expect(calculateNet(100, 0.7)).toBe(70);
    expect(calculateNet(1000, 0.6993)).toBe(699.3);
  });

  it('should round to 2 decimal places', () => {
    expect(calculateNet(100, 0.6993)).toBe(69.93);
    expect(calculateNet(1234.56, 0.6993)).toBe(863.33);
  });
});

describe('calculateSalary', () => {
  it('should return both gross and net with bonuses', () => {
    // 8h × 12.5€ = 100€ base × 1.21 = 121€ gross
    // 121€ × 0.7 = 84.7€ net
    const result = calculateSalary(8, 12.5, 0.7);
    expect(result.gross).toBe(121);
    expect(result.net).toBe(84.7);
  });

  it('should handle edge cases', () => {
    const result = calculateSalary(0, 0, 0.7);
    expect(result.gross).toBe(0);
    expect(result.net).toBe(0);
  });
});

describe('DEFAULT constants', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_NET_COEFFICIENT).toBe(0.6993);
    expect(DEFAULT_PRECARITE_RATE).toBe(0.10);
    expect(DEFAULT_CONGES_PAYES_RATE).toBe(0.10);
  });

  it('should have reasonable net coefficient', () => {
    expect(DEFAULT_NET_COEFFICIENT).toBeGreaterThan(0.5);
    expect(DEFAULT_NET_COEFFICIENT).toBeLessThan(1);
  });
});

describe('isValidCoefficient', () => {
  it('should return true for valid coefficients', () => {
    expect(isValidCoefficient(0.5)).toBe(true);
    expect(isValidCoefficient(0.7)).toBe(true);
    expect(isValidCoefficient(1)).toBe(true);
    expect(isValidCoefficient(0.001)).toBe(true);
  });

  it('should return false for invalid coefficients', () => {
    expect(isValidCoefficient(0)).toBe(false);
    expect(isValidCoefficient(-0.5)).toBe(false);
    expect(isValidCoefficient(1.5)).toBe(false);
  });
});

describe('coefficientToPercent', () => {
  it('should convert coefficient to percentage string', () => {
    expect(coefficientToPercent(0.7)).toBe('70.00%');
    expect(coefficientToPercent(0.6993)).toBe('69.93%');
    expect(coefficientToPercent(1)).toBe('100.00%');
  });
});

describe('percentToCoefficient', () => {
  it('should convert percentage to coefficient', () => {
    expect(percentToCoefficient(70)).toBe(0.7);
    expect(percentToCoefficient(69.93)).toBe(0.6993);
    expect(percentToCoefficient(100)).toBe(1);
  });
});
