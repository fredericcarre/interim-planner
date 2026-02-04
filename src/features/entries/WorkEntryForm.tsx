import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Loading, Alert, Modal } from '@/components/common';
import { Button, Input, NumberInput, Card, MultiDatePicker } from '@/components/ui';
import {
  getWorkEntry,
  createWorkEntry,
  updateWorkEntry,
  deleteWorkEntry,
  getEstablishments,
  createEstablishment,
} from '@/services/firestore';
import type { Establishment, WorkEntryFormData } from '@/types';
import { getToday } from '@/utils/dates';
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
  const [date, setDate] = useState(getToday()); // For editing
  const [dates, setDates] = useState<string[]>([]); // For creating multiple
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const establishmentName = selectedEstablishment?.name || '';

      if (isEditing && id) {
        // Edit mode: single date
        const formData: WorkEntryFormData = {
          date,
          establishmentId,
          hours: parseFloat(hours),
          hourlyRate: parseFloat(hourlyRate),
          note: note.trim() || undefined,
        };
        await updateWorkEntry(id, formData, establishmentName);
      } else {
        // Create mode: multiple dates
        const datesToCreate = dates.length > 0 ? dates : [getToday()];

        for (const entryDate of datesToCreate) {
          const formData: WorkEntryFormData = {
            date: entryDate,
            establishmentId,
            hours: parseFloat(hours),
            hourlyRate: parseFloat(hourlyRate),
            note: note.trim() || undefined,
          };
          await createWorkEntry(formData, establishmentName);
        }
      }

      navigate('/');
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
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <Alert type="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {isEditing ? (
              <Input
                type="date"
                label="Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            ) : (
              <MultiDatePicker
                label="Dates"
                dates={dates}
                onChange={setDates}
                helperText="Ajoutez plusieurs dates pour créer plusieurs entrées"
              />
            )}

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
              <NumberInput
                label="Heures"
                value={hours}
                onChange={setHours}
                placeholder="7,5"
                decimals={2}
                required
                helperText="Ex: 7,5 ou 7.5"
              />

              <NumberInput
                label="Taux horaire (€)"
                value={hourlyRate}
                onChange={setHourlyRate}
                placeholder="12,50"
                decimals={2}
                required
                helperText="Ex: 12,50 ou 12.50"
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
                <span>Brut{!isEditing && dates.length > 1 ? ` (x${dates.length})` : ''}:</span>
                <span className={styles.previewValue}>
                  {formatCurrency(!isEditing && dates.length > 1 ? gross * dates.length : gross)}
                </span>
              </div>
              <div className={styles.previewRow}>
                <span>Net estimé{!isEditing && dates.length > 1 ? ` (x${dates.length})` : ''}:</span>
                <span className={`${styles.previewValue} ${styles.netValue}`}>
                  {formatCurrency(!isEditing && dates.length > 1 ? net * dates.length : net)}
                </span>
              </div>
            </div>

            <div className={styles.actions}>
              <Button type="submit" fullWidth loading={saving} disabled={!isEditing && dates.length === 0}>
                {isEditing
                  ? 'Enregistrer'
                  : dates.length > 1
                    ? `Ajouter ${dates.length} entrées`
                    : 'Ajouter'}
              </Button>

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
          <NumberInput
            label="Taux horaire par défaut (€)"
            value={newEstablishmentRate}
            onChange={setNewEstablishmentRate}
            placeholder="12,50"
            decimals={2}
          />
          <NumberInput
            label="Heures par défaut (optionnel)"
            value={newEstablishmentHours}
            onChange={setNewEstablishmentHours}
            placeholder="7,5"
            decimals={2}
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
