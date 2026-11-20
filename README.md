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
mce-academy/
├── supabase/
│   └── schema.sql          ← base de données complète (tables, sécurité RLS, fonctions, stockage)
├── server/                 ← API Node.js / Express (création des comptes, import, suppression)
│   ├── src/
│   │   ├── index.js
│   │   ├── supabase.js
│   │   ├── middleware/auth.js
│   │   ├── services/accounts.js
│   │   └── routes/ (users.js, companies.js)
│   └── scripts/ (seed.js, seed-data.js)   ← premier admin + données de démo VIGILUS
└── frontend/               ← React 18 + Vite + Tailwind CSS
    ├── public/logo.png
    └── src/
        ├── pages/          (Landing, Login, Profile…)
        │   ├── learner/    (Dashboard, Catalog, CourseDetail, LessonPlayer, Grades, Certificate)
        │   ├── trainer/    (Dashboard, Learners, LearnerDetail, Courses, CourseEditor, Submissions, Announcements, CompanySettings)
        │   └── admin/      (Dashboard, Companies, Users)
        ├── components/     (UI : barres et anneaux de progression, modales, cartes…)
        ├── contexts/AuthContext.jsx
        └── lib/            (supabase, api, utils, queries)
```

**Qui fait quoi ?**
- **Supabase** : base PostgreSQL, authentification, stockage des fichiers. La **sécurité est dans la base** (Row Level Security) : même en contournant l'interface, un apprenant ne peut lire que les données de son entreprise.
- **Frontend React** : lit et écrit directement dans Supabase avec la clé publique `anon`, filtrée par la RLS.
- **API Node.js** : uniquement pour les actions qui exigent la clé secrète `service_role` (créer, modifier ou supprimer des comptes, importer des apprenants, supprimer une entreprise).

### Modèle de données

```
companies ─┬─ profiles (admin | trainer | learner)
           ├─ courses ─ modules ─ lessons ─ quiz_questions ─ quiz_answers (cachées)
           └─ announcements
profiles ─┬─ enrollments (inscriptions + date de fin)
          ├─ lesson_progress (terminé + temps passé par leçon)
          ├─ quiz_attempts (notes auto en %)
          ├─ exercise_submissions (notes /20 + retour)
          └─ user_sessions (temps de connexion)
```

---

## 3. Installation

### Prérequis
- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- Un compte **Supabase** gratuit ([supabase.com](https://supabase.com))

### Étape 1 : créer la base Supabase
1. Sur Supabase : **New project**.
2. Ouvrez **SQL Editor → New query**, collez **tout** le contenu de `supabase/schema.sql`, puis cliquez **Run**.
   *(Le script peut être relancé sans risque.)*
3. Dans **Authentication → Providers → Email** :
   - **désactivez « Allow new users to sign up »** : les comptes sont créés par l'admin ou les formateurs, personne ne peut s'inscrire seul ;
   - vous pouvez désactiver « Confirm email » (les comptes créés par l'API sont déjà confirmés).
4. Dans **Authentication → URL Configuration**, mettez votre URL dans *Site URL* (ex. `http://localhost:5173` en local) pour que le lien « mot de passe oublié » fonctionne.
5. Récupérez dans **Project Settings → API** :
   - `Project URL`
   - la clé `anon public`
   - la clé `service_role` (**secrète**)

### Étape 2 : configurer et lancer l'API Node.js
```bash
cd server
cp .env.example .env      # puis remplissez SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed              # crée l'administrateur (+ démo VIGILUS si SEED_DEMO=true)
npm run dev               # API sur http://localhost:4000
```

### Étape 3 : configurer et lancer le frontend
```bash
cd frontend
cp .env.example .env      # remplissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
```

### Comptes de démonstration (si `SEED_DEMO=true`)
| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | celui de `ADMIN_EMAIL` | celui de `ADMIN_PASSWORD` |
| Formateur VIGILUS | `formateur@vigilus.demo` | `Formateur!2026` |
| Apprenants VIGILUS | `apprenant1@vigilus.demo`, `apprenant2@…`, `apprenant3@…` | `Apprenant!2026` |

La démo contient le programme **VIGILUS IMPACT** (5 modules + défis J+30, quiz et exercices) et le parcours court **Méthode C.L.E.F.**, rédigés à partir de vos supports.

> ⚠️ En production, **supprimez ou changez les mots de passe des comptes de démo**.

### Créer l'admin sans le script (alternative)
Créez un utilisateur dans **Authentication → Users → Add user**, puis dans le SQL Editor :
```sql
update public.profiles set role = 'admin', company_id = null where email = 'votre@email.com';
```

---

## 4. Utilisation au quotidien

1. **Admin** → *Entreprises* → **Nouvelle entreprise** (avec son formateur référent) → les identifiants s'affichent.
2. **Admin** peut cliquer **Ouvrir l'espace** pour gérer l'entreprise comme un formateur.
3. **Formateur** → *Cours & modules* → **Nouveau cours** → ajoutez modules et leçons → **Publier**.
4. **Formateur** → *Apprenants* → **Ajouter** ou **Importer CSV** (colonnes `email;prenom;nom;poste`, un modèle est téléchargeable) → transmettez les identifiants.
5. **Apprenant** se connecte, suit ses cours, passe les quiz et rend ses exercices.
6. **Formateur** suit tout depuis son *Tableau de bord*, corrige dans *Corrections*, exporte en CSV.

**Contenu des leçons** : écrit en Markdown (`# Titre`, `**gras**`, `- liste`, tableaux `| a | b |`, citations `>`), avec un bouton *Aperçu*.

---

## 5. Mise en production

**Option A : un seul serveur (simple)**
```bash
cd frontend && npm run build      # génère frontend/dist
cd ../server && npm start         # sert l'API ET le site sur le même port
```
Mettez `CORS_ORIGIN` sur votre domaine et laissez `VITE_API_URL` vide.

**Option B : séparé**
- Frontend sur **Vercel / Netlify** (dossier `frontend`, commande `npm run build`, sortie `dist`, et une redirection SPA de toutes les routes vers `index.html`). Définissez `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_API_URL=https://api.votre-domaine.com`.
- API sur **Render / Railway / un VPS** (dossier `server`, `npm start`). Définissez les variables de `server/.env` et `CORS_ORIGIN=https://votre-domaine.com`.

---

## 6. Sécurité

- La clé `service_role` ne doit **jamais** se trouver dans le frontend ni dans Git.
- Le rôle et l'entreprise d'un utilisateur sont stockés dans `app_metadata` et protégés par un trigger : un utilisateur ne peut pas se promouvoir lui-même.
- Un apprenant ne peut ni voir les bonnes réponses des quiz, ni se noter lui-même (trigger `protect_submission`).
- Une entreprise **suspendue** par l'admin bloque l'accès aux cours de ses apprenants.
- Un compte **désactivé** est bloqué au niveau de l'authentification Supabase.
- Le bucket `media` est public en lecture (les URL sont imprévisibles). Pour des rendus d'exercices confidentiels, créez un bucket privé et des URL signées.

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
