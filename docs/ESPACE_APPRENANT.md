# Espace apprenant — guide de reprise

Ce guide s'adresse à la personne qui gère l'espace apprenant de MCE Academy. Il présente l'organisation de cet espace, les tâches courantes et la préparation du passage à Supabase.

---

## 1. État actuel

**Répartition** : l'espace Apprenant ne contient plus que le **test de profil professionnel** et la page « Mon compte ». Les formations, modules, programme, mémos, documents et exercices côté apprenant sont développés par l'espace Formateur (Marie).

- À la connexion, un apprenant arrive directement sur son test. Toute autre adresse `/app/...` le renvoie vers ce test.
- Le formateur et l'admin voient le test de chaque apprenant : *Profils professionnels* et onglet *Profil professionnel* de la fiche apprenant.
- Les anciennes pages apprenant (modules, leçons, quiz, programme, documents, mémos, notes, attestation) ont été retirées. Elles restent disponibles dans l'historique Git (commit `4580c6d`, branche `espace-apprenant`) et peuvent servir de base à l'espace Formateur.
- Côté serveur, rien n'a été retiré : cours, leçons, quiz, exercices, progression et documents fonctionnent toujours par l'API. La formation **VIGILUS IMPACT** (9 modules) est en base.
- Les comptes de démonstration servent aux tests. Ils sont à supprimer avant d'inviter les vrais participants.

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@mce-academy.com | défini dans `server/.env` |
| Formateur | formateur@vigilus.demo | Formateur!2026 |
| Apprenants | apprenant1, 2 et 3 @vigilus.demo | Apprenant!2026 |

---

## 2. Les deux interrupteurs à connaître

### a) Ouverture de l'espace apprenant (par entreprise)
**Espace formateur → Programme & déblocage**, encadré du haut :

| Mode | Ce que voit l'apprenant |
|---|---|
| 🧭 **Test uniquement** | Son test de profil, et rien d'autre |
| 📚 **Espace complet** | Aujourd'hui, rien de plus côté écran (les pages de formation ont été retirées). L'API autorise alors l'apprenant à lire les cours publiés : à utiliser quand l'espace Formateur aura livré les nouvelles pages |

Le même encadré indique combien d'apprenants ont terminé leur test.
Ce réglage est enregistré dans `companies.learner_space` (`'test'` ou `'complet'`). L'apprenant doit recharger la page pour voir le changement.

### b) Déblocage des modules, jour après jour
Sur la même page, chaque module peut être **Fermé**, **Ouvert** ou programmé **À une date**. Le bouton « Ouvrir maintenant » ouvre le prochain module fermé.
Un module fermé est masqué **par le serveur** : ni leçons, ni quiz, ni téléchargements, et toute soumission est refusée. Ce réglage est enregistré dans la table `module_settings`.

> Ces deux réglages s'additionnent : en mode « test uniquement », même un module ouvert reste invisible.

---

## 3. Tâches courantes

**Inviter les participants à faire le test**
1. Espace formateur → *Suivi des apprenants* → **Importer CSV**. Colonnes acceptées : `email`, `prenom`, `nom` (ou `full_name`) et `poste`. On peut aussi utiliser **Ajouter** pour un apprenant à la fois.
2. Après l'import, le bouton doré télécharge `identifiants_apprenants.csv` (nom, email, mot de passe temporaire). Transmettre ces identifiants avec le lien de connexion.
3. Suivre l'avancement dans **Profils professionnels** : qui a terminé, qui a un test en cours, et les rapports.

**Ouvrir la formation après le test**
1. *Programme & déblocage* → **📚 Espace complet**.
2. Vérifier que seul le module du jour est ouvert, puis ouvrir les suivants chaque jour.

**Suivre un apprenant**
- *Programme & déblocage* présente une grille apprenant × module : pourcentage terminé, meilleur score au quiz, missions rendues et résultat du profil.
- Un clic sur un nom ouvre sa fiche, avec les onglets **Évolution** (graphiques et détail par module), **Profil professionnel** (rapport, observations, nouvelle passation), Notes et Connexions.
- L'admin dispose des mêmes vues : *Programme & évolution* (après avoir choisi l'entreprise), ou un clic sur un nom dans la liste *Apprenants*.

**Documents**
- Le diaporama et le livret des mémos sont déjà en place (`frontend/public/documents/`).
- *Documents* → **Déposer** permet d'ajouter un e-book individuel ou une attestation signée pour un apprenant. Le bouton 👁 rend un document visible ou le masque.
- Le rapport de profil et l'attestation de fin de formation sont générés automatiquement en PDF dans le navigateur, sans action du formateur.

**Relancer un test**
Fiche apprenant → *Profil professionnel* → « Ouvrir une nouvelle passation ». L'ancien résultat est conservé, ce qui permet de mesurer l'évolution.

---

## 4. Où se trouve quoi (code)

### Pages de l'apprenant
| Page | Route | Rôle |
|---|---|---|
| `pages/learner/ProfilPro.jsx` | `/app/mon-profil` | Test de profil et rapport |
| `pages/Profile.jsx` | `/app/profil` | Mon compte (nom, poste, photo, mot de passe) |

