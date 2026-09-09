import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Loading } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { getSharedPlanningByOwner, leaveSharedPlanning, subscribeToSharedWorkEntries } from '@/services/firestore';
import type { SharedPlanning, WorkEntry } from '@/types';
import { formatDateDisplay, formatMonthDisplay, getCurrentMonth, getNextMonth, getPreviousMonth } from '@/utils/dates';
import { formatHours } from '@/utils/format';
import styles from './SharedViewPage.module.css';

export function SharedViewPage() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const navigate = useNavigate();
  const [planning, setPlanning] = useState<SharedPlanning | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [planningLoading, setPlanningLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [revoked, setRevoked] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!ownerId) { setPlanningLoading(false); return; }
    setPlanningLoading(true);
    getSharedPlanningByOwner(ownerId).then(setPlanning).catch(() => setPlanning(null)).finally(() => setPlanningLoading(false));
  }, [ownerId, retryKey]);
  useEffect(() => {
    if (!ownerId) { setEntriesLoading(false); return; }
    // Start the live query immediately instead of waiting for the metadata
    // request. This removes an entire network round trip on mobile/PWA.
    setEntriesLoading(true); setRevoked(false);
    return subscribeToSharedWorkEntries(ownerId, month, (data) => { setEntries(data); setEntriesLoading(false); }, () => { setRevoked(true); setEntriesLoading(false); });
  }, [ownerId, month, retryKey]);

  const totalHours = useMemo(() => entries.reduce((total, entry) => total + entry.hours, 0), [entries]);
  const leave = async () => {
    if (!ownerId) return;
    await leaveSharedPlanning(ownerId);
    navigate('/shared-plannings', { replace: true });
  };

  if (!planning && planningLoading) return <Loading fullScreen text="Ouverture du planning…" />;
  return <div className={styles.page}>
    <Header title={planning?.ownerName || 'Planning partagé'} showBack />
    <main className={styles.content}>
      {!planning || revoked ? <Card className={styles.errorCard}>
        <h2>Accès interrompu</h2><p>Le propriétaire a peut-être révoqué votre accès, ou la connexion a été interrompue.</p>
        <Button onClick={() => setRetryKey((value) => value + 1)}>Réessayer</Button>
        {planning && <Button variant="secondary" onClick={leave}>Retirer de ma liste</Button>}
      </Card> : <>
        <div className={styles.liveBadge}><span /> Synchronisé en direct</div>
        <div className={styles.monthSelector}>
          <button onClick={() => setMonth(getPreviousMonth(month))} aria-label="Mois précédent">‹</button>
          <strong>{formatMonthDisplay(month)}</strong>
          <button onClick={() => setMonth(getNextMonth(month))} aria-label="Mois suivant">›</button>
        </div>
        <Card className={styles.summaryCard}><span>{entries.length} journée{entries.length > 1 ? 's' : ''}</span><strong>{formatHours(totalHours)}</strong></Card>
        {entriesLoading ? <Loading text="Synchronisation…" /> : entries.length === 0 ? <Card><p className={styles.emptyState}>Aucune entrée pour ce mois.</p></Card> :
          <div className={styles.entries}>{entries.map((entry) => <Card key={entry.id} padding="sm" className={styles.entry}>
            <div><strong>{formatDateDisplay(entry.date)}</strong><span>{entry.establishmentNameSnapshot}</span></div>
            <strong>{formatHours(entry.hours)}</strong>{entry.note && <p>{entry.note}</p>}
          </Card>)}</div>}
        <Button variant="ghost" fullWidth onClick={leave}>Ne plus suivre ce planning</Button>
      </>}
    </main>
  </div>;
}
