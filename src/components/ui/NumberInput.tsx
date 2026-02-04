import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react';
import styles from './Input.module.css';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  decimals?: number;
}

/**
 * NumberInput component that accepts both comma and dot as decimal separators.
 * Displays with French format (comma) but stores with dot for calculations.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, helperText, value, onChange, decimals = 2, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    // Display value with comma for French users
    const [displayValue, setDisplayValue] = useState(() => {
      return value ? value.replace('.', ',') : '';
    });

    // Sync display value when external value changes
    useEffect(() => {
      const newDisplay = value ? value.replace('.', ',') : '';
      if (newDisplay !== displayValue.replace(',', '.').replace('.', ',')) {
        setDisplayValue(newDisplay);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;

      // Allow empty input
      if (input === '') {
        setDisplayValue('');
        onChange('');
        return;
      }

      // Replace comma with dot for internal value
      // Allow only digits, one decimal separator, and minus sign at start
      const normalized = input
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '')
        .replace(/(\..*)\./g, '$1') // Only one decimal point
        .replace(/(.)-/g, '$1'); // Minus only at start

      // Limit decimals
      const parts = normalized.split('.');
      if (parts[1] && parts[1].length > decimals) {
        parts[1] = parts[1].slice(0, decimals);
      }
      const finalValue = parts.join('.');

      // Update display with comma
      setDisplayValue(finalValue.replace('.', ','));
      onChange(finalValue);
    };

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="decimal"
          className={`${styles.input} ${error ? styles.error : ''} ${className}`}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
        {error && <span className={styles.errorText}>{error}</span>}
        {helperText && !error && (
          <span className={styles.helperText}>{helperText}</span>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
