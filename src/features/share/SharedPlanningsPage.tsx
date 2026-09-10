import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Loading } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { subscribeToSharedPlannings } from '@/services/firestore';
import type { SharedPlanning } from '@/types';
import styles from './SharedViewPage.module.css';

export function SharedPlanningsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SharedPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    setLoading(items.length === 0);
    setError(null);
    return subscribeToSharedPlannings((data, state) => {
      // An empty cache is not proof that the server-side list is empty.
      if (state.fromCache && data.length === 0) return;
      setItems(data);
      setLoading(false);
      setError(null);
    }, (cause) => {
      // Keep the last successful result: a connection error is not an empty list.
      setError(cause.message);
      setLoading(false);
    });
  // The existing items are intentionally retained while reconnecting.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);
  return <div className={styles.page}><Header title="Plannings partagés" showBack /><main className={styles.content}>
    <p className={styles.pageIntro}>Les plannings que vos proches partagent avec vous apparaissent ici.</p>
    {error && <Card className={styles.syncError}><div><p>La synchronisation est momentanément indisponible.</p><small>{error}</small></div><Button variant="secondary" onClick={() => setRetryKey((value) => value + 1)}>Réessayer</Button></Card>}
    {loading ? <Loading /> : error && items.length === 0 ? null : items.length === 0 ? <Card className={styles.emptyCard}>
      <div>👥</div><h2>Aucun planning partagé</h2><p>Scannez le QR code d’un proche pour ajouter son planning.</p>
    </Card> : <div className={styles.planningList}>{items.map((item) =>
      <Card key={item.ownerId} className={styles.planningCard} onClick={() => navigate(`/shared-plannings/${item.ownerId}`)}>
        <div className={styles.avatar}>{item.ownerName.slice(0, 1).toUpperCase()}</div>
        <div><strong>{item.ownerName}</strong><span>Planning en lecture seule</span></div><span className={styles.chevron}>›</span>
      </Card>)}</div>}
  </main></div>;
}
