import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, getAuthErrorMessage } from '@/services/auth';
import { Button, Input, Card } from '@/components/ui';
import { Alert } from '@/components/common';
import styles from './AuthPages.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
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
        <p className={styles.subtitle}>Connexion</p>
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
            placeholder="••••••••"
            required
            autoComplete="current-password"
            minLength={6}
          />

          <Button type="submit" fullWidth loading={loading}>
            Se connecter
          </Button>
        </form>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>
            Mot de passe oublié ?
          </Link>
        </div>
      </Card>

      <p className={styles.footer}>
        Pas encore de compte ?{' '}
        <Link to="/signup" className={styles.link}>
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
