import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Loading, Modal } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { getWorkEntriesForMonth, getUserSettings, getEstablishments, deleteWorkEntry } from '@/services/firestore';
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
import { downloadICS } from '@/utils/calendar';
import styles from './MonthView.module.css';

const MONTH_STORAGE_KEY = 'interim-planner-selected-month';

function getSavedMonth(): string {
  return sessionStorage.getItem(MONTH_STORAGE_KEY) || getCurrentMonth();
}

export function MonthView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonthRaw] = useState(getSavedMonth);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [establishmentColors, setEstablishmentColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [swipedEntryId, setSwipedEntryId] = useState<string | null>(null);

  // Swipe tracking refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const swipeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setCurrentMonth = useCallback((month: string) => {
    sessionStorage.setItem(MONTH_STORAGE_KEY, month);
    setCurrentMonthRaw(month);
  }, []);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWorkEntry(deleteTarget.id);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setSwipedEntryId(null);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Swipe handlers
  const SWIPE_THRESHOLD = 70;

  const handleTouchStart = (entryId: string, e: React.TouchEvent) => {
    // Close any other swiped entry
    if (swipedEntryId && swipedEntryId !== entryId) {
      const prevEl = swipeRefs.current[swipedEntryId];
      if (prevEl) prevEl.style.transform = '';
      setSwipedEntryId(null);
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (entryId: string, e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // If vertical scroll is dominant, don't swipe
    if (Math.abs(dy) > Math.abs(dx)) return;

    touchCurrentX.current = e.touches[0].clientX;
    const el = swipeRefs.current[entryId];
    if (!el) return;

    const isAlreadySwiped = swipedEntryId === entryId;
    const offset = isAlreadySwiped ? dx - SWIPE_THRESHOLD : dx;

    // Only allow left swipe, cap at threshold
    if (offset < -SWIPE_THRESHOLD) {
      el.style.transform = `translateX(-${SWIPE_THRESHOLD}px)`;
    } else if (offset < 0) {
      el.style.transform = `translateX(${offset}px)`;
    } else if (!isAlreadySwiped) {
      el.style.transform = '';
    }
  };

  const handleTouchEnd = (entryId: string) => {
    const dx = touchCurrentX.current - touchStartX.current;
    const el = swipeRefs.current[entryId];
    if (!el) return;

    const isAlreadySwiped = swipedEntryId === entryId;
    const effectiveDx = isAlreadySwiped ? dx - SWIPE_THRESHOLD : dx;

    if (effectiveDx < -SWIPE_THRESHOLD / 2) {
      el.style.transform = `translateX(-${SWIPE_THRESHOLD}px)`;
      setSwipedEntryId(entryId);
    } else {
      el.style.transform = '';
      if (isAlreadySwiped) setSwipedEntryId(null);
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
            <button onClick={() => { navigate('/shared-plannings'); setMenuOpen(false); }}>
              Plannings partagés
            </button>
            <button onClick={() => { navigate('/sharing'); setMenuOpen(false); }}>
              Gérer mes partages
            </button>
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
              onClick={() => navigate('/sharing')}
            >
              Partager
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadICS(entries, currentMonth)}
              disabled={entries.length === 0}
            >
              Calendrier
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
                <div key={entry.id} className={styles.swipeContainer}>
                  <div className={styles.swipeAction}>
                    <button
                      type="button"
                      className={styles.swipeDeleteButton}
                      onClick={() => setDeleteTarget(entry)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div
                    className={styles.swipeContent}
                    ref={(el) => { swipeRefs.current[entry.id] = el; }}
                    onTouchStart={(e) => handleTouchStart(entry.id, e)}
                    onTouchMove={(e) => handleTouchMove(entry.id, e)}
                    onTouchEnd={() => handleTouchEnd(entry.id)}
                  >
                    <Card
                      className={styles.entryCard}
                      padding="sm"
                      onClick={() => {
                        if (swipedEntryId === entry.id) {
                          const el = swipeRefs.current[entry.id];
                          if (el) el.style.transform = '';
                          setSwipedEntryId(null);
                        } else {
                          navigate(`/entries/${entry.id}`);
                        }
                      }}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User email indicator */}
      <div className={styles.userInfo}>
        {user?.email}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'entrée"
      >
        {deleteTarget && (
          <p className={styles.modalText}>
            Supprimer l'entrée du {formatDateDisplay(deleteTarget.date)} ({deleteTarget.establishmentNameSnapshot}) ?
          </p>
        )}
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
