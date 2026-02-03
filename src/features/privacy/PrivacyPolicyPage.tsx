import { Header } from '@/components/common';
import { Card } from '@/components/ui';
import styles from './PrivacyPolicyPage.module.css';

export function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <Header title="Politique de confidentialité" showBack />

      <div className={styles.content}>
        <Card className={styles.policyCard}>
          <h1 className={styles.title}>Politique de Confidentialité</h1>
          <p className={styles.updated}>Dernière mise à jour : Février 2024</p>

          <section className={styles.section}>
            <h2>1. Introduction</h2>
            <p>
              Interim Planner est une application de suivi de planning pour les
              travailleurs intérimaires. Cette politique de confidentialité
              explique comment nous collectons, utilisons et protégeons vos
              données personnelles.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul>
              <li>
                <strong>Informations de compte :</strong> Adresse email et mot
                de passe (crypté) pour l'authentification
              </li>
              <li>
                <strong>Données de planning :</strong> Établissements, entrées
                de travail (dates, heures, taux horaires, notes)
              </li>
              <li>
                <strong>Paramètres :</strong> Coefficient net personnalisé
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Utilisation des données</h2>
            <p>Vos données sont utilisées uniquement pour :</p>
            <ul>
              <li>Permettre le fonctionnement de l'application</li>
              <li>Calculer vos estimations de salaire</li>
              <li>Générer des exports PDF de vos plannings</li>
            </ul>
            <p>
              <strong>Nous ne vendons jamais vos données à des tiers.</strong>
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Stockage et sécurité</h2>
            <p>
              Vos données sont stockées de manière sécurisée sur les serveurs
              Firebase (Google Cloud Platform). Nous utilisons :
            </p>
            <ul>
              <li>Le chiffrement en transit (HTTPS/TLS)</li>
              <li>Le chiffrement au repos</li>
              <li>
                Des règles de sécurité Firestore pour garantir que seul vous
                pouvez accéder à vos données
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données
              (RGPD), vous disposez des droits suivants :
            </p>
            <ul>
              <li>
                <strong>Droit d'accès :</strong> Consultez vos données à tout
                moment dans l'application
              </li>
              <li>
                <strong>Droit de rectification :</strong> Modifiez vos données
                directement dans l'application
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> Exportez toutes vos
                données au format JSON
              </li>
              <li>
                <strong>Droit à l'effacement :</strong> Supprimez votre compte
                et toutes vos données
              </li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Conservation des données</h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. En
              cas de suppression de compte, toutes vos données sont
              immédiatement et définitivement supprimées de nos serveurs.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Cookies et stockage local</h2>
            <p>
              L'application utilise le stockage local du navigateur et les
              cookies de session Firebase pour l'authentification. Aucun cookie
              de tracking ou publicitaire n'est utilisé.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Modifications</h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité. Les
              modifications importantes seront notifiées dans l'application.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Contact</h2>
            <p>
              Pour toute question concernant vos données personnelles, vous
              pouvez nous contacter via la page GitHub du projet.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
