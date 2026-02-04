import { useState } from 'react';
import { formatDateDisplay } from '@/utils/dates';
import styles from './MultiDatePicker.module.css';

interface MultiDatePickerProps {
  label?: string;
  dates: string[];
  onChange: (dates: string[]) => void;
  helperText?: string;
}

export function MultiDatePicker({ label, dates, onChange, helperText }: MultiDatePickerProps) {
  const [newDate, setNewDate] = useState('');

  const handleAddDate = () => {
    if (newDate && !dates.includes(newDate)) {
      const updatedDates = [...dates, newDate].sort();
      onChange(updatedDates);
      setNewDate('');
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    onChange(dates.filter((d) => d !== dateToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDate();
    }
  };

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={styles.inputRow}>
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.dateInput}
        />
        <button
          type="button"
          onClick={handleAddDate}
          disabled={!newDate || dates.includes(newDate)}
          className={styles.addButton}
        >
          Ajouter
        </button>
      </div>

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
