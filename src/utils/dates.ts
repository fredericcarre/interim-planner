/**
 * Format a date to YYYY-MM-DD string
 * @param date Date object
 * @returns String in YYYY-MM-DD format
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to Date object
 * @param dateString String in YYYY-MM-DD format
 * @returns Date object (at midnight local time)
 */
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display in French locale
 * @param dateString YYYY-MM-DD string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateDisplay(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }
): string {
  const date = parseISODate(dateString);
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Format date for long display
 * @param dateString YYYY-MM-DD string
 * @returns e.g., "Lundi 15 janvier 2024"
 */
export function formatDateLong(dateString: string): string {
  const date = parseISODate(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Get the current month as YYYY-MM string
 * @returns Current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns Today in YYYY-MM-DD format
 */
export function getToday(): string {
  return formatDateISO(new Date());
}

/**
 * Format month for display in French
 * @param monthString YYYY-MM string
 * @returns e.g., "Janvier 2024"
 */
export function formatMonthDisplay(monthString: string): string {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/**
 * Get previous month string
 * @param monthString YYYY-MM string
 * @returns Previous month in YYYY-MM format
 */
export function getPreviousMonth(monthString: string): string {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get next month string
 * @param monthString YYYY-MM string
 * @returns Next month in YYYY-MM format
 */
export function getNextMonth(monthString: string): string {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Add days to a date string
 * @param dateString YYYY-MM-DD string
 * @param days Number of days to add
 * @returns New date in YYYY-MM-DD format
 */
export function addDays(dateString: string, days: number): string {
  const date = parseISODate(dateString);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}

/**
 * Check if a date is in a given month
 * @param dateString YYYY-MM-DD string
 * @param monthString YYYY-MM string
 * @returns true if date is in the month
 */
export function isDateInMonth(dateString: string, monthString: string): boolean {
  return dateString.startsWith(monthString);
}

/**
 * Get start and end dates of a month
 * @param monthString YYYY-MM string
 * @returns Object with start and end dates in YYYY-MM-DD format
 */
export function getMonthBounds(monthString: string): { start: string; end: string } {
  const [year, month] = monthString.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Last day of month
  return {
    start: formatDateISO(start),
    end: formatDateISO(end)
  };
}

/**
 * Sort dates in ascending order
 * @param dates Array of YYYY-MM-DD strings
 * @returns Sorted array
 */
export function sortDatesAsc(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b));
}

/**
 * Sort dates in descending order
 * @param dates Array of YYYY-MM-DD strings
 * @returns Sorted array
 */
export function sortDatesDesc(dates: string[]): string[] {
  return [...dates].sort((a, b) => b.localeCompare(a));
}
