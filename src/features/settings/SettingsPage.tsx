import { useState, useEffect, FormEvent } from 'react';
import { Header, Loading, Alert } from '@/components/common';
import { Button, Input, Card } from '@/components/ui';
import { getUserSettings, updateUserSettings } from '@/services/firestore';
import {
  DEFAULT_NET_COEFFICIENT,
  coefficientToPercent,
  isValidCoefficient,
} from '@/utils/calculations';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [netCoefficient, setNetCoefficient] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getUserSettings();
        setNetCoefficient(String(settings.netCoefficient));
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Erreur lors du chargement des paramètres.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const coefficient = parseFloat(netCoefficient);
    if (!isValidCoefficient(coefficient)) {
      setError('Le coefficient doit être entre 0 et 1.');
      return;
    }

    setSaving(true);
    try {
      await updateUserSettings({ netCoefficient: coefficient });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNetCoefficient(String(DEFAULT_NET_COEFFICIENT));
  };

  const currentCoefficient = parseFloat(netCoefficient) || 0;
  const percentDisplay = isValidCoefficient(currentCoefficient)
    ? coefficientToPercent(currentCoefficient)
    : '—';

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.page}>
      <Header title="Paramètres" showBack />

      <div className={styles.content}>
        <Card>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <Alert type="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert type="success">
                Paramètres enregistrés avec succès.
              </Alert>
            )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Calcul du net</h2>
              <p className={styles.sectionDescription}>
                Le coefficient net permet d'estimer le salaire net à partir du brut.
                Par défaut, nous utilisons <strong>{coefficientToPercent(DEFAULT_NET_COEFFICIENT)}</strong> (environ 70% du brut).
              </p>

              <Input
                type="number"
                label="Coefficient net"
                value={netCoefficient}
                onChange={(e) => setNetCoefficient(e.target.value)}
                placeholder="0.6993"
                step="0.0001"
                min="0"
                max="1"
                required
                helperText={`Soit ${percentDisplay} du brut`}
              />

              <button
                type="button"
                className={styles.resetLink}
                onClick={handleReset}
              >
                Réinitialiser à la valeur par défaut
              </button>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Devise</h2>
              <p className={styles.sectionDescription}>
                La devise utilisée pour les calculs et l'affichage.
              </p>
              <div className={styles.currencyDisplay}>
                EUR (€) — Euro
              </div>
              <p className={styles.hint}>
                Seul l'euro est supporté pour le moment.
              </p>
            </div>

            <Button type="submit" fullWidth loading={saving}>
              Enregistrer
            </Button>
          </form>
        </Card>

        <div className={styles.infoCard}>
          <h3>Comment fonctionne le coefficient ?</h3>
          <p>
            Le coefficient net est un multiplicateur appliqué au salaire brut
            pour estimer le net. Par exemple, avec un coefficient de 0.70 :
          </p>
          <ul>
            <li>1000 € brut → 700 € net estimé</li>
            <li>1500 € brut → 1050 € net estimé</li>
          </ul>
          <p className={styles.warning}>
            Ce calcul est une estimation. Le montant réel peut varier selon
            votre situation (cotisations, mutuelle, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}
