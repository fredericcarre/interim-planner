import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatHours,
  formatHourlyRate,
  parseFormattedNumber,
  roundTo,
} from './format';

describe('formatCurrency', () => {
  it('should format number as EUR currency', () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/1[\s\u202f]?234,56/);
    expect(result).toContain('€');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0,00/);
  });

  it('should round to 2 decimals', () => {
    const result = formatCurrency(12.999);
    expect(result).toMatch(/13,00/);
  });
});

describe('formatNumber', () => {
  it('should format number with French locale', () => {
    expect(formatNumber(1234.56)).toMatch(/1[\s\u202f]?234,56/);
    expect(formatNumber(0.5)).toBe('0,50');
  });

  it('should respect decimal places parameter', () => {
    expect(formatNumber(1.5, 1)).toBe('1,5');
    expect(formatNumber(1.567, 0)).toBe('2');
  });
});

describe('formatHours', () => {
  it('should format whole hours without decimals', () => {
    expect(formatHours(8)).toBe('8h');
    expect(formatHours(12)).toBe('12h');
  });

  it('should format fractional hours with one decimal', () => {
    expect(formatHours(7.5)).toBe('7,5h');
    expect(formatHours(8.25)).toBe('8,3h');
  });
});

describe('formatHourlyRate', () => {
  it('should format hourly rate with /h suffix', () => {
    const result = formatHourlyRate(12.5);
    expect(result).toMatch(/12,50.*€.*\/h/);
  });
});

describe('parseFormattedNumber', () => {
  it('should parse French formatted numbers', () => {
    expect(parseFormattedNumber('1 234,56')).toBe(1234.56);
    expect(parseFormattedNumber('0,50')).toBe(0.5);
    expect(parseFormattedNumber('12')).toBe(12);
  });

  it('should return 0 for invalid input', () => {
    expect(parseFormattedNumber('abc')).toBe(0);
    expect(parseFormattedNumber('')).toBe(0);
  });
});

describe('roundTo', () => {
  it('should round to specified decimal places', () => {
    expect(roundTo(1.234, 2)).toBe(1.23);
    expect(roundTo(1.235, 2)).toBe(1.24);
    expect(roundTo(1.5, 0)).toBe(2);
  });

  it('should default to 2 decimal places', () => {
    expect(roundTo(1.234)).toBe(1.23);
  });
});
