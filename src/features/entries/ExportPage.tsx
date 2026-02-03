import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Loading, Alert } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { getWorkEntriesForMonth, getUserSettings } from '@/services/firestore';
import type { WorkEntry, UserSettings, MonthlySummary } from '@/types';
import { formatMonthDisplay } from '@/utils/dates';
import { calculateGross, calculateNet, coefficientToPercent } from '@/utils/calculations';
import { formatCurrency, formatHours } from '@/utils/format';
import { generateMonthlyPDF } from '@/utils/pdf';
import styles from './ExportPage.module.css';

export function ExportPage() {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!month) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        const [entriesData, settingsData] = await Promise.all([
          getWorkEntriesForMonth(month),
          getUserSettings(),
        ]);
        setEntries(entriesData);
        setSettings(settingsData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [month, navigate]);

  const summary: MonthlySummary = entries.reduce(
    (acc, entry) => {
      const gross = calculateGross(entry.hours, entry.hourlyRate);
      const net = calculateNet(gross, settings?.netCoefficient || 0.6993);
      return {
        totalHours: acc.totalHours + entry.hours,
        totalGross: acc.totalGross + gross,
        totalNet: acc.totalNet + net,
        entriesCount: acc.entriesCount + 1,
      };
    },
    { totalHours: 0, totalGross: 0, totalNet: 0, entriesCount: 0 }
  );

  const handleExport = () => {
    if (!settings || !month) return;
    setGenerating(true);
    try {
      generateMonthlyPDF({ entries, settings, month });
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Erreur lors de la génération du PDF.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.page}>
      <Header title="Export PDF" showBack />

      <div className={styles.content}>
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card className={styles.previewCard}>
          <h2 className={styles.monthTitle}>
            {month && formatMonthDisplay(month)}
          </h2>

          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Entrées</span>
              <span className={styles.summaryValue}>{summary.entriesCount}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Heures</span>
              <span className={styles.summaryValue}>{formatHours(summary.totalHours)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Brut</span>
              <span className={styles.summaryValue}>{formatCurrency(summary.totalGross)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Net estimé</span>
              <span className={`${styles.summaryValue} ${styles.netValue}`}>
                {formatCurrency(summary.totalNet)}
              </span>
            </div>
          </div>

          {settings && (
            <p className={styles.coeffInfo}>
              Coefficient: {coefficientToPercent(settings.netCoefficient)}
            </p>
          )}
        </Card>

        {entries.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune entrée pour ce mois.</p>
            <p className={styles.emptyHint}>
              Ajoutez des entrées pour pouvoir générer un PDF.
            </p>
          </div>
        ) : (
          <>
            <Button
              onClick={handleExport}
              fullWidth
              loading={generating}
              className={styles.exportButton}
            >
              Générer et ouvrir le PDF
            </Button>

            <p className={styles.hint}>
              Le PDF s'ouvrira dans un nouvel onglet. Vous pourrez ensuite
              l'imprimer ou le partager via le menu de partage iOS.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
