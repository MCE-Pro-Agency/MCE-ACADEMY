# MCE Academy

**La plateforme de formation des entreprises de MCE (Management · Communication · Event).**
*Se découvrir. S'exprimer. Agir. Progresser.*

Elle fonctionne comme Udemy ou OpenClassrooms, mais en **multi-entreprises** : chaque entreprise cliente a son propre espace avec ses cours, ses modules, ses apprenants, ses notes et ses statistiques.

---

## 1. Ce que fait la plateforme

| Rôle | Ce qu'il peut faire |
|---|---|
| **Apprenant** | Se connecte **uniquement** à l'espace de son entreprise · passe son **test de profil professionnel** (rapport avec graphiques, téléchargeable en PDF). Les pages de formation côté apprenant (cours, quiz, exercices, programme, documents) sont en cours de développement dans l'espace Formateur ; l'API les gère déjà |
| **Formateur** | Gère **uniquement** l'espace de son entreprise : apprenants (ajout, import CSV, désactivation, nouveau mot de passe), cours, modules, leçons, quiz, inscriptions, corrections notées sur 20, annonces · voit **les notes et le temps de connexion de chacun** |
| **Administrateur** | Gère **toute la plateforme** : crée les entreprises (et leur formateur référent), tous les utilisateurs et tous les rôles, ouvre l'espace de n'importe quelle entreprise, voit les statistiques globales |

**Fonctionnalités clés**
- Page d'accueil, connexion, mot de passe oublié
- 5 types de leçons : **Leçon** (Markdown), **Vidéo** (YouTube, Vimeo, MP4), **Document** (PDF intégré), **Quiz**, **Exercice**
- Quiz corrigés **côté serveur** (les bonnes réponses ne sont jamais envoyées aux apprenants)
- Exercices notés /20 avec retour du formateur, ou renvoyés « à reprendre »
- Suivi automatique du **temps de connexion** (une pulsation par minute, uniquement quand l'onglet est visible) et du temps par leçon
- Tableaux de bord avec graphiques : activité, progression par cours, meilleurs apprenants, apprenants à relancer
- Export CSV des apprenants, import CSV en masse avec identifiants générés
- Test de profil professionnel : questionnaire, rapport, PDF, vue formateur pour chaque apprenant
- Interface responsive (ordinateur, tablette, mobile)

**Charte graphique** : bleu clair `#2B9FDC` (logo), bleu foncé `#112842`, blanc, noir et une touche de **doré** `#C9A227` (certificats, distinctions). Couleurs modifiables dans `frontend/tailwind.config.js`.

---

## 2. Architecture

```
mce-academie/
├── supabase/
│   ├── schema.sql                        ← base d'origine (tables, droits RLS, fonctions)
│   ├── 002_test_profil.sql               ← test de profil + inscription avec code d'entreprise
│   └── 003_formateur_deblocage_documents.sql ← facultatif (espace Formateur)
├── server/                 ← API Node.js / Express : création des comptes et des entreprises
│   └── src/                  (clé service_role, jamais exposée au navigateur)
└── frontend/               ← React 18 + Vite + Tailwind CSS
    └── src/
        ├── pages/learner/ProfilPro.jsx   ← le test de profil (seule page de l'espace apprenant)
        ├── pages/Signup.jsx              ← inscription d'un apprenant
        ├── components/profil/            ← questionnaire, rapport, graphiques
        ├── data/profilModel.js           ← questions et calcul du test
        └── lib/db.js                     ← client Supabase (base, connexion, fichiers)
```

**Qui fait quoi ?**
- **Supabase** : base de données, connexion des utilisateurs, fichiers, et droits d'accès (RLS).
- **API Node.js** : création des comptes par le formateur ou l'admin, import CSV, gestion des entreprises.
- **Frontend React** : lit et écrit directement dans Supabase, dans la limite des droits RLS.

**Espace apprenant** : uniquement le **test de profil professionnel**. L'apprenant s'inscrit avec le code de son entreprise, se connecte et passe son test. Son formateur et l'admin voient son rapport. Les formations, modules et exercices sont développés dans l'espace Formateur.

---

## 3. Installation

### Prérequis
- **Node.js 18+**
- Un projet **Supabase**

### Étape 1 : la base Supabase
Dans Supabase > **SQL Editor**, exécuter dans l'ordre :
1. `supabase/schema.sql` (si la base est neuve)
2. `supabase/002_test_profil.sql` (test de profil et inscription)
3. `supabase/003_formateur_deblocage_documents.sql` (facultatif, pour l'espace Formateur)

### Étape 2 : l'API
```bash
cd server
cp .env.example .env      # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Project Settings > API), ADMIN_*
npm install
npm run seed              # crée l'administrateur (+ démo si SEED_DEMO=true)
npm run dev               # API sur http://localhost:4000
```

### Étape 3 : le frontend
```bash
cd frontend
cp .env.example .env      # VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (clé publique)
npm install
npm run dev               # http://localhost:5173
```

---

## 4. Faire passer le test aux apprenants

1. Le formateur (ou l'admin) ouvre **Profils professionnels** : le code et le **lien d'inscription** de l'entreprise sont en haut de la page.
2. Il envoie ce lien aux apprenants. Chacun crée son compte (`/inscription`), se connecte et arrive directement sur son test.
3. Le formateur suit qui a terminé, lit chaque rapport, ajoute ses observations et peut ouvrir une nouvelle passation.

Autre possibilité : créer les comptes depuis *Suivi des apprenants* (ajout ou import CSV), avec mot de passe temporaire.

---

## 5. Mise en production

```bash
cd frontend && npm run build      # génère frontend/dist
cd ../server && npm start         # sert l'API ET le site sur le même port
```
Mettre `CORS_ORIGIN` sur votre domaine, et dans Supabase > Authentication > URL Configuration, ajouter l'adresse du site (liens de confirmation et de mot de passe oublié).

---

## 6. Sécurité

- Les droits sont appliqués **par Supabase (RLS)** : un apprenant ne voit que son propre test, un formateur ceux de son entreprise, l'admin tout.
- À l'inscription, le rôle est **toujours « apprenant »** et l'entreprise est déterminée par le code, vérifié dans la base.
- Un apprenant ne peut ni écrire l'observation du formateur, ni se rouvrir lui-même une passation.
- La clé `service_role` reste dans `server/.env` (jamais dans Git ni dans le frontend). La clé du frontend est la clé publique.

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
