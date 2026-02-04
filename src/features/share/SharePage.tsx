import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Loading, Alert } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { getWorkEntriesForMonth, getUserSettings, getEstablishments } from '@/services/firestore';
import { createShareLink, getShareLink } from '@/services/firestore';
import type { WorkEntry, UserSettings, Establishment } from '@/types';
import { formatMonthDisplay, formatDateDisplay } from '@/utils/dates';
import { calculateGross, calculateNet } from '@/utils/calculations';
import { formatCurrency, formatHours } from '@/utils/format';
import { captureAsImage, downloadImage, shareImage } from '@/utils/share';
import styles from './SharePage.module.css';

export function SharePage() {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);

  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!month) {
        navigate('/');
        return;
      }

      try {
        const [entriesData, settingsData, establishmentsData] = await Promise.all([
          getWorkEntriesForMonth(month),
          getUserSettings(),
          getEstablishments(),
        ]);
        setEntries(entriesData);
        setSettings(settingsData);
        setEstablishments(establishmentsData);

        // Check if there's an existing share link
        const existingLink = await getShareLink(month);
        if (existingLink) {
          setShareUrl(`${window.location.origin}/shared/${existingLink.token}`);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [month, navigate]);

  const getEstablishmentColor = (estId: string) => {
    return establishments.find((e) => e.id === estId)?.color;
  };

  const monthLabel = month ? formatMonthDisplay(month) : '';
  const netCoefficient = settings?.netCoefficient || 0.6993;

  const summary = entries.reduce(
    (acc, entry) => {
      const gross = calculateGross(entry.hours, entry.hourlyRate);
      const net = calculateNet(gross, netCoefficient);
      return {
        totalHours: acc.totalHours + entry.hours,
        totalGross: acc.totalGross + gross,
        totalNet: acc.totalNet + net,
        count: acc.count + 1,
      };
    },
    { totalHours: 0, totalGross: 0, totalNet: 0, count: 0 }
  );

  const handleDownloadImage = async () => {
    if (!previewRef.current) return;
    setSharing(true);
    try {
      const blob = await captureAsImage(previewRef.current);
      const filename = `planning-${month}.png`;

      // Try native share first on mobile
      const shared = await shareImage(blob, `Planning ${monthLabel}`);
      if (!shared) {
        downloadImage(blob, filename);
      }
    } catch (err) {
      console.error('Failed to export image:', err);
      setError('Erreur lors de l\'export.');
    } finally {
      setSharing(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!month) return;
    setSharing(true);
    try {
      const token = await createShareLink(month, entries, summary);
      const url = `${window.location.origin}/shared/${token}`;
      setShareUrl(url);
    } catch (err) {
      console.error('Failed to create share link:', err);
      setError('Erreur lors de la création du lien.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.page}>
      <Header title="Partager le planning" showBack />

      <div className={styles.content}>
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Preview card */}
        <div ref={previewRef} className={styles.preview}>
          <div className={styles.previewHeader}>
            <h2 className={styles.previewTitle}>Planning {monthLabel}</h2>
            <p className={styles.previewSubtitle}>Interim Planner</p>
          </div>

          <div className={styles.previewSummary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Entrées</span>
              <span className={styles.summaryValue}>{summary.count}</span>
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

          {entries.length > 0 ? (
            <div className={styles.previewEntries}>
              {entries.map((entry) => {
                const color = getEstablishmentColor(entry.establishmentId);
                const gross = calculateGross(entry.hours, entry.hourlyRate);
                return (
                  <div key={entry.id} className={styles.previewEntry}>
                    {color && (
                      <span
                        className={styles.entryColor}
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span className={styles.entryDate}>{formatDateDisplay(entry.date)}</span>
                    <span className={styles.entryName}>{entry.establishmentNameSnapshot}</span>
                    <span className={styles.entryHours}>{formatHours(entry.hours)}</span>
                    <span className={styles.entryGross}>{formatCurrency(gross)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyState}>Aucune entrée pour ce mois.</p>
          )}
        </div>

        {/* Share options */}
        <Card className={styles.shareOptions}>
          <h3 className={styles.sectionTitle}>Options de partage</h3>

          <Button
            onClick={handleDownloadImage}
            loading={sharing}
            fullWidth
            className={styles.shareButton}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Exporter en image
          </Button>

          <div className={styles.divider} />

          {shareUrl ? (
            <div className={styles.linkSection}>
              <p className={styles.linkLabel}>Lien de partage :</p>
              <div className={styles.linkRow}>
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className={styles.linkInput}
                />
                <Button onClick={handleCopyLink} variant="secondary">
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
              </div>
              <p className={styles.linkHint}>
                Ce lien permet de voir le planning en lecture seule.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleCreateShareLink}
              variant="secondary"
              fullWidth
              loading={sharing}
              className={styles.shareButton}
              disabled={entries.length === 0}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Créer un lien de partage
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
