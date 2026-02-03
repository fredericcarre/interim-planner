# Interim Planner

PWA pour saisir un planning d'intérim (jours travaillés) et estimer brut/net via un coefficient.

## Fonctionnalités

- **Authentification** : Email/password via Firebase Auth
- **Gestion des entrées** : Saisie des jours travaillés avec établissement, heures, taux horaire
- **Calculs automatiques** : Brut (heures × taux) et Net estimé (brut × coefficient)
- **Établissements** : Gestion des établissements avec taux par défaut
- **Export PDF** : Export mensuel imprimable
- **RGPD** : Export complet des données, suppression du compte
- **PWA** : Installable sur iPhone via "Ajouter à l'écran d'accueil"

## Stack technique

- React 18 + TypeScript
- Vite
- Firebase (Auth + Firestore)
- jsPDF pour l'export PDF
- Vitest pour les tests
- GitHub Pages pour le déploiement

## Installation locale

```bash
# Cloner le repo
git clone https://github.com/[username]/interim-planner.git
cd interim-planner

# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials Firebase

# Lancer en développement
npm run dev

# Build production
npm run build

# Preview production
npm run preview
```

## Configuration

Voir [docs/SETUP.md](docs/SETUP.md) pour la configuration complète :
- Firebase (Auth, Firestore, Security Rules)
- GitHub Pages
- Installation iPhone

## Structure du projet

```
src/
├── app/                    # Routing et layout
│   ├── App.tsx
│   ├── Router.tsx
│   └── Layout.tsx
├── components/             # Composants réutilisables
│   ├── ui/                 # Boutons, inputs, cards...
│   └── common/             # Header, Loading, etc.
├── features/               # Modules fonctionnels
│   ├── auth/               # Login, Signup, Reset
│   ├── entries/            # Work entries CRUD
│   ├── establishments/     # Establishments CRUD
│   ├── settings/           # Paramètres utilisateur
│   └── privacy/            # RGPD, export, delete
├── services/               # Services Firebase
│   ├── firebase.ts         # Init Firebase
│   ├── auth.ts             # Auth service
│   └── firestore.ts        # Firestore CRUD
├── hooks/                  # Custom hooks
├── utils/                  # Utilitaires
│   ├── calculations.ts     # Calculs brut/net
│   ├── dates.ts            # Formatage dates
│   └── format.ts           # Formatage nombres/monnaie
├── types/                  # Types TypeScript
└── contexts/               # React contexts
```

## Checklist de développement

### Phase 1 : Init projet + PWA
- [x] Init Vite + React + TypeScript
- [x] Structure de dossiers
- [x] PWA manifest.json
- [x] Service Worker
- [x] Icônes PWA

### Phase 2 : Firebase Auth
- [x] Configuration Firebase
- [x] Service d'authentification
- [x] Context Auth
- [x] Pages Login/Signup/Reset
- [x] Routes protégées
- [x] Logout

### Phase 3 : Firestore + Entries
- [x] Security Rules Firestore
- [x] Types de données
- [x] Service CRUD
- [x] Month View (écran principal)
- [x] Add/Edit Work Entry
- [x] Save & Duplicate

### Phase 4 : Establishments + Settings
- [x] CRUD Establishments
- [x] Settings (netCoefficient)
- [x] Autocomplete établissement

### Phase 5 : PDF + Compare
- [x] Export PDF mensuel
- [x] Compare Payslip

### Phase 6 : RGPD
- [x] Export JSON complet
- [x] Delete account + data
- [x] Page Privacy

### Phase 7 : Tests + CI
- [x] Tests unitaires (calculs, utils)
- [x] GitHub Actions CI
- [x] Documentation tests

### Phase 8 : Deploy
- [x] Config Vite base path
- [x] GitHub Actions deploy Pages
- [x] Documentation complète

## Scripts disponibles

```bash
npm run dev        # Développement local
npm run build      # Build production
npm run preview    # Preview du build
npm run test       # Lancer les tests
npm run lint       # Linter
```

## Limitations connues

- Le coefficient net est une estimation et peut différer du net réel selon les cotisations
- L'export PDF utilise une mise en page basique optimisée pour l'impression
- Pas de synchronisation offline (les données nécessitent une connexion)
- Pas de multi-devise (EUR uniquement pour le MVP)

## Licence

MIT

## Changelog

### v1.0.0 (Initial Release)
- Authentification email/password
- Gestion des entrées de travail
- Gestion des établissements
- Calculs brut/net avec coefficient
- Export PDF mensuel
- RGPD : export données + suppression compte
- PWA installable
