# MCE Academy — Authentification et comptes

Branche : `auth-verification-email`, créée depuis `fusion-marie-accueil`, qui réunit le travail de Marie (`main`, commit d6483e3) et la refonte de l'accueil.
Date : 25 novembre 2026.

Décisions validées par la direction le 25/11/2026 :

- Les comptes créés par l'administration ou un formateur, y compris par import, le sont **par invitation e-mail**. Aucun mot de passe n'est affiché à l'écran.
- Les **comptes déjà existants ne sont pas bloqués** : la vérification s'applique aux nouveaux comptes.
- Rôles :
  - l'administrateur gère les formateurs et les apprenants ;
  - le formateur gère les apprenants des entreprises qui lui sont attribuées.

---

## 1. Audit de l'existant

| # | Gravité | Constat | Fichier | Correction |
|---|---|---|---|---|
| 1 | Élevée | Les comptes créés par l'admin, un formateur ou l'import étaient marqués « e-mail confirmé » (`email_confirm: true`) sans action du destinataire. | `server/src/services/accounts.js` | Création par `inviteUserByEmail` : la personne confirme son adresse en ouvrant le lien. |
| 2 | Élevée | Des mots de passe provisoires étaient générés et affichés à l'écran ou exportés en CSV (`identifiants_apprenants.csv`). | `accounts.js`, `routes/users.js`, `admin/Users.jsx`, `admin/Companies.jsx`, `trainer/Learners.jsx` | Plus aucun mot de passe transmis par un tiers : invitation, ou e-mail « mot de passe oublié ». L'API ignore désormais un mot de passe envoyé par un tiers. |
| 3 | Moyenne | L'API limitait le formateur à `profiles.company_id`, alors que la base l'autorise aussi sur les entreprises de `trainer_companies` (V4). | `server/src/middleware/auth.js` | `canManageCompany` suit la même règle que la fonction SQL `is_trainer_of`. |
| 4 | Moyenne | L'inscription publique avec un code faux créait quand même un compte apprenant sans entreprise (le trigger ne refusait pas). | `supabase/002_test_profil.sql` | `supabase/005_securite_authentification.sql` refuse le compte (**à appliquer**). |
| 5 | Moyenne | Codes d'inscription courts (ex. `VIGI2026`) : la fonction publique `company_code_matches` permet de les tester à la chaîne. | `004_multi_entreprises_v4.sql`, `admin/Companies.jsx` | Saisie limitée à 10 caractères minimum dans l'admin. La requête de contrôle en fin de script 005 liste les codes à remplacer. |
| 6 | Moyenne | Connexion avec une adresse non confirmée : erreur brute, aucun moyen de recevoir un nouveau lien. | `pages/Login.jsx`, `contexts/AuthContext.jsx` | Message clair et bouton « Renvoyer le lien de confirmation », avec 60 s d'attente entre deux demandes. |
| 7 | Moyenne | Pas de page d'activation pour les invitations, et pas de message si le lien est expiré ou invalide. | `pages/ResetPassword.jsx`, `App.jsx` | Nouvelle route `/activer`. Les pages `/activer` et `/reinitialiser` expliquent quand un lien est expiré ou invalide. |
| 8 | Faible | Un utilisateur pouvait modifier son propre e-mail dans `public.profiles`, sans rapport avec son adresse de connexion. | `supabase/schema.sql` (`protect_profile_fields`) | Script 005 : champ protégé, et synchronisation automatique depuis Supabase Auth. |
| 9 | Faible | Les erreurs internes (500) renvoyaient le message technique au navigateur. | `server/src/index.js` | Masqué quand `NODE_ENV=production`. |
| 10 | Faible | Aucune limite propre aux envois d'e-mails depuis l'API. | `routes/users.js` | 30 envois par 15 min et par compte (invitation, renvoi, réinitialisation). |
| 11 | Faible | « Mot de passe oublié » indiquait implicitement si l'adresse existait. | `pages/Login.jsx` | Message neutre. |
| 12 | Information | `server/.env.example` ne listait pas `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, et proposait un mot de passe admin d'exemple et `SEED_DEMO=true`. | `server/.env.example` | Variables complétées, mot de passe vide, `SEED_DEMO=false`, nouvelle variable `APP_URL`. |

Points vérifiés sans problème :

- La clé `service_role` reste côté serveur. Le frontend n'utilise que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (clé publique).
- Aucun fichier `.env` n'est suivi par Git.
- Chaque appel à l'API vérifie le jeton (`supabaseAdmin.auth.getUser`), le profil actif et le rôle.
- Le rôle et l'entreprise viennent de `app_metadata`, que seul le serveur peut écrire. Un apprenant ne peut pas s'attribuer un rôle : le trigger `protect_profile_fields` le refuse aussi en base.
- La suppression d'une entreprise supprime toujours ses comptes non administrateurs, comme avant (`DELETE /api/companies/:id`).

## 2. Parcours retenus

**Inscription autonome (apprenant, page `/inscription`)**

1. L'apprenant choisit son entreprise et saisit son code. La base vérifie la paire avec `company_code_matches`.
2. `supabase.auth.signUp` est appelé, avec un retour vers `/login?confirme=1`.
3. Si la confirmation est activée dans Supabase, l'écran « Vérifiez votre boîte mail » s'affiche. Sans clic sur le lien, aucune session n'est ouverte.
4. Une fois le lien ouvert, la page de connexion affiche « Adresse e-mail confirmée ».
5. Si la personne essaie de se connecter avant de confirmer, un message l'explique et propose de renvoyer le lien.

**Création par l'administration ou un formateur**

1. `POST /api/users` (création unique), `POST /api/users/import` (import CSV) ou `POST /api/companies` (formateur référent) crée le compte par `inviteUserByEmail`, avec un retour vers `APP_URL/activer`.
2. Le rôle et l'entreprise sont posés côté serveur dans `app_metadata` et `public.profiles`.
3. La personne ouvre le lien : son adresse est confirmée, et elle choisit son mot de passe sur `/activer`.
4. L'administration suit les comptes dans une colonne « Statut ». Chaque statut est lu dans `auth.users` :

| Statut affiché | Signification |
|---|---|
| Invitation en attente | Invitation envoyée, lien pas encore ouvert. |
| E-mail non confirmé | Inscription autonome pas encore confirmée. |
| E-mail confirmé | Adresse confirmée, jamais connecté. |
| Compte actif | Déjà connecté au moins une fois. |
| Compte désactivé | Compte désactivé par l'administration ou le formateur. |

5. Le bouton « Renvoyer l'invitation » apparaît tant que l'adresse n'est pas confirmée (`POST /api/users/:id/invite`).

**Mot de passe oublié**

Il se demande depuis la page de connexion, ou depuis la fiche du compte par l'admin ou le formateur (`POST /api/users/:id/reset-password`). Dans les deux cas, un e-mail est envoyé, qui mène à `/reinitialiser`.

**Changement d'adresse e-mail**

Seul l'administrateur peut le faire (l'API le refuse au formateur). La nouvelle adresse est considérée comme vérifiée par l'administrateur. Voir le point ouvert n° 3.

## 3. Configuration Supabase à faire (tableau de bord)

> Je n'ai pas accès au tableau de bord Supabase. Ces réglages sont à faire par la personne qui gère le projet `loifdnwmqjlwucruqhiw`.

1. **Authentication → Sign In / Providers → Email**
   - Activer « Confirm email ».
   - Longueur minimale du mot de passe : 8.
   - Garder l'inscription publique activée : la page `/inscription` en dépend.
2. **Authentication → URL Configuration**
   - *Site URL* : l'URL de production, quand elle sera connue. Ne pas mettre d'URL fictive.
   - *Redirect URLs* : `http://localhost:5173/**`, plus l'URL de production `/**`.
