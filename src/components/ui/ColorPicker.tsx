import { useId } from 'react';
import styles from './ColorPicker.module.css';

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
];

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  helperText?: string;
}

export function ColorPicker({ label, value, onChange, helperText }: ColorPickerProps) {
  const id = useId();

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}

      <div className={styles.colors}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`${styles.colorButton} ${value === color ? styles.selected : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Couleur ${color}`}
          />
        ))}

        <label className={styles.customColor}>
          <input
            type="color"
            value={value || '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            className={styles.colorInput}
          />
          <span
            className={`${styles.colorButton} ${styles.customButton} ${value && !PRESET_COLORS.includes(value) ? styles.selected : ''}`}
            style={{ backgroundColor: value || '#e5e7eb' }}
          >
            {!value && (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            )}
          </span>
        </label>
      </div>

      {value && (
        <div className={styles.preview}>
          <span
            className={styles.previewSwatch}
            style={{ backgroundColor: value }}
          />
          <span className={styles.previewValue}>{value}</span>
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onChange('')}
            aria-label="Effacer la couleur"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {helperText && <p className={styles.helperText}>{helperText}</p>}
    </div>
  );
}
