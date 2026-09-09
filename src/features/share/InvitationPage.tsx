import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Alert, Loading } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { acceptPlanningInvitation, getPlanningInvitationByToken } from '@/services/firestore';
import type { PlanningInvitation } from '@/types';
import styles from './SharePage.module.css';

export function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<PlanningInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getPlanningInvitationByToken(token).then((result) => setInvitation(result?.active ? result : null))
      .catch(() => setError('Impossible de vérifier cette invitation.')).finally(() => setLoading(false));
  }, [token]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    try {
      const planning = await acceptPlanningInvitation(token);
      navigate(`/shared-plannings/${planning.ownerId}`, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error && err.message === 'OWN_INVITATION' ? 'Vous ne pouvez pas ajouter votre propre planning.' : 'Cette invitation n’est plus valide.');
    } finally { setAccepting(false); }
  };

  if (loading) return <Loading fullScreen />;
  return <div className={styles.page}>
    <Header title="Invitation" showBack />
    <main className={styles.centeredContent}>
      {error && <Alert type="error">{error}</Alert>}
      <Card className={styles.acceptCard}>{invitation ? <>
        <div className={styles.peopleIcon}>👥</div>
        <h2>{invitation.ownerName} partage son planning</h2>
        <p>En acceptant, son planning apparaîtra dans votre espace et restera synchronisé automatiquement.</p>
        <Button fullWidth onClick={accept} loading={accepting}>Ajouter ce planning</Button>
      </> : <><h2>Invitation indisponible</h2><p>Ce lien a été désactivé ou n’existe plus.</p></>}</Card>
    </main>
  </div>;
}
