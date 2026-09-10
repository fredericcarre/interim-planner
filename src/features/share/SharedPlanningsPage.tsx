import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Loading, Modal } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { leaveSharedPlanning, subscribeToSharedPlannings } from '@/services/firestore';
import type { SharedPlanning } from '@/types';
import styles from './SharedViewPage.module.css';

export function SharedPlanningsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SharedPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [openOwnerId, setOpenOwnerId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ ownerId: string; startX: number; offset: number } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SharedPlanning | null>(null);
  const [removing, setRemoving] = useState(false);
  const suppressClick = useRef(false);
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

  const startSwipe = (event: PointerEvent, ownerId: string) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    suppressClick.current = false;
    setDrag({ ownerId, startX: event.clientX, offset: openOwnerId === ownerId ? -84 : 0 });
  };
  const moveSwipe = (event: PointerEvent, ownerId: string) => {
    if (!drag || drag.ownerId !== ownerId) return;
    const origin = openOwnerId === ownerId ? -84 : 0;
    const offset = Math.max(-84, Math.min(0, origin + event.clientX - drag.startX));
    if (Math.abs(offset - origin) > 6) suppressClick.current = true;
    setDrag({ ...drag, offset });
  };
  const endSwipe = (ownerId: string) => {
    if (!drag || drag.ownerId !== ownerId) return;
    setOpenOwnerId(drag.offset < -36 ? ownerId : null);
    setDrag(null);
  };
  const removePlanning = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await leaveSharedPlanning(removeTarget.ownerId);
      setRemoveTarget(null);
      setOpenOwnerId(null);
    } finally {
      setRemoving(false);
    }
  };

  return <div className={styles.page}><Header title="Plannings partagés" showBack /><main className={styles.content}>
    <p className={styles.pageIntro}>Les plannings que vos proches partagent avec vous apparaissent ici.</p>
    {error && <Card className={styles.syncError}><div><p>La synchronisation est momentanément indisponible.</p><small>{error}</small></div><Button variant="secondary" onClick={() => setRetryKey((value) => value + 1)}>Réessayer</Button></Card>}
    {loading ? <Loading /> : error && items.length === 0 ? null : items.length === 0 ? <Card className={styles.emptyCard}>
      <div>👥</div><h2>Aucun planning partagé</h2><p>Scannez le QR code d’un proche pour ajouter son planning.</p>
    </Card> : <div className={styles.planningList}>{items.map((item) => {
      const offset = drag?.ownerId === item.ownerId ? drag.offset : openOwnerId === item.ownerId ? -84 : 0;
      return <div key={item.ownerId} className={styles.swipeRow}>
        <button className={styles.deleteAction} aria-label={`Ne plus suivre le planning de ${item.ownerName}`} onClick={() => setRemoveTarget(item)}>🗑️</button>
        <Card
          className={styles.planningCard}
          style={{ transform: `translateX(${offset}px)` }}
          onPointerDown={(event) => startSwipe(event, item.ownerId)}
          onPointerMove={(event) => moveSwipe(event, item.ownerId)}
          onPointerUp={() => endSwipe(item.ownerId)}
          onPointerCancel={() => endSwipe(item.ownerId)}
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            if (openOwnerId === item.ownerId) { setOpenOwnerId(null); return; }
            navigate(`/shared-plannings/${item.ownerId}`);
          }}
        >
          <div className={styles.avatar}>{item.ownerName.slice(0, 1).toUpperCase()}</div>
          <div><strong>{item.ownerName}</strong><span>Planning en lecture seule</span></div><span className={styles.chevron}>›</span>
        </Card>
      </div>;
    })}</div>}
  </main>
  <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Ne plus suivre ce planning ?">
    <p>Le planning de {removeTarget?.ownerName} disparaîtra de votre liste. Pour le retrouver, vous devrez rescanner son QR code.</p>
    <div className={styles.modalActions}>
      <Button variant="secondary" onClick={() => setRemoveTarget(null)}>Annuler</Button>
      <Button variant="danger" onClick={removePlanning} loading={removing}>Ne plus suivre</Button>
    </div>
  </Modal>
  </div>;
}
