import { useMemo } from 'react';
import {
  formatDateDisplay,
  formatDateISO,
  getNextMonth,
  getPreviousMonth,
  formatMonthDisplay,
  parseISODate,
} from '@/utils/dates';
import styles from './MultiDatePicker.module.css';

interface MultiDatePickerProps {
  label?: string;
  dates: string[];
  onChange: (dates: string[]) => void;
  disabledDates?: string[];
  month: string;
  onMonthChange: (month: string) => void;
  helperText?: string;
}

function getCalendarDays(monthString: string): (string | null)[] {
  const [year, month] = monthString.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (string | null)[] = [];

  // Leading empty cells
  for (let i = 0; i < startDow; i++) {
    cells.push(null);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(formatDateISO(new Date(year, month - 1, d)));
  }

  return cells;
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function MultiDatePicker({ label, dates, onChange, disabledDates = [], month, onMonthChange, helperText }: MultiDatePickerProps) {
  const selectedSet = useMemo(() => new Set(dates), [dates]);
  const disabledSet = useMemo(() => new Set(disabledDates), [disabledDates]);

  const calendarDays = useMemo(() => getCalendarDays(month), [month]);

  const handleToggleDate = (dateStr: string) => {
    if (disabledSet.has(dateStr)) return;
    if (selectedSet.has(dateStr)) {
      onChange(dates.filter((d) => d !== dateStr));
    } else {
      onChange([...dates, dateStr].sort());
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    onChange(dates.filter((d) => d !== dateToRemove));
  };

  const today = formatDateISO(new Date());

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      {/* Calendar */}
      <div className={styles.calendar}>
        {/* Month navigation */}
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => onMonthChange(getPreviousMonth(month))}
            aria-label="Mois précédent"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className={styles.monthLabel}>
            {formatMonthDisplay(month)}
          </span>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => onMonthChange(getNextMonth(month))}
            aria-label="Mois suivant"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className={styles.dayHeaders}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} className={styles.dayHeader}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className={styles.dayGrid}>
          {calendarDays.map((dateStr, i) => {
            if (!dateStr) {
              return <div key={`empty-${i}`} className={styles.dayCell} />;
            }

            const isSelected = selectedSet.has(dateStr);
            const isDisabled = disabledSet.has(dateStr);
            const isToday = dateStr === today;
            const dayNum = parseISODate(dateStr).getDate();

            return (
              <button
                key={dateStr}
                type="button"
                className={[
                  styles.dayCell,
                  isDisabled ? styles.dayCellDisabled : styles.dayCellActive,
                  isSelected ? styles.dayCellSelected : '',
                  isToday && !isSelected && !isDisabled ? styles.dayCellToday : '',
                ].join(' ')}
                onClick={() => handleToggleDate(dateStr)}
                disabled={isDisabled}
                aria-label={isDisabled ? `${dayNum} - déjà saisie` : `${isSelected ? 'Retirer' : 'Ajouter'} le ${dayNum}`}
                aria-pressed={isDisabled ? undefined : isSelected}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected dates chips */}
      {dates.length > 0 && (
        <div className={styles.datesList}>
          {dates.map((date) => (
            <div key={date} className={styles.dateChip}>
              <span className={styles.dateText}>{formatDateDisplay(date)}</span>
              <button
                type="button"
                onClick={() => handleRemoveDate(date)}
                className={styles.removeButton}
                aria-label={`Supprimer ${date}`}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {dates.length > 0 && (
        <p className={styles.count}>
          {dates.length} date{dates.length > 1 ? 's' : ''} sélectionnée{dates.length > 1 ? 's' : ''}
        </p>
      )}

      {helperText && <p className={styles.helperText}>{helperText}</p>}
    </div>
  );
}