### Briques partagées
| Fichier | Rôle |
|---|---|
| `lib/learnerSpace.js` + `components/LearnerGate.jsx` | Mode « test uniquement » : pages autorisées et redirection |
| `components/LearnerSpaceSwitch.jsx` | L'interrupteur test / complet (formateur, admin) |
| `lib/stores.js` | Profils (`profilStore`) et déblocage des modules (`moduleStore`, `moduleLockState`) |
| `lib/pdf.js` | PDF du rapport de profil ; contient aussi les générateurs leçon, quiz, mémo et attestation, réutilisables par l'espace Formateur |
| `components/profil/` | Questionnaire, rapport et graphiques du profil |
| `data/profilModel.js` | Le test : 10 dimensions, questions, calcul des scores, textes du rapport |
| `data/ressources.js` | Les 20 mémos et les 5 thèmes |
| `data/programme.js` | Programme jour par jour ; associe un module à son jour et à son thème |
| `lib/db.js` | Client de données, écrit comme supabase-js (`db.from('table').select()…`) |

### Côté formateur et admin
`pages/trainer/Programme.jsx` (déblocage et grille), `Documents.jsx`, `LearnerDetail.jsx` (fiche apprenant, aussi utilisée par l'admin) et `pages/shared/ProfilsSuivi.jsx`.

### Contenu de la formation
- Leçons : `server/scripts/content/vigilus-impact.js`.
- Quiz et missions : les JSON du kit MCE, dans le même dossier.
- Après une modification : `cd server && npm run seed:content`. ⚠️ Cette commande remplace les cours de démo et remet leur progression à zéro, mais conserve les comptes, les profils et les documents. Une fois les vrais participants lancés, modifier plutôt depuis *Cours & modules*.

---

## 5. Qui voit quoi (règles d'accès)

| Donnée | Apprenant | Formateur | Admin |
|---|---|---|---|
| Son test de profil | ✅ lit et répond ; ne peut pas commenter ni se rouvrir un test | ✅ son entreprise : lit, commente, rouvre | ✅ tout |
| Cours, leçons, quiz | Seulement en espace complet, pour les modules ouverts | ✅ son entreprise | ✅ tout |
| Bonnes réponses des quiz | ❌ jamais (correction côté serveur) | ✅ | ✅ |
| Documents | Communs et à son nom, s'ils sont visibles et en espace complet | ✅ gestion | ✅ |
| Progression, notes | Les siennes | Son entreprise | Tout |

Ces règles sont appliquées par le serveur dans `server/src/policies.js`. Elles ne dépendent pas de l'interface.

---

## 6. Passage à Supabase

Le frontend a été écrit pour faciliter ce passage : `lib/db.js` reproduit l'interface de supabase-js. Les pages n'ont donc presque pas à changer.

| Étape | Action |
|---|---|
| 1. Base | Dans le SQL Editor : exécuter `supabase/schema.sql`, puis `supabase/002_espace_apprenant.sql`. Le second ajoute `learner_space`, `module_settings`, `profile_assessments`, `documents`, le verrouillage des modules et la fonction `module_progress`. ⚠️ Il n'a pas encore été exécuté sur Supabase : le tester d'abord sur un projet d'essai. |
| 2. Client | Remplacer le contenu de `frontend/src/lib/db.js` par `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` exporté sous le nom `db`. Garder `uploadMedia`, réécrit avec Supabase Storage. |
| 3. Fichiers | Créer un bucket **privé** `documents` pour les e-books et attestations, avec des liens signés. Aujourd'hui, les fichiers déposés (`server/uploads/`) sont accessibles à toute personne qui possède le lien. |
| 4. Comptes | La création de comptes (`server/src/services/accounts.js`) passe par l'API admin de Supabase Auth (clé `service_role`, côté serveur uniquement). |
| 5. Données | Exporter les tables MySQL vers Supabase : comptes recréés dans Auth, puis profils, tests de profil (`runs` en JSON), progression. |
| 6. Contrôle | Rejouer les vérifications : un apprenant en mode test ne voit aucun cours, un module fermé est invisible, un apprenant ne voit pas les données d'un autre. |

Correspondance MySQL → Supabase : `server/src/policies.js` devient les policies RLS, `server/src/routes/rpc.js` devient des fonctions SQL appelées par `db.rpc()`, et la table `profiles` reste liée à `auth.users`.

---

## 7. Points d'attention

- **Données personnelles** : le test de profil n'est ni un diagnostic ni un outil de classement. Les vidéos des missions sont privées (voir le guide d'intégration du kit).
- **Fin d'accès à J+30** : elle n'est pas encore automatisée. Le formateur désactive les comptes, ou repasse l'entreprise en mode test.
- **Coaching de 60 minutes** et **rappels J+7 à J+30** : ils sont annoncés dans les contenus, mais il n'existe pas encore de prise de rendez-vous ni de notification.
- **E-books** : leur dépôt est manuel, apprenant par apprenant, depuis *Documents*.

*MCE — Ensemble vers la réussite.*
