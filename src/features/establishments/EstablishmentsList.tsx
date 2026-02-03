import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Loading, Alert } from '@/components/common';
import { Button, Card } from '@/components/ui';
import { getEstablishments, deleteEstablishment } from '@/services/firestore';
import type { Establishment } from '@/types';
import { formatCurrency, formatHours } from '@/utils/format';
import { Modal } from '@/components/common';
import styles from './EstablishmentsList.module.css';

export function EstablishmentsList() {
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadEstablishments = async () => {
    try {
      const data = await getEstablishments();
      setEstablishments(data);
    } catch (err) {
      console.error('Failed to load establishments:', err);
      setError('Erreur lors du chargement des établissements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstablishments();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteEstablishment(deleteId);
      setEstablishments((prev) => prev.filter((e) => e.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete establishment:', err);
      setError('Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  const establishmentToDelete = establishments.find((e) => e.id === deleteId);

  return (
    <div className={styles.page}>
      <Header title="Établissements" showBack />

      <div className={styles.content}>
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          onClick={() => navigate('/establishments/new')}
          fullWidth
          className={styles.addButton}
        >
          + Ajouter un établissement
        </Button>

        {loading ? (
          <Loading text="Chargement..." />
        ) : establishments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun établissement enregistré.</p>
            <p className={styles.emptyHint}>
              Créez des établissements pour faciliter la saisie des entrées.
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {establishments.map((est) => (
              <Card
                key={est.id}
                className={styles.card}
                padding="sm"
                onClick={() => navigate(`/establishments/${est.id}`)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.name}>{est.name}</span>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(est.id);
                    }}
                    aria-label="Supprimer"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M3 5h12M7 5V3a1 1 0 011-1h2a1 1 0 011 1v2M14 5v10a1 1 0 01-1 1H5a1 1 0 01-1-1V5" />
                    </svg>
                  </button>
                </div>
                <div className={styles.details}>
                  <span>Taux: {formatCurrency(est.defaultHourlyRate)}/h</span>
                  {est.defaultHours && (
                    <span>Heures: {formatHours(est.defaultHours)}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Supprimer l'établissement"
      >
        <p className={styles.modalText}>
          Êtes-vous sûr de vouloir supprimer{' '}
          <strong>{establishmentToDelete?.name}</strong> ?
        </p>
        <p className={styles.modalWarning}>
          Les entrées existantes conserveront le nom de l'établissement mais ne
          seront plus liées.
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
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
