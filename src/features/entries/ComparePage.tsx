import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Loading, Alert } from '@/components/common';
import { Button, Input, Card } from '@/components/ui';
import { getWorkEntriesForMonth, getUserSettings } from '@/services/firestore';
import type { WorkEntry, UserSettings, MonthlySummary } from '@/types';
import { formatMonthDisplay } from '@/utils/dates';
import { calculateGross, calculateNet } from '@/utils/calculations';
import { formatCurrency, formatHours, formatNumber } from '@/utils/format';
import styles from './ComparePage.module.css';

export function ComparePage() {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payslip values
  const [actualGross, setActualGross] = useState('');
  const [actualNet, setActualNet] = useState('');
  const [actualHours, setActualHours] = useState('');

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

  const actualGrossNum = parseFloat(actualGross) || 0;
  const actualNetNum = parseFloat(actualNet) || 0;
  const actualHoursNum = parseFloat(actualHours) || 0;

  const grossDiff = actualGrossNum - summary.totalGross;
  const netDiff = actualNetNum - summary.totalNet;
  const hoursDiff = actualHoursNum - summary.totalHours;

  // Calculate implied coefficient from actual values
  const impliedCoefficient = actualGrossNum > 0 ? actualNetNum / actualGrossNum : 0;

  const formatDiff = (diff: number, isCurrency = true) => {
    const sign = diff >= 0 ? '+' : '';
    const value = isCurrency ? formatCurrency(Math.abs(diff)) : formatHours(Math.abs(diff));
    return `${sign}${diff >= 0 ? '' : '-'}${value}`;
  };

  const getDiffClass = (diff: number, inverseColors = false) => {
    if (diff === 0) return '';
    if (inverseColors) {
      return diff > 0 ? styles.negative : styles.positive;
    }
    return diff > 0 ? styles.positive : styles.negative;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.page}>
      <Header title="Comparer avec fiche de paie" showBack />

      <div className={styles.content}>
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card className={styles.monthCard}>
          <h2 className={styles.monthTitle}>
            {month && formatMonthDisplay(month)}
          </h2>
        </Card>

        <Card className={styles.inputCard}>
          <h3 className={styles.sectionTitle}>Valeurs de la fiche de paie</h3>

          <div className={styles.inputGrid}>
            <Input
              type="number"
              label="Heures réelles"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              placeholder="0"
              step="0.25"
              min="0"
            />

            <Input
              type="number"
              label="Brut réel (€)"
              value={actualGross}
              onChange={(e) => setActualGross(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />

            <Input
              type="number"
              label="Net réel (€)"
              value={actualNet}
              onChange={(e) => setActualNet(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </Card>

        <Card className={styles.comparisonCard}>
          <h3 className={styles.sectionTitle}>Comparaison</h3>

          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Estimé</th>
                <th>Réel</th>
                <th>Écart</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Heures</td>
                <td>{formatHours(summary.totalHours)}</td>
                <td>{actualHoursNum > 0 ? formatHours(actualHoursNum) : '—'}</td>
                <td className={getDiffClass(hoursDiff)}>
                  {actualHoursNum > 0 ? formatDiff(hoursDiff, false) : '—'}
                </td>
              </tr>
              <tr>
                <td>Brut</td>
                <td>{formatCurrency(summary.totalGross)}</td>
                <td>{actualGrossNum > 0 ? formatCurrency(actualGrossNum) : '—'}</td>
                <td className={getDiffClass(grossDiff)}>
                  {actualGrossNum > 0 ? formatDiff(grossDiff) : '—'}
                </td>
              </tr>
              <tr>
                <td>Net</td>
                <td>{formatCurrency(summary.totalNet)}</td>
                <td>{actualNetNum > 0 ? formatCurrency(actualNetNum) : '—'}</td>
                <td className={getDiffClass(netDiff)}>
                  {actualNetNum > 0 ? formatDiff(netDiff) : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {impliedCoefficient > 0 && (
            <div className={styles.coefficientInfo}>
              <p>
                <strong>Coefficient réel :</strong> {formatNumber(impliedCoefficient, 4)}
                {' '}({formatNumber(impliedCoefficient * 100, 2)}%)
              </p>
              <p className={styles.coeffHint}>
                Basé sur les valeurs brut/net réelles de votre fiche de paie.
                Vous pouvez mettre à jour votre coefficient dans les paramètres.
              </p>
            </div>
          )}
        </Card>

        {impliedCoefficient > 0 && settings && (
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/settings')}
          >
            Mettre à jour le coefficient
          </Button>
        )}
      </div>
    </div>
  );
}
