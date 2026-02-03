import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDateISO,
  parseISODate,
  formatDateDisplay,
  formatMonthDisplay,
  getCurrentMonth,
  getToday,
  getPreviousMonth,
  getNextMonth,
  addDays,
  isDateInMonth,
  getMonthBounds,
  sortDatesAsc,
  sortDatesDesc,
} from './dates';

describe('formatDateISO', () => {
  it('should format date to YYYY-MM-DD', () => {
    expect(formatDateISO(new Date(2024, 0, 15))).toBe('2024-01-15');
    expect(formatDateISO(new Date(2024, 11, 1))).toBe('2024-12-01');
  });

  it('should pad single digits with zeros', () => {
    expect(formatDateISO(new Date(2024, 0, 5))).toBe('2024-01-05');
    expect(formatDateISO(new Date(2024, 5, 9))).toBe('2024-06-09');
  });
});

describe('parseISODate', () => {
  it('should parse YYYY-MM-DD string to Date', () => {
    const date = parseISODate('2024-01-15');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(15);
  });
});

describe('formatDateDisplay', () => {
  it('should format date for display in French', () => {
    const result = formatDateDisplay('2024-01-15');
    expect(result).toContain('15');
    expect(result.toLowerCase()).toMatch(/jan/);
  });
});

describe('formatMonthDisplay', () => {
  it('should format month for display in French', () => {
    const result = formatMonthDisplay('2024-01');
    expect(result.toLowerCase()).toContain('janvier');
    expect(result).toContain('2024');
  });
});

describe('getCurrentMonth and getToday', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return current month in YYYY-MM format', () => {
    vi.setSystemTime(new Date(2024, 5, 15));
    expect(getCurrentMonth()).toBe('2024-06');
  });

  it('should return today in YYYY-MM-DD format', () => {
    vi.setSystemTime(new Date(2024, 5, 15));
    expect(getToday()).toBe('2024-06-15');
  });
});

describe('getPreviousMonth', () => {
  it('should return previous month', () => {
    expect(getPreviousMonth('2024-03')).toBe('2024-02');
    expect(getPreviousMonth('2024-01')).toBe('2023-12');
  });
});

describe('getNextMonth', () => {
  it('should return next month', () => {
    expect(getNextMonth('2024-03')).toBe('2024-04');
    expect(getNextMonth('2024-12')).toBe('2025-01');
  });
});

describe('addDays', () => {
  it('should add days to a date', () => {
    expect(addDays('2024-01-15', 1)).toBe('2024-01-16');
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // Leap year
    expect(addDays('2024-01-15', -1)).toBe('2024-01-14');
  });
});

describe('isDateInMonth', () => {
  it('should check if date is in month', () => {
    expect(isDateInMonth('2024-01-15', '2024-01')).toBe(true);
    expect(isDateInMonth('2024-01-01', '2024-01')).toBe(true);
    expect(isDateInMonth('2024-01-31', '2024-01')).toBe(true);
    expect(isDateInMonth('2024-02-01', '2024-01')).toBe(false);
  });
});

describe('getMonthBounds', () => {
  it('should return start and end dates of month', () => {
    const bounds = getMonthBounds('2024-01');
    expect(bounds.start).toBe('2024-01-01');
    expect(bounds.end).toBe('2024-01-31');
  });

  it('should handle February in leap year', () => {
    const bounds = getMonthBounds('2024-02');
    expect(bounds.start).toBe('2024-02-01');
    expect(bounds.end).toBe('2024-02-29');
  });
});

describe('sortDatesAsc', () => {
  it('should sort dates in ascending order', () => {
    const dates = ['2024-01-15', '2024-01-05', '2024-01-25'];
    expect(sortDatesAsc(dates)).toEqual([
      '2024-01-05',
      '2024-01-15',
      '2024-01-25',
    ]);
  });

  it('should not mutate original array', () => {
    const dates = ['2024-01-15', '2024-01-05'];
    sortDatesAsc(dates);
    expect(dates).toEqual(['2024-01-15', '2024-01-05']);
  });
});

describe('sortDatesDesc', () => {
  it('should sort dates in descending order', () => {
    const dates = ['2024-01-05', '2024-01-25', '2024-01-15'];
    expect(sortDatesDesc(dates)).toEqual([
      '2024-01-25',
      '2024-01-15',
      '2024-01-05',
    ]);
  });
});
