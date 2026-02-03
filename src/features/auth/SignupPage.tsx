import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, getAuthErrorMessage } from '@/services/auth';
import { Button, Input, Card } from '@/components/ui';
import { Alert } from '@/components/common';
import styles from './AuthPages.module.css';

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      navigate('/', { replace: true });
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
        <p className={styles.subtitle}>Créer un compte</p>
      </div>

      <Card className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

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

          <Input
            type="password"
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Au moins 6 caractères"
            required
            autoComplete="new-password"
            minLength={6}
          />

          <Input
            type="password"
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={6}
          />

          <Button type="submit" fullWidth loading={loading}>
            Créer mon compte
          </Button>
        </form>
      </Card>

      <p className={styles.footer}>
        Déjà un compte ?{' '}
        <Link to="/login" className={styles.link}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}