3. **Authentication → SMTP Settings** : obligatoire avant d'inviter de vrais apprenants.
   - Le service d'e-mail par défaut de Supabase n'envoie qu'aux membres de l'équipe du projet, et en très petit nombre.
   - Configurer un fournisseur (Brevo, Resend, Mailjet…) avec un domaine MCE, et ses enregistrements SPF, DKIM et DMARC.
   - Relever la limite d'envoi (Authentication → Rate Limits) en fonction des imports prévus.
4. **Authentication → Email Templates**
   - Personnaliser au minimum « Confirm signup », « Invite user » et « Reset password ».
   - Modèle de texte : voir la section 7 du dossier de transmission de Marie.
   - Le bouton doit utiliser `{{ .ConfirmationURL }}`.
5. **SQL Editor** : exécuter `supabase/005_securite_authentification.sql`, puis remplacer les codes d'entreprise listés par la requête de contrôle en fin de script.
6. **Serveur** : dans `server/.env`, renseigner `APP_URL`, puis `NODE_ENV=production` en production.

## 4. Procédure pour MCE

- **Nouvel apprenant ou formateur** : Admin → Formateurs ou Apprenants → « Nouveau ». Une invitation part, et le statut passe à « Invitation en attente ».
- **Import** : Formateur → Apprenants → « Importer CSV » (colonnes `email`, `prenom`, `nom`, `poste`). Une invitation part par ligne, et les erreurs (doublons, comptes existants, envoi impossible) sont listées.
- **E-mail pas reçu** :
  1. Faire vérifier les courriers indésirables.
  2. Cliquer « Renvoyer l'invitation ».
  3. Si l'erreur « L'e-mail d'invitation n'a pas pu être envoyé » apparaît, vérifier la configuration SMTP (section 3) et les journaux : Supabase → Logs → Auth.
