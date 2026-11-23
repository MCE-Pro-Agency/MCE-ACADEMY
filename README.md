# MCE Academy

**La plateforme de formation des entreprises de MCE (Management · Communication · Event).**
*Se découvrir. S'exprimer. Agir. Progresser.*

Elle fonctionne comme Udemy ou OpenClassrooms, mais en **multi-entreprises** : chaque entreprise cliente a son propre espace avec ses cours, ses modules, ses apprenants, ses notes et ses statistiques.

---

## 1. Ce que fait la plateforme

| Rôle | Ce qu'il peut faire |
|---|---|
| **Apprenant** | Se connecte **uniquement** à l'espace de son entreprise · suit les cours (texte, vidéo, document) · passe les quiz (corrigés automatiquement) · rend ses exercices · voit ses barres de progression, ses notes et le temps passé · obtient un certificat à 100 % |
| **Formateur** | Gère **uniquement** l'espace de son entreprise : apprenants (ajout, import CSV, désactivation, nouveau mot de passe), cours, modules, leçons, quiz, inscriptions, corrections notées sur 20, annonces · voit **les notes et le temps de connexion de chacun** |
| **Administrateur** | Gère **toute la plateforme** : crée les entreprises (et leur formateur référent), tous les utilisateurs et tous les rôles, ouvre l'espace de n'importe quelle entreprise, voit les statistiques globales |

