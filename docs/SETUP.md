# Guide de Configuration - Interim Planner

Ce guide détaille toutes les étapes pour configurer et déployer Interim Planner.

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Firebase](#configuration-firebase)
3. [Configuration du projet local](#configuration-du-projet-local)
4. [Déploiement GitHub Pages](#déploiement-github-pages)
5. [Installation iPhone](#installation-iphone)
6. [Tests](#tests)
7. [Dépannage](#dépannage)

---

## Prérequis

- Node.js 18+ et npm
- Un compte GitHub
- Un compte Google (pour Firebase)

---

## Configuration Firebase

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur **"Ajouter un projet"**
3. Nommez votre projet (ex: `interim-planner`)
4. Désactivez Google Analytics (optionnel pour ce projet)
5. Cliquez sur **"Créer le projet"**

### 2. Activer l'authentification

1. Dans le menu de gauche, cliquez sur **"Authentication"**
2. Cliquez sur **"Commencer"**
3. Dans l'onglet **"Sign-in method"**, cliquez sur **"E-mail/Mot de passe"**
4. Activez **"E-mail/Mot de passe"** (pas besoin de "Lien e-mail")
5. Cliquez sur **"Enregistrer"**

### 3. Créer la base Firestore

1. Dans le menu de gauche, cliquez sur **"Firestore Database"**
2. Cliquez sur **"Créer une base de données"**
3. Choisissez **"Démarrer en mode production"**
4. Sélectionnez une région proche de vos utilisateurs (ex: `europe-west1` pour la France)
5. Cliquez sur **"Créer"**

### 4. Configurer les Security Rules

1. Dans Firestore, allez dans l'onglet **"Règles"**
2. Remplacez le contenu par les règles du fichier `firestore.rules` :

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Block all access by default
    match /{document=**} {
      allow read, write: if false;
    }

    // User data - strictly isolated by user ID
    match /users/{userId} {
      function isOwner() {
        return request.auth != null && request.auth.uid == userId;
      }

      match /settings/{settingId} {
        allow read: if isOwner();
        allow write: if isOwner() && request.resource.data.keys().hasAll(['netCoefficient', 'currency']);
      }

      match /establishments/{establishmentId} {
        allow read: if isOwner();
        allow create: if isOwner()
          && request.resource.data.keys().hasAll(['name', 'defaultHourlyRate', 'createdAt', 'updatedAt'])
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0
          && request.resource.data.defaultHourlyRate is number
          && request.resource.data.defaultHourlyRate >= 0;
        allow update: if isOwner()
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0
          && request.resource.data.defaultHourlyRate is number
          && request.resource.data.defaultHourlyRate >= 0;
        allow delete: if isOwner();
      }

      match /workEntries/{entryId} {
        allow read: if isOwner();
        allow create: if isOwner()
          && request.resource.data.keys().hasAll(['date', 'establishmentId', 'establishmentNameSnapshot', 'hours', 'hourlyRate', 'createdAt', 'updatedAt'])
          && request.resource.data.date is string
          && request.resource.data.date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
          && request.resource.data.hours is number
          && request.resource.data.hours > 0
          && request.resource.data.hours <= 24
          && request.resource.data.hourlyRate is number
          && request.resource.data.hourlyRate >= 0;
        allow update: if isOwner()
          && request.resource.data.date is string
          && request.resource.data.date.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
          && request.resource.data.hours is number
          && request.resource.data.hours > 0
          && request.resource.data.hours <= 24
          && request.resource.data.hourlyRate is number
          && request.resource.data.hourlyRate >= 0;
        allow delete: if isOwner();
      }
    }
  }
}
```

3. Cliquez sur **"Publier"**

### 5. Récupérer la configuration Firebase

1. Dans les paramètres du projet (icône engrenage), allez dans **"Paramètres du projet"**
2. Descendez jusqu'à **"Vos applications"**
3. Cliquez sur l'icône **Web** (`</>`)
4. Nommez l'application (ex: `interim-planner-web`)
5. Ne cochez pas "Firebase Hosting"
6. Cliquez sur **"Enregistrer l'application"**
7. Copiez les valeurs de configuration :

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Configuration du projet local

### 1. Cloner et installer

```bash
git clone https://github.com/[username]/interim-planner.git
cd interim-planner
npm install
```

### 2. Configurer les variables d'environnement

1. Copiez le fichier d'exemple :

```bash
cp .env.example .env
```

2. Éditez `.env` avec vos valeurs Firebase :

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Lancer en développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173/interim-planner/`

---

## Déploiement GitHub Pages

### 1. Activer GitHub Pages

1. Allez dans les **Settings** de votre repo GitHub
2. Dans la section **"Pages"** (menu de gauche)
3. Sous **"Build and deployment"**, sélectionnez :
   - **Source**: GitHub Actions
4. Cliquez sur **"Save"**

### 2. Configurer les secrets GitHub

Les secrets sont nécessaires pour le build avec Firebase. Allez dans :
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Ajoutez chaque secret :

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | Votre API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 123456789 |
| `VITE_FIREBASE_APP_ID` | 1:123456789:web:abc123 |

### 3. Déployer

Le déploiement se fait automatiquement à chaque push sur `main`.

Vous pouvez aussi déclencher manuellement :
1. Allez dans **Actions**
2. Sélectionnez le workflow **"Deploy to GitHub Pages"**
3. Cliquez sur **"Run workflow"**

### 4. Ajouter le domaine Firebase

Pour que l'authentification fonctionne sur GitHub Pages :

1. Dans Firebase Console, allez dans **Authentication** → **Settings** → **Authorized domains**
2. Cliquez sur **"Add domain"**
3. Ajoutez : `[username].github.io`

### 5. Gestion du routing SPA

Le routing SPA sur GitHub Pages pose un problème : lors d'un refresh sur une route comme `/entries/new`, GitHub retourne une 404 car le fichier n'existe pas.

**Solution implémentée** : Le workflow copie `index.html` vers `404.html`. GitHub Pages sert `404.html` pour les routes inexistantes, ce qui permet à React Router de gérer le routing côté client.

---

## Installation iPhone

### Ajouter à l'écran d'accueil

1. Ouvrez Safari sur votre iPhone
2. Allez sur `https://[username].github.io/interim-planner/`
3. Appuyez sur l'icône **Partage** (carré avec flèche vers le haut)
4. Faites défiler et appuyez sur **"Sur l'écran d'accueil"**
5. Personnalisez le nom si souhaité
6. Appuyez sur **"Ajouter"**

L'application apparaîtra sur votre écran d'accueil avec son icône et s'ouvrira en plein écran comme une app native.

### Fonctionnalités PWA

- **Plein écran** : Pas de barre Safari
- **Icône personnalisée** : Icône de l'app sur l'écran d'accueil
- **Splash screen** : Écran de chargement au lancement
- **Mode portrait** : Optimisé pour l'utilisation verticale

---

## Tests

### Tests unitaires

```bash
# Lancer les tests
npm run test

# Lancer les tests une seule fois
npm run test:run

# Avec couverture
npm run test:coverage
```

### Structure des tests

Les tests sont organisés par fichier source avec le suffixe `.test.ts` :

- `src/utils/calculations.test.ts` - Tests des calculs brut/net
- `src/utils/dates.test.ts` - Tests des utilitaires de dates
- `src/utils/format.test.ts` - Tests du formatage (monnaie, nombres)

### Tests E2E (optionnel)

Pour des tests E2E avec Firebase Emulators :

1. Installez Firebase Tools :
```bash
npm install -g firebase-tools
```

2. Initialisez les emulators :
```bash
firebase init emulators
```

3. Lancez les emulators :
```bash
firebase emulators:start
```

4. Configurez votre app pour utiliser les emulators en développement.

---

## Dépannage

### L'authentification ne fonctionne pas

1. Vérifiez que le domaine est autorisé dans Firebase (Authentication → Settings → Authorized domains)
2. Vérifiez les variables d'environnement
3. Vérifiez la console du navigateur pour les erreurs

### Erreur 404 sur refresh

C'est normal si le fichier `404.html` n'existe pas. Vérifiez que le workflow a bien copié `index.html` vers `404.html`.

### Les données ne se sauvegardent pas

1. Vérifiez les règles Firestore dans la console Firebase
2. Vérifiez que vous êtes bien authentifié
3. Consultez l'onglet Réseau du navigateur pour voir les requêtes

### Le PDF ne s'ouvre pas sur iOS

Sur iOS, le PDF s'ouvre dans un nouvel onglet Safari. Utilisez le bouton de partage de Safari pour imprimer ou sauvegarder.

### L'app ne s'installe pas en PWA

1. Vérifiez que vous utilisez HTTPS
2. Vérifiez le manifest dans les DevTools (Application → Manifest)
3. Essayez de vider le cache du navigateur

---

## Structure des données Firestore

```
users/
  {userId}/
    settings/
      main {
        netCoefficient: number,
        currency: "EUR"
      }
    establishments/
      {establishmentId} {
        name: string,
        defaultHourlyRate: number,
        defaultHours?: number,
        color?: string,
        createdAt: Timestamp,
        updatedAt: Timestamp
      }
    workEntries/
      {entryId} {
        date: "YYYY-MM-DD",
        establishmentId: string,
        establishmentNameSnapshot: string,
        hours: number,
        hourlyRate: number,
        note?: string,
        createdAt: Timestamp,
        updatedAt: Timestamp
      }
```

---

## Support

Pour toute question ou problème, ouvrez une issue sur GitHub.
