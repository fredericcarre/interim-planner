import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword, getAuthErrorMessage } from '@/services/auth';
import { Button, Input, Card } from '@/components/ui';
import { Alert } from '@/components/common';
import styles from './AuthPages.module.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      const errorCode = (err as { code?: string }).code || '';
      setError(getAuthErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.logo}>Interim Planner</h1>
        <p className={styles.subtitle}>Mot de passe oublié</p>
      </div>

      <Card className={styles.card}>
        {success ? (
          <div className={styles.successMessage}>
            <Alert type="success">
              Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
              Vérifiez votre boîte de réception.
            </Alert>
            <Link to="/login">
              <Button variant="secondary" fullWidth>
                Retour à la connexion
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <Alert type="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <p className={styles.description}>
              Entrez votre adresse email et nous vous enverrons un lien pour
              réinitialiser votre mot de passe.
            </p>

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
              autoFocus
            />

            <Button type="submit" fullWidth loading={loading}>
              Envoyer le lien
            </Button>
          </form>
        )}
      </Card>

      <p className={styles.footer}>
        <Link to="/login" className={styles.link}>
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