- **Lien expiré** : la page l'indique. Renvoyer l'invitation, ou utiliser « Mot de passe oublié ».

## 5. Recette

Seuls deux tests ont été faits :

- la compilation du frontend ;
- le démarrage de l'API, avec un refus correct (401) des routes sans connexion.

Les tests de parcours réels n'ont pas été faits : ils demandent la configuration SMTP et l'accord de MCE avant de créer des comptes de test dans la base.

| Scénario | État |
|---|---|
| Inscription, e-mail reçu, connexion refusée avant confirmation, confirmation, connexion | À tester |
| Lien expiré, puis renvoi du lien depuis la connexion | À tester |
| Mot de passe oublié (page de connexion, puis admin, puis formateur) | À tester |
| Création d'un apprenant et d'un formateur par l'admin (invitation, `/activer`, statut) | À tester |
| Import de plusieurs apprenants (doublons, compte existant, échec d'envoi) | À tester |
| Formateur avec plusieurs entreprises (`trainer_companies`) : création et gestion | À tester |
| Suppression d'un compte, puis d'une entreprise avec ses comptes | À tester |
| Comptes historiques : connexion inchangée | À tester |
| Script 005 : inscription avec un code faux refusée, invitation acceptée | À tester |

## 6. Points ouverts (décision ou action nécessaire)

1. Configurer le SMTP et les modèles d'e-mail (section 3) : c'est bloquant pour les vrais apprenants.
2. Appliquer le script 005 dans Supabase.
3. Changement d'e-mail par l'admin : faut-il plutôt envoyer un lien de confirmation à la nouvelle adresse ?
4. Le choix de l'entreprise à l'inscription affiche la liste de toutes les entreprises actives (`public_signup_companies`). Faut-il la masquer et se fier au code seul ?
5. Le script `server/scripts/seed.js` crée des comptes de démonstration aux mots de passe connus (VIGILUS). Vérifier qu'ils n'existent pas sur la base de production.
6. Supprimer le fichier inutile `scripts/installer_V6.ps1.bak`.