**Fonctionnalités clés**
- Page d'accueil, connexion, mot de passe oublié
- Catalogue avec recherche, filtres et barres de progression
- Lecteur de cours : programme latéral, leçon suivante/précédente, progression en temps réel
- 5 types de leçons : **Leçon** (Markdown), **Vidéo** (YouTube, Vimeo, MP4), **Document** (PDF intégré), **Quiz**, **Exercice**
- Quiz corrigés **côté serveur** (les bonnes réponses ne sont jamais envoyées aux apprenants)
- Exercices notés /20 avec retour du formateur, ou renvoyés « à reprendre »
- Suivi automatique du **temps de connexion** (une pulsation par minute, uniquement quand l'onglet est visible) et du temps par leçon
- Tableaux de bord avec graphiques : activité, progression par cours, meilleurs apprenants, apprenants à relancer
- Export CSV des apprenants, import CSV en masse avec identifiants générés
- Certificat de réussite imprimable / PDF
- Annonces du formateur sur le tableau de bord des apprenants
- Interface responsive (ordinateur, tablette, mobile)

**Charte graphique** : bleu clair `#2B9FDC` (logo), bleu foncé `#112842`, blanc, noir et une touche de **doré** `#C9A227` (certificats, distinctions). Couleurs modifiables dans `frontend/tailwind.config.js`.

---

## 2. Architecture

```
mce-academie/
├── database/
│   └── schema.sql          ← base MySQL complète (16 tables)
├── server/                 ← API Node.js / Express (seule à parler à MySQL)
│   ├── src/
│   │   ├── index.js        ← point d'entrée
│   │   ├── db.js           ← connexion MySQL (pool)
│   │   ├── policies.js     ← règles d'accès par rôle et par table
│   │   ├── query.js        ← moteur de requêtes (lecture, relations, écriture)
│   │   ├── middleware/auth.js   ← sessions JWT
│   │   ├── services/accounts.js ← comptes (mots de passe chiffrés bcrypt)
│   │   └── routes/         ← auth, db, rpc (fonctions métier), upload, users, companies
│   ├── scripts/            ← init-db.js (crée la base), seed.js (admin + démo)
│   └── uploads/            ← fichiers envoyés (couvertures, documents, rendus)
└── frontend/               ← React 18 + Vite + Tailwind CSS
    └── src/
        ├── pages/          ← un dossier par espace : admin/, trainer/, learner/, shared/
        ├── components/     ← briques d'interface et diagrammes (profil/, ModuleJourney…)
        ├── data/           ← contenus et règles métier (test de profil, mémos)
        └── lib/            ← db.js (client API), stores.js, api.js, queries.js, utils.js
```

**Qui fait quoi ?**
- **MySQL** : toutes les données (comptes, cours, progression, notes, profils professionnels, déblocage des modules).
- **API Node.js** : authentification (JWT + mots de passe bcrypt), **contrôle d'accès** sur chaque lecture/écriture, fonctions métier (correction des quiz, temps passé, statistiques), envoi de fichiers.
- **Frontend React** : ne parle qu'à l'API (`/api`). Le client `lib/db.js` garde une écriture simple : `db.from('courses').select('*, modules(*)').eq('id', x)`.

**Les trois espaces**
| Espace | Voit et gère |
|---|---|
| Administrateur MCE | tout : entreprises, formateurs, apprenants, profils, activité |
| Formateur | son entreprise : cours, modules, apprenants, corrections, profils |
| Apprenant | ses formations, sa progression, ses notes, son profil professionnel, ses ressources |

### Modèle de données

```
companies ─┬─ profiles (admin | trainer | learner, mot de passe chiffré)
           ├─ courses ─ modules ─┬─ lessons ─ quiz_questions ─ quiz_answers (cachées aux apprenants)
           │                     └─ module_settings (déblocage : ouvert, fermé, date, progressif)
           └─ announcements
profiles ─┬─ enrollments · lesson_progress · quiz_attempts · exercise_submissions · user_sessions
          └─ profile_assessments (test de profil professionnel : passations, observations)
```

---

## 3. Installation (Windows / XAMPP ou MySQL 8)

### Prérequis
- **Node.js 18+**
- **MySQL 8** ou **MariaDB 10.4+** (celui de XAMPP convient)

### Étape 1 : configurer l'API
```bash
cd server
cp .env.example .env      # renseignez DB_USER / DB_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run setup             # crée la base « mce_academy » + l'administrateur (+ démo si SEED_DEMO=true)
npm run dev               # API sur http://localhost:4000
```
`npm run db:init` crée uniquement la base ; vous pouvez aussi importer `database/schema.sql` dans phpMyAdmin.

### Étape 2 : lancer le frontend
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173 (l'API est jointe via le proxy Vite)
```

### Comptes de démonstration (si `SEED_DEMO=true`)
| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | celui de `ADMIN_EMAIL` | celui de `ADMIN_PASSWORD` |
| Formateur | `formateur@vigilus.demo` | `Formateur!2026` |
| Apprenants | `apprenant1@vigilus.demo`, `apprenant2@…`, `apprenant3@…` | `Apprenant!2026` |

> ⚠️ En production, supprimez les comptes de démo ou changez leurs mots de passe.

---

## 4. Utilisation au quotidien

1. **Admin** → *Entreprises clientes* → **Nouvelle entreprise** (avec son formateur référent) → les identifiants s'affichent.
2. **Formateur** → *Cours & modules* → crée cours, modules et leçons, puis **publie**. → *Programme & déblocage* → ouvre les modules **jour après jour** (fermé / ouvert / à une date) et suit chaque apprenant module par module. Un module fermé est masqué côté serveur : ni leçons, ni quiz, ni téléchargements.
   → *Documents* : met à disposition les supports (diaporama, livret des mémos) et dépose les e-books ou attestations individuels.
3. **Formateur** → *Suivi des apprenants* → **Ajouter** ou **Importer CSV** → transmet les identifiants.
4. **Apprenant** passe son **profil professionnel**, suit ses cours, ses quiz et rend ses exercices.
5. **Formateur / Admin** suivent la progression, corrigent, consultent les profils et exportent en CSV.

**Contenu de la formation VIGILUS IMPACT** : `server/scripts/content/vigilus-impact.js` (leçons) + les JSON du kit MCE (quiz et missions) dans le même dossier. Les PDF participants sont dans `frontend/public/documents/`. Pour réimporter le contenu après modification : `cd server && npm run seed:content` (les comptes, profils et documents sont conservés ; la progression sur les cours est remise à zéro).

**Espace apprenant** : guide complet de reprise dans [docs/ESPACE_APPRENANT.md](docs/ESPACE_APPRENANT.md) (mode « test uniquement », déblocage, suivi, passage à Supabase). Migration Supabase prête : `supabase/schema.sql` puis `supabase/002_espace_apprenant.sql`.

Mot de passe oublié : le formateur (ou l'admin) génère un nouveau mot de passe temporaire depuis la fiche de l'utilisateur.

---

## 5. Mise en production

```bash
cd frontend && npm run build      # génère frontend/dist
cd ../server && npm start         # sert l'API ET le site sur le même port
```
Mettez `CORS_ORIGIN` sur votre domaine, laissez `VITE_API_URL` vide, utilisez un `JWT_SECRET` long et unique, et sauvegardez régulièrement la base (`mysqldump mce_academy`) ainsi que `server/uploads/`.

---

## 6. Sécurité

- Les mots de passe sont chiffrés (**bcrypt**) ; les sessions sont des jetons **JWT** signés (durée : `JWT_TTL`).
- **Chaque requête est filtrée côté serveur** (`server/src/policies.js`) : un apprenant ne lit que ses données, un formateur que son entreprise.
- Un utilisateur ne peut pas changer son propre rôle ni son entreprise ; un apprenant ne peut ni voir les bonnes réponses des quiz, ni se noter lui-même.
- Une entreprise suspendue bloque l'accès aux cours de ses apprenants ; un compte désactivé ne peut plus se connecter.
- Les identifiants MySQL et `JWT_SECRET` restent dans `server/.env` (jamais dans Git ni dans le frontend).

---

## 7. Personnalisation rapide

| Quoi | Où |
|---|---|
| Couleurs | `frontend/tailwind.config.js` (`brand`, `navy`, `gold`) |
| Logo | `frontend/public/logo.png` (remplacez par une version HD) |
| Nom, slogan, email de contact | `frontend/src/config.js` |
| Polices | `frontend/index.html` + `tailwind.config.js` |
| Seuil de réussite des quiz | à régler pour chaque quiz dans l'éditeur (70 % par défaut) |

---

© MCE — Ensemble vers la réussite
