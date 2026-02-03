import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header, Loading, Alert, Modal } from '@/components/common';
import { Button, Card, Input } from '@/components/ui';
import {
  exportAllUserData,
  deleteAllUserData,
  getEstablishments,
  getAllWorkEntries,
} from '@/services/firestore';
import { deleteCurrentUser, signOut } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import type { UserExportData } from '@/types';
import styles from './DataPrivacyPage.module.css';

export function DataPrivacyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [establishmentsCount, setEstablishmentsCount] = useState(0);
  const [entriesCount, setEntriesCount] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [establishments, entries] = await Promise.all([
          getEstablishments(),
          getAllWorkEntries(),
        ]);
        setEstablishmentsCount(establishments.length);
        setEntriesCount(entries.length);
      } catch (err) {
        console.error('Failed to load counts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await exportAllUserData();

      const exportData: UserExportData = {
        exportDate: new Date().toISOString(),
        user: {
          uid: user?.uid || '',
          email: user?.email || null,
        },
        settings: data.settings,
        establishments: data.establishments,
        workEntries: data.workEntries,
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interim-planner-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('Export réussi ! Le fichier a été téléchargé.');
    } catch (err) {
      console.error('Export failed:', err);
      setError('Erreur lors de l\'export des données.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      // First delete all data
      await deleteAllUserData();
      // Then delete the user account
      await deleteCurrentUser();
      // Navigate to login
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Account deletion failed:', err);
      const errorCode = (err as { code?: string }).code || '';
      if (errorCode === 'auth/requires-recent-login') {
        setError(
          'Pour des raisons de sécurité, veuillez vous reconnecter avant de supprimer votre compte.'
        );
        setShowDeleteModal(false);
        // Sign out so user can re-authenticate
        await signOut();
        navigate('/login', { replace: true });
      } else {
        setError('Erreur lors de la suppression du compte.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.page}>
      <Header title="Données & Confidentialité" showBack />

      <div className={styles.content}>
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Data summary */}
        <Card className={styles.summaryCard}>
          <h2 className={styles.sectionTitle}>Vos données</h2>
          <p className={styles.sectionDescription}>
            Résumé des données stockées dans votre compte.
          </p>

          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataValue}>{establishmentsCount}</span>
              <span className={styles.dataLabel}>Établissements</span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataValue}>{entriesCount}</span>
              <span className={styles.dataLabel}>Entrées de travail</span>
            </div>
          </div>

          <p className={styles.storageInfo}>
            Vos données sont stockées de manière sécurisée sur les serveurs
            Firebase (Google Cloud) et ne sont accessibles que par vous.
          </p>
        </Card>

        {/* Export data */}
        <Card>
          <h2 className={styles.sectionTitle}>Exporter vos données</h2>
          <p className={styles.sectionDescription}>
            Téléchargez une copie complète de toutes vos données au format JSON.
            Cela inclut vos paramètres, établissements et entrées de travail.
          </p>
          <Button onClick={handleExport} loading={exporting} fullWidth>
            Exporter toutes mes données
          </Button>
        </Card>

        {/* Privacy policy link */}
        <Card>
          <h2 className={styles.sectionTitle}>Politique de confidentialité</h2>
          <p className={styles.sectionDescription}>
            Consultez notre politique de confidentialité pour comprendre comment
            vos données sont collectées, utilisées et protégées.
          </p>
          <Link to="/privacy/policy">
            <Button variant="secondary" fullWidth>
              Voir la politique de confidentialité
            </Button>
          </Link>
        </Card>

        {/* Delete account */}
        <Card className={styles.dangerCard}>
          <h2 className={styles.dangerTitle}>Zone de danger</h2>
          <p className={styles.sectionDescription}>
            La suppression de votre compte est irréversible. Toutes vos données
            seront définitivement supprimées et ne pourront pas être récupérées.
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            fullWidth
          >
            Supprimer mon compte
          </Button>
        </Card>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }}
        title="Supprimer votre compte"
      >
        <div className={styles.deleteModal}>
          <p className={styles.deleteWarning}>
            Cette action est irréversible. Toutes vos données seront
            définitivement supprimées :
          </p>
          <ul className={styles.deleteList}>
            <li>{establishmentsCount} établissements</li>
            <li>{entriesCount} entrées de travail</li>
            <li>Vos paramètres</li>
          </ul>

          <p className={styles.deleteConfirmLabel}>
            Tapez <strong>SUPPRIMER</strong> pour confirmer :
          </p>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="SUPPRIMER"
            autoComplete="off"
          />

          <div className={styles.deleteActions}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={deleteConfirmText !== 'SUPPRIMER'}
            >
              Supprimer définitivement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
