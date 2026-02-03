import { describe, it, expect } from 'vitest';
import {
  calculateGross,
  calculateNet,
  calculateSalary,
  isValidCoefficient,
  coefficientToPercent,
  percentToCoefficient,
  DEFAULT_NET_COEFFICIENT,
} from './calculations';

describe('calculateGross', () => {
  it('should calculate gross correctly', () => {
    expect(calculateGross(8, 12)).toBe(96);
    expect(calculateGross(7.5, 15)).toBe(112.5);
    expect(calculateGross(0, 12)).toBe(0);
  });

  it('should round to 2 decimal places', () => {
    expect(calculateGross(7.33, 11.11)).toBe(81.44);
    expect(calculateGross(1, 0.999)).toBe(1);
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
  it('should return both gross and net', () => {
    const result = calculateSalary(8, 12.5, 0.7);
    expect(result.gross).toBe(100);
    expect(result.net).toBe(70);
  });

  it('should handle edge cases', () => {
    const result = calculateSalary(0, 0, 0.7);
    expect(result.gross).toBe(0);
    expect(result.net).toBe(0);
  });
});

describe('DEFAULT_NET_COEFFICIENT', () => {
  it('should be a reasonable value', () => {
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
