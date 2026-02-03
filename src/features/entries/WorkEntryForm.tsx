import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Loading, Alert, Modal } from '@/components/common';
import { Button, Input, Card } from '@/components/ui';
import {
  getWorkEntry,
  createWorkEntry,
  updateWorkEntry,
  deleteWorkEntry,
  getEstablishments,
  createEstablishment,
} from '@/services/firestore';
import type { Establishment, WorkEntryFormData } from '@/types';
import { getToday, addDays } from '@/utils/dates';
import { calculateGross, calculateNet, DEFAULT_NET_COEFFICIENT } from '@/utils/calculations';
import { formatCurrency } from '@/utils/format';
import { getUserSettings } from '@/services/firestore';
import styles from './WorkEntryForm.module.css';

export function WorkEntryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [netCoefficient, setNetCoefficient] = useState(DEFAULT_NET_COEFFICIENT);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewEstablishment, setShowNewEstablishment] = useState(false);
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newEstablishmentRate, setNewEstablishmentRate] = useState('');
  const [newEstablishmentHours, setNewEstablishmentHours] = useState('');

  // Form fields
  const [date, setDate] = useState(getToday());
  const [establishmentId, setEstablishmentId] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [establishmentsData, settingsData] = await Promise.all([
          getEstablishments(),
          getUserSettings(),
        ]);
        setEstablishments(establishmentsData);
        setNetCoefficient(settingsData.netCoefficient);

        if (isEditing && id) {
          const entry = await getWorkEntry(id);
          if (entry) {
            setDate(entry.date);
            setEstablishmentId(entry.establishmentId);
            setHours(String(entry.hours));
            setHourlyRate(String(entry.hourlyRate));
            setNote(entry.note || '');
          } else {
            navigate('/');
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Erreur lors du chargement des données.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditing, navigate]);

  // When establishment changes, prefill rate and hours
  const handleEstablishmentChange = (estId: string) => {
    setEstablishmentId(estId);
    const establishment = establishments.find((e) => e.id === estId);
    if (establishment) {
      setHourlyRate(String(establishment.defaultHourlyRate));
      if (establishment.defaultHours) {
        setHours(String(establishment.defaultHours));
      }
    }
  };

  const selectedEstablishment = establishments.find((e) => e.id === establishmentId);

  const gross = calculateGross(
    parseFloat(hours) || 0,
    parseFloat(hourlyRate) || 0
  );
  const net = calculateNet(gross, netCoefficient);

  const handleSubmit = async (e: FormEvent, duplicate = false) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formData: WorkEntryFormData = {
        date,
        establishmentId,
        hours: parseFloat(hours),
        hourlyRate: parseFloat(hourlyRate),
        note: note.trim() || undefined,
      };

      const establishmentName = selectedEstablishment?.name || '';

      if (isEditing && id) {
        await updateWorkEntry(id, formData, establishmentName);
      } else {
        await createWorkEntry(formData, establishmentName);
      }

      if (duplicate) {
        // Stay on form, increment date, keep same establishment/hours/rate
        setDate(addDays(date, 1));
        setNote('');
        setSaving(false);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to save entry:', err);
      setError('Erreur lors de la sauvegarde.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await deleteWorkEntry(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setError('Erreur lors de la suppression.');
      setSaving(false);
    }
  };

  const handleCreateEstablishment = async () => {
    if (!newEstablishmentName.trim() || !newEstablishmentRate) return;

    try {
      const newId = await createEstablishment({
        name: newEstablishmentName.trim(),
        defaultHourlyRate: parseFloat(newEstablishmentRate),
        defaultHours: newEstablishmentHours ? parseFloat(newEstablishmentHours) : undefined,
      });

      // Refresh establishments list
      const updated = await getEstablishments();
      setEstablishments(updated);
      setEstablishmentId(newId);
      setHourlyRate(newEstablishmentRate);
      if (newEstablishmentHours) {
        setHours(newEstablishmentHours);
      }

      setShowNewEstablishment(false);
      setNewEstablishmentName('');
      setNewEstablishmentRate('');
      setNewEstablishmentHours('');
    } catch (err) {
      console.error('Failed to create establishment:', err);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.page}>
      <Header
        title={isEditing ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
        showBack
      />

      <div className={styles.content}>
        <Card>
          <form onSubmit={(e) => handleSubmit(e, false)} className={styles.form}>
            {error && (
              <Alert type="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <div className={styles.establishmentField}>
              <label className={styles.label}>Établissement</label>
              <div className={styles.establishmentSelect}>
                <select
                  value={establishmentId}
                  onChange={(e) => handleEstablishmentChange(e.target.value)}
                  required
                  className={styles.select}
                >
                  <option value="">Sélectionner...</option>
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => setShowNewEstablishment(true)}
                  aria-label="Nouvel établissement"
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.row}>
              <Input
                type="number"
                label="Heures"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="7.5"
                step="0.25"
                min="0"
                max="24"
                required
              />

              <Input
                type="number"
                label="Taux horaire (€)"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="12.50"
                step="0.01"
                min="0"
                required
              />
            </div>

            <Input
              label="Note (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Formation, remplacement..."
            />

            {/* Preview */}
            <div className={styles.preview}>
              <div className={styles.previewRow}>
                <span>Brut:</span>
                <span className={styles.previewValue}>{formatCurrency(gross)}</span>
              </div>
              <div className={styles.previewRow}>
                <span>Net estimé:</span>
                <span className={`${styles.previewValue} ${styles.netValue}`}>
                  {formatCurrency(net)}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button type="submit" fullWidth loading={saving}>
                {isEditing ? 'Enregistrer' : 'Ajouter'}
              </Button>

              {!isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={saving}
                >
                  Ajouter & Dupliquer (+1 jour)
                </Button>
              )}

              {isEditing && (
                <Button
                  type="button"
                  variant="danger"
                  fullWidth
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                >
                  Supprimer
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Supprimer l'entrée"
      >
        <p className={styles.modalText}>
          Êtes-vous sûr de vouloir supprimer cette entrée ? Cette action est irréversible.
        </p>
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={saving}>
            Supprimer
          </Button>
        </div>
      </Modal>

      {/* New establishment modal */}
      <Modal
        isOpen={showNewEstablishment}
        onClose={() => setShowNewEstablishment(false)}
        title="Nouvel établissement"
      >
        <div className={styles.newEstForm}>
          <Input
            label="Nom"
            value={newEstablishmentName}
            onChange={(e) => setNewEstablishmentName(e.target.value)}
            placeholder="Nom de l'établissement"
            autoFocus
          />
          <Input
            type="number"
            label="Taux horaire par défaut (€)"
            value={newEstablishmentRate}
            onChange={(e) => setNewEstablishmentRate(e.target.value)}
            placeholder="12.50"
            step="0.01"
            min="0"
          />
          <Input
            type="number"
            label="Heures par défaut (optionnel)"
            value={newEstablishmentHours}
            onChange={(e) => setNewEstablishmentHours(e.target.value)}
            placeholder="7.5"
            step="0.25"
            min="0"
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowNewEstablishment(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateEstablishment}
              disabled={!newEstablishmentName.trim() || !newEstablishmentRate}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
