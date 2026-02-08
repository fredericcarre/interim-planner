import type { WorkEntry } from '@/types';
import { parseISODate, formatMonthDisplay } from '@/utils/dates';
import { formatHours } from '@/utils/format';

/**
 * Generate an iCalendar (.ics) file content from work entries.
 * The .ics format is supported by iPhone Calendar, Google Calendar, Outlook, etc.
 *
 * @param entries Work entries to export
 * @param month Month string (YYYY-MM) for the file name context
 * @returns ICS file content as string
 */
export function generateICS(entries: WorkEntry[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Interim Planner//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Interim Planner',
    'X-WR-TIMEZONE:Europe/Paris',
  ];

  for (const entry of entries) {
    const date = parseISODate(entry.date);
    const dateStr = formatICSDate(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const endDateStr = formatICSDate(endDate);

    const summary = `${entry.establishmentNameSnapshot} - ${formatHours(entry.hours)}`;
    const description = entry.note ? escapeICSText(entry.note) : '';

    lines.push('BEGIN:VEVENT');
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    lines.push(`DTEND;VALUE=DATE:${endDateStr}`);
    lines.push(`SUMMARY:${escapeICSText(summary)}`);
    if (description) {
      lines.push(`DESCRIPTION:${description}`);
    }
    lines.push(`UID:${entry.id}@interim-planner`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Format a Date as an iCalendar all-day date (YYYYMMDD)
 */
function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Escape special characters for iCalendar text values
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Download work entries as an .ics file
 *
 * @param entries Work entries to export
 * @param month Month string (YYYY-MM) used for the filename
 */
export function downloadICS(entries: WorkEntry[], month: string): void {
  const icsContent = generateICS(entries);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const monthLabel = formatMonthDisplay(month).replace(/\s+/g, '-');
  const filename = `interim-${monthLabel}.ics`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
