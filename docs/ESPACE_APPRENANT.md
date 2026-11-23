# Espace apprenant — guide de reprise

L'espace Apprenant ne contient qu'une chose : le **test de profil professionnel**. L'apprenant s'inscrit avec le code de son entreprise, se connecte, passe son test. Le formateur et l'admin voient le rapport de chaque apprenant. Les formations, modules, programme et exercices sont développés dans l'espace Formateur.

La base est **Supabase** (projet `loifdnwmqjlwucruqhiw`). MySQL a été retiré du projet.

---

## 1. Parcours

| Étape | Qui | Où |
|---|---|---|
| 1. Récupérer le lien d'inscription de l'entreprise | Formateur ou admin | *Profils professionnels* → encadré en haut (code + « Copier le lien ») |
| 2. Créer son compte avec ce lien | Apprenant | `/inscription?code=XXXX` |
| 3. Confirmer son email (si activé dans Supabase) puis se connecter | Apprenant | `/login` |
| 4. Passer le test (25 min, enregistré à chaque réponse) | Apprenant | `/app/mon-profil` |
| 5. Lire le rapport, ajouter une observation, ouvrir une nouvelle passation | Formateur, admin | *Profils professionnels*, fiche apprenant → onglet *Profil professionnel* |

À l'inscription, la base donne **toujours le rôle « apprenant »** et rattache le compte à l'entreprise du code (trigger `handle_new_user`). Un code inconnu est refusé avant la création du compte.

Le formateur peut aussi créer les comptes lui-même (*Suivi des apprenants* → Ajouter ou Importer CSV).

---

## 2. Base de données

| Fichier | Contenu | État |
|---|---|---|
| `supabase/schema.sql` | Base d'origine : entreprises, profils, cours, quiz, progression, droits RLS | Présente sur le projet (tables vérifiées le 23/11/2026) |
| `supabase/002_test_profil.sql` | `companies.join_code`, fonction `company_for_join_code`, trigger d'inscription, table `profile_assessments` + droits | **À exécuter** (absente du projet le 23/11/2026) |
| `supabase/003_formateur_deblocage_documents.sql` | `module_settings`, `documents`, verrouillage des modules, `module_progress` | Facultatif : décision de l'espace Formateur |

### Table `profile_assessments`

| Colonne | Contenu | Qui écrit |
|---|---|---|
| `user_id` | L'apprenant (clé primaire) | — |
| `runs` | Passations terminées (JSON) : date, durée, réponses, résultat | Apprenant |
| `draft` | Test en cours | Apprenant |
| `retake` | Nouvelle passation autorisée | Formateur ou admin (l'apprenant ne peut que la remettre à `false`) |
| `comment` | Observation ajoutée au rapport | Formateur ou admin uniquement |

Lecture : l'apprenant voit son test ; le formateur, ceux de son entreprise ; l'admin, tous.

Résultat d'une passation (`runs[].result`) : `global_score`, `dimensions[]` (10 compétences : `score`, `auto_score`, `situation_score`), `strengths` (3), `priorities` (2), `axes` (5 axes de −100 à +100), `reliability`, `context`, `objective`.

---

## 3. Où se trouve quoi (code)

| Fichier | Rôle |
|---|---|
| `frontend/src/pages/Signup.jsx` | Inscription avec code d'entreprise |
| `frontend/src/pages/learner/ProfilPro.jsx` | Page du test et du rapport |
| `frontend/src/components/profil/Questionnaires.jsx` | Questionnaire en 13 étapes |
| `frontend/src/components/profil/ProfilReport.jsx`, `Charts.jsx` | Rapport et graphiques (utilisés aussi par le formateur) |
| `frontend/src/components/profil/ProfilDownload.jsx`, `lib/pdf.js` | Rapport en PDF |
| `frontend/src/data/profilModel.js` | Questions, calcul des scores, textes du rapport |
| `frontend/src/lib/stores.js` | Lecture et écriture de `profile_assessments` (`profilStore`) |
| `frontend/src/pages/shared/ProfilsSuivi.jsx` | Vue formateur / admin : tous les tests d'une entreprise |
| `frontend/src/components/JoinCodeCard.jsx` | Code et lien d'inscription (formateur, admin) |
| `frontend/src/lib/db.js` | Client Supabase |

---

## 4. Points d'attention

- **Modifier `profilModel.js`** change la lecture des passations déjà faites : augmenter `PM.version` et valider avec l'équipe.
- **Confirmation d'email** : si elle est activée dans Supabase (Authentication > Providers > Email), l'apprenant doit cliquer sur le lien avant de se connecter. Ajouter l'adresse du site dans Authentication > URL Configuration.
- **Droits de la base** : l'appel public aux tables d'origine renvoie « permission denied », ce qui est normal sans connexion. Les droits des utilisateurs connectés n'ont pas encore été vérifiés sur ce projet.
- Les comptes de démonstration (`@vigilus.demo`) sont créés par `npm run seed` si `SEED_DEMO=true` : mettre `false` en production.

*MCE — Ensemble vers la réussite.*
