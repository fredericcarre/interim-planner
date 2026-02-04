import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Loading } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { getWorkEntriesForMonth, getUserSettings, getEstablishments } from '@/services/firestore';
import { signOut } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { WorkEntry, UserSettings, MonthlySummary } from '@/types';
import {
  getCurrentMonth,
  formatMonthDisplay,
  getPreviousMonth,
  getNextMonth,
  formatDateDisplay,
} from '@/utils/dates';
import { calculateGross, calculateNet } from '@/utils/calculations';
import { formatCurrency, formatHours } from '@/utils/format';
import styles from './MonthView.module.css';

export function MonthView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [establishmentColors, setEstablishmentColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesData, settingsData, establishmentsData] = await Promise.all([
        getWorkEntriesForMonth(currentMonth),
        getUserSettings(),
        getEstablishments(),
      ]);
      setEntries(entriesData);
      setSettings(settingsData);

      // Create a map of establishment colors
      const colorMap: Record<string, string> = {};
      establishmentsData.forEach((est) => {
        if (est.color) {
          colorMap[est.id] = est.color;
        }
      });
      setEstablishmentColors(colorMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuButton = (
    <button
      type="button"
      className={styles.menuButton}
      onClick={() => setMenuOpen(!menuOpen)}
      aria-label="Menu"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );

  return (
    <div className={styles.page}>
      <Header title="Interim Planner" rightAction={menuButton} />

      {menuOpen && (
        <>
          <div
            className={styles.menuOverlay}
            onClick={() => setMenuOpen(false)}
          />
          <div className={styles.menu}>
            <button onClick={() => { navigate('/establishments'); setMenuOpen(false); }}>
              Établissements
            </button>
            <button onClick={() => { navigate('/settings'); setMenuOpen(false); }}>
              Paramètres
            </button>
            <button onClick={() => { navigate('/privacy'); setMenuOpen(false); }}>
              Données & Confidentialité
            </button>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Déconnexion
            </button>
          </div>
        </>
      )}

      <div className={styles.content}>
        {/* Month selector */}
        <div className={styles.monthSelector}>
          <button
            type="button"
            className={styles.monthNav}
            onClick={() => setCurrentMonth(getPreviousMonth(currentMonth))}
            aria-label="Mois précédent"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 15l-5-5 5-5" />
            </svg>
          </button>
          <span className={styles.monthLabel}>
            {formatMonthDisplay(currentMonth)}
          </span>
          <button
            type="button"
            className={styles.monthNav}
            onClick={() => setCurrentMonth(getNextMonth(currentMonth))}
            aria-label="Mois suivant"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 5l5 5-5 5" />
            </svg>
          </button>
        </div>

        {/* Summary card */}
        <Card className={styles.summaryCard}>
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
        </Card>

        {/* Action buttons */}
        <div className={styles.actions}>
          <Button onClick={() => navigate('/entries/new')} fullWidth>
            + Ajouter une entrée
          </Button>
          <div className={styles.secondaryActions}>
            <Button
              variant="secondary"
              onClick={() => navigate(`/export/${currentMonth}`)}
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/compare/${currentMonth}`)}
            >
              Comparer fiche de paie
            </Button>
          </div>
        </div>

        {/* Entries list */}
        {loading ? (
          <Loading text="Chargement des entrées..." />
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune entrée pour ce mois.</p>
            <p className={styles.emptyHint}>
              Appuyez sur "Ajouter une entrée" pour commencer.
            </p>
          </div>
        ) : (
          <div className={styles.entriesList}>
            {entries.map((entry) => {
              const gross = calculateGross(entry.hours, entry.hourlyRate);
              const net = calculateNet(gross, settings?.netCoefficient || 0.6993);
              return (
                <Card
                  key={entry.id}
                  className={styles.entryCard}
                  padding="sm"
                  onClick={() => navigate(`/entries/${entry.id}`)}
                >
                  {establishmentColors[entry.establishmentId] && (
                    <div
                      className={styles.entryColorBar}
                      style={{ backgroundColor: establishmentColors[entry.establishmentId] }}
                    />
                  )}
                  <div className={styles.entryHeader}>
                    <span className={styles.entryDate}>
                      {formatDateDisplay(entry.date)}
                    </span>
                    <span className={styles.entryEstablishment}>
                      {entry.establishmentNameSnapshot}
                    </span>
                  </div>
                  <div className={styles.entryDetails}>
                    <span>{formatHours(entry.hours)}</span>
                    <span className={styles.entryGross}>{formatCurrency(gross)}</span>
                    <span className={styles.entryNet}>{formatCurrency(net)}</span>
                  </div>
                  {entry.note && (
                    <p className={styles.entryNote}>{entry.note}</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* User email indicator */}
      <div className={styles.userInfo}>
        {user?.email}
      </div>
    </div>
  );
}
