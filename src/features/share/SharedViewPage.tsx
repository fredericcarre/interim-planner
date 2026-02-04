import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loading } from '@/components/common';
import { Card } from '@/components/ui';
import { getSharedPlanning, ShareLink } from '@/services/firestore';
import { formatMonthDisplay, formatDateDisplay } from '@/utils/dates';
import { calculateGross } from '@/utils/calculations';
import { formatCurrency, formatHours } from '@/utils/format';
import styles from './SharedViewPage.module.css';

export function SharedViewPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const shared = await getSharedPlanning(token);
        if (shared) {
          setData(shared);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load shared planning:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  if (loading) {
    return <Loading fullScreen />;
  }

  if (notFound || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <Card className={styles.errorCard}>
            <h2>Lien non trouvé</h2>
            <p>Ce lien de partage n'existe pas ou a expiré.</p>
          </Card>
        </div>
      </div>
    );
  }

  const monthLabel = formatMonthDisplay(data.month);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Interim Planner</h1>
      </header>

      <div className={styles.content}>
        <Card className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.monthTitle}>Planning {monthLabel}</h2>
            <p className={styles.subtitle}>Vue partagée en lecture seule</p>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Entrées</span>
              <span className={styles.summaryValue}>{data.summary.count}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Heures</span>
              <span className={styles.summaryValue}>{formatHours(data.summary.totalHours)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Brut</span>
              <span className={styles.summaryValue}>{formatCurrency(data.summary.totalGross)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Net estimé</span>
              <span className={`${styles.summaryValue} ${styles.netValue}`}>
                {formatCurrency(data.summary.totalNet)}
              </span>
            </div>
          </div>

          {data.entries.length > 0 ? (
            <div className={styles.entries}>
              {data.entries.map((entry, index) => {
                const gross = calculateGross(entry.hours, entry.hourlyRate);
                return (
                  <div key={index} className={styles.entry}>
                    <span className={styles.entryDate}>{formatDateDisplay(entry.date)}</span>
                    <span className={styles.entryName}>{entry.establishmentName}</span>
                    <span className={styles.entryHours}>{formatHours(entry.hours)}</span>
                    <span className={styles.entryGross}>{formatCurrency(gross)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyState}>Aucune entrée pour ce mois.</p>
          )}
        </Card>

        <p className={styles.footer}>
          Créé avec Interim Planner
        </p>
      </div>
    </div>
  );
}
