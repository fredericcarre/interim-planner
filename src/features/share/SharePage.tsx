import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Header, Alert, Modal } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { createPlanningInvitation, disablePlanningInvitation, getPlanningInvitation, getPlanningViewers, revokePlanningViewer } from '@/services/firestore';
import type { PlanningInvitation, PlanningViewer } from '@/types';
import styles from './SharePage.module.css';

export function SharePage() {
  const [invitation, setInvitation] = useState<PlanningInvitation | null>(null);
  const [viewers, setViewers] = useState<PlanningViewer[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PlanningViewer | null>(null);
  const invitationUrl = invitation ? `${window.location.origin}/interim-planner/invitation/${invitation.token}` : '';

  const refresh = async () => {
    try {
      const [currentInvitation, currentViewers] = await Promise.all([getPlanningInvitation(), getPlanningViewers()]);
      setInvitation(currentInvitation);
      setViewers(currentViewers.filter((viewer) => viewer.active));
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les partages.');
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!invitationUrl) { setQrCode(''); return; }
    QRCode.toDataURL(invitationUrl, { width: 280, margin: 2, errorCorrectionLevel: 'M' })
      .then(setQrCode).catch(() => setError('Impossible de générer le QR code.'));
  }, [invitationUrl]);

  const createInvitation = async () => {
    setWorking(true); setError(null);
    try { setInvitation(await createPlanningInvitation()); }
    catch (err) { console.error(err); setError('Impossible de créer l’invitation.'); }
    finally { setWorking(false); }
  };

  const copyInvitation = async () => {
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };

  const disableInvitation = async () => {
    if (!invitation) return;
    setWorking(true);
    try { await disablePlanningInvitation(invitation.token); setInvitation(null); }
    catch (err) { console.error(err); setError('Impossible de désactiver l’invitation.'); }
    finally { setWorking(false); }
  };

  const revokeViewer = async () => {
    if (!revokeTarget) return;
    setWorking(true);
    try {
      await revokePlanningViewer(revokeTarget.userId);
      setViewers((items) => items.filter((item) => item.userId !== revokeTarget.userId));
      setRevokeTarget(null);
    } catch (err) { console.error(err); setError('Impossible de révoquer cet accès.'); }
    finally { setWorking(false); }
  };

  return <div className={styles.page}>
    <Header title="Partager mon planning" showBack />
    <main className={styles.content}>
      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
      <Card className={styles.introCard}>
        <h2>Accès en lecture seule</h2>
        <p>La personne verra votre planning à jour dans son propre compte. Elle ne pourra ni le modifier, ni voir vos paramètres.</p>
      </Card>
      <Card className={styles.shareOptions}>
        <h2 className={styles.sectionTitle}>Inviter une personne</h2>
        {loading ? <p className={styles.muted}>Chargement…</p> : invitation ? <div className={styles.invitation}>
          {qrCode && <img className={styles.qrCode} src={qrCode} alt="QR code d’invitation au planning" />}
          <p className={styles.qrHint}>Faites scanner ce QR code par votre proche.</p>
          <div className={styles.linkRow}>
            <input className={styles.linkInput} value={invitationUrl} readOnly aria-label="Lien d’invitation" />
            <Button variant="secondary" onClick={copyInvitation}>{copied ? 'Copié !' : 'Copier'}</Button>
          </div>
          <Button variant="ghost" onClick={disableInvitation} loading={working}>Désactiver ce lien d’invitation</Button>
        </div> : <>
          <p className={styles.muted}>Créez un QR code ou un lien. Le destinataire devra se connecter pour l’accepter.</p>
          <Button fullWidth onClick={createInvitation} loading={working}>Créer une invitation</Button>
        </>}
      </Card>
      <section className={styles.viewerSection}>
        <h2 className={styles.sectionTitle}>Personnes ayant accès</h2>
        {viewers.length === 0 ? <Card><p className={styles.muted}>Personne n’a encore accès à votre planning.</p></Card> : viewers.map((viewer) =>
          <Card key={viewer.userId} className={styles.viewerCard} padding="sm">
            <div><strong>{viewer.displayName}</strong>{viewer.email && <span>{viewer.email}</span>}</div>
            <Button size="sm" variant="danger" onClick={() => setRevokeTarget(viewer)}>Révoquer</Button>
          </Card>)}
      </section>
    </main>
    <Modal isOpen={!!revokeTarget} onClose={() => setRevokeTarget(null)} title="Révoquer l’accès ?">
      <p className={styles.modalText}>{revokeTarget?.displayName} ne pourra plus consulter votre planning.</p>
      <div className={styles.modalActions}>
        <Button variant="secondary" onClick={() => setRevokeTarget(null)}>Annuler</Button>
        <Button variant="danger" onClick={revokeViewer} loading={working}>Révoquer</Button>
      </div>
    </Modal>
  </div>;
}
