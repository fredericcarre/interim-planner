import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Loading, Alert } from '@/components/common';
import { Button, Input, NumberInput, Card } from '@/components/ui';
import {
  getEstablishment,
  createEstablishment,
  updateEstablishment,
} from '@/services/firestore';
import type { EstablishmentFormData } from '@/types';
import styles from './EstablishmentForm.module.css';

export function EstablishmentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState('');
  const [defaultHours, setDefaultHours] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (!isEditing || !id) return;

    const loadEstablishment = async () => {
      try {
        const est = await getEstablishment(id);
        if (est) {
          setName(est.name);
          setDefaultHourlyRate(String(est.defaultHourlyRate));
          setDefaultHours(est.defaultHours ? String(est.defaultHours) : '');
          setColor(est.color || '');
        } else {
          navigate('/establishments');
        }
      } catch (err) {
        console.error('Failed to load establishment:', err);
        setError('Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    };

    loadEstablishment();
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData: EstablishmentFormData = {
      name: name.trim(),
      defaultHourlyRate: parseFloat(defaultHourlyRate),
      defaultHours: defaultHours ? parseFloat(defaultHours) : undefined,
      color: color.trim() || undefined,
    };

    try {
      if (isEditing && id) {
        await updateEstablishment(id, formData);
      } else {
        await createEstablishment(formData);
      }
      navigate('/establishments');
    } catch (err) {
      console.error('Failed to save establishment:', err);
      setError('Erreur lors de la sauvegarde.');
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.page}>
      <Header
        title={isEditing ? 'Modifier l\'établissement' : 'Nouvel établissement'}
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

            <Input
              label="Nom de l'établissement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hôpital Saint-Louis"
              required
              autoFocus
            />

            <NumberInput
              label="Taux horaire par défaut (€)"
              value={defaultHourlyRate}
              onChange={setDefaultHourlyRate}
              placeholder="12,50"
              decimals={2}
              required
              helperText="Ex: 12,50 - Prérempli lors de la saisie"
            />

            <NumberInput
              label="Heures par défaut (optionnel)"
              value={defaultHours}
              onChange={setDefaultHours}
              placeholder="7,5"
              decimals={2}
              helperText="Ex: 7,5 - Heures standard par jour"
            />

            <Input
              label="Couleur (optionnel)"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#3b82f6"
              helperText="Code couleur hexadécimal pour identifier l'établissement."
            />

            <Button type="submit" fullWidth loading={saving}>
              {isEditing ? 'Enregistrer' : 'Créer l\'établissement'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
