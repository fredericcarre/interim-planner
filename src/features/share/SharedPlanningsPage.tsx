import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Loading } from '@/components/common';
import { Card } from '@/components/ui';
import { getSharedPlannings } from '@/services/firestore';
import type { SharedPlanning } from '@/types';
import styles from './SharedViewPage.module.css';

export function SharedPlanningsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SharedPlanning[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getSharedPlannings().then(setItems).finally(() => setLoading(false)); }, []);
  return <div className={styles.page}><Header title="Plannings partagés" showBack /><main className={styles.content}>
    <p className={styles.pageIntro}>Les plannings que vos proches partagent avec vous apparaissent ici.</p>
    {loading ? <Loading /> : items.length === 0 ? <Card className={styles.emptyCard}>
      <div>👥</div><h2>Aucun planning partagé</h2><p>Scannez le QR code d’un proche pour ajouter son planning.</p>
    </Card> : <div className={styles.planningList}>{items.map((item) =>
      <Card key={item.ownerId} className={styles.planningCard} onClick={() => navigate(`/shared-plannings/${item.ownerId}`)}>
        <div className={styles.avatar}>{item.ownerName.slice(0, 1).toUpperCase()}</div>
        <div><strong>{item.ownerName}</strong><span>Planning en lecture seule</span></div><span className={styles.chevron}>›</span>
      </Card>)}</div>}
  </main></div>;
}
