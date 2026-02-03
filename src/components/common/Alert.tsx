import { ReactNode } from 'react';
import styles from './Alert.module.css';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  children: ReactNode;
  onClose?: () => void;
}

export function Alert({ type = 'info', children, onClose }: AlertProps) {
  return (
    <div className={`${styles.alert} ${styles[type]}`} role="alert">
      <div className={styles.content}>{children}</div>
      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}
