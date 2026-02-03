import styles from './Loading.module.css';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

export function Loading({ fullScreen = false, text = 'Chargement...' }: LoadingProps) {
  const content = (
    <div className={styles.container}>
      <div className={styles.spinner} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className={styles.fullScreen}>{content}</div>;
  }

  return content;
}
