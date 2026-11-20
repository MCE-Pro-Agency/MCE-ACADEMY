// Contenu de démonstration inspiré du programme MCE Academy · VIGILUS IMPACT
// Types de leçon : text | video | quiz | exercise | document

export const demoCompany = {
  name: 'VIGILUS',
  slug: 'vigilus',
  sector: 'Commerce & services',
  contact_email: 'contact@vigilus.demo',
  max_learners: 50,
};

export const demoTrainer = {
  email: 'formateur@vigilus.demo',
  password: 'Formateur!2026',
  full_name: 'Formateur MCE',
  job_title: 'Direction pédagogique',
};

export const demoLearners = [
  { email: 'apprenant1@vigilus.demo', password: 'Apprenant!2026', full_name: 'Awa Diop', job_title: 'Commerciale terrain' },
  { email: 'apprenant2@vigilus.demo', password: 'Apprenant!2026', full_name: 'Moussa Sarr', job_title: 'Chef d’équipe support' },
  { email: 'apprenant3@vigilus.demo', password: 'Apprenant!2026', full_name: 'Fatou Ndiaye', job_title: 'Responsable relation client' },
];

const q = (question, options, correct, explanation) => ({ question, options, correct, explanation });

export const demoCourses = [
  {
    title: 'VIGILUS IMPACT — Programme professionnel',
    subtitle: 'Des compétences qui s’apprennent. Des progrès qui se voient.',
    category: 'Soft skills',
    level: 'intermediaire',
    estimated_minutes: 420,
    is_published: true,
    description: `Programme de 5 jours conçu pour **25 collaborateurs** (profils commerciaux, directions et fonctions support).

**Notre fil conducteur : comprendre, pratiquer, observer, améliorer.**

MCE Academy privilégie des apports courts et des situations vécues. Les cas métiers sont fictifs mais inspirés des réalités de la relation client, de la coordination opérationnelle, du commerce et du management.

### Ce que vous allez apprendre
- Écouter, reformuler et coopérer entre services
- Manager avec la méthode **C.L.E.F.** : Clarté · Lucidité & écoute · Équité & équilibre · Faire grandir
- Adopter une hygiène de vie et une présentation professionnelles
- Prendre la parole en public avec aisance (voix, regard, posture, stress)
- Animer des réunions qui produisent des décisions`,
    modules: [
      {
        title: 'Bienvenue dans VIGILUS IMPACT',
        description: 'Le cadre, la méthode et la progression.',
        lessons: [
          {
            title: 'Présentation du programme',
            type: 'text',
            duration_minutes: 5,
            content: `# Bienvenue 👋

Ce parcours accompagne les **5 modules** demandés par VIGILUS :

| Module | Objectif |
|---|---|
| Prise de parole | Trouver sa voix, structurer son message |
| Leadership et management | Clarifier, écouter, décider, faire progresser |
| Communication interpersonnelle | Écouter, reformuler, coopérer |
| Animation de réunions | Influencer, décider et faire avancer |
| Hygiène et propreté | Santé, présentation et habitudes professionnelles |

## Organisation
- **5 jours** du lundi au vendredi : 2 journées complètes et 3 demi-journées
- Pause quotidienne : 11h – 11h30

## Comment progresser sur la plateforme ?
1. Suivez les leçons dans l'ordre : la barre de progression avance à chaque étape.
2. Validez les **quiz** (70 % pour réussir).
3. Rendez les **exercices** : votre formateur les note et vous fait un retour.
4. Après la formation, relevez les **défis J+30**.

> *MCE — Ensemble vers la réussite.*`,
          },
          {
            title: 'La méthode C.L.E.F.',
            type: 'text',
            duration_minutes: 6,
            content: `# C.L.E.F. : les 4 gestes du manager

| Geste | En pratique |
|---|---|
| **C — Clarté** | Un résultat, une priorité, un délai |
| **L — Lucidité & écoute** | Des faits, des questions, un dialogue |
| **E — Équité & équilibre** | Un cadre juste, une posture stable |
| **F — Faire grandir** | Du soutien, des responsabilités, des progrès |

## Pourquoi cette méthode ?
Elle donne un **langage commun** à toute l'équipe. Chaque situation managériale peut être relue avec ces 4 questions :

- Ai-je été **clair** sur ce qui est attendu ?
- Me suis-je appuyé sur des **faits** et ai-je **écouté** ?
- Ma décision est-elle **juste** et comparable pour tous ?
- Est-ce que j'aide la personne à **grandir** ?`,
          },
        ],
      },
      {
        title: 'Module 1 · Communication interpersonnelle',
        description: 'Écouter, reformuler, comprendre les perceptions, coopérer et gérer un client tendu.',
        lessons: [
          {
            title: 'Écoute active et reformulation',
            type: 'text',
            duration_minutes: 10,
            content: `# Écouter, reformuler, coopérer

L'écoute active, c'est **chercher à comprendre avant de chercher à répondre**.

## Les 4 réflexes de l'écoute active
1. **Se rendre disponible** : regard, posture ouverte, pas de téléphone.
2. **Questionner** avec des questions ouvertes : *« Qu'est-ce qui s'est passé ? »*
3. **Reformuler** : *« Si je comprends bien, vous… »*
4. **Valider** : *« C'est bien cela ? »*

## Gérer un désaccord
- Séparer **les faits**, **les ressentis** et **les demandes**.
- Chercher le point d'accord minimum avant de traiter le désaccord.
- Conclure par une action concrète et partagée.`,
          },
          {
            title: 'Un objet. Plusieurs perceptions.',
            type: 'text',
            duration_minutes: 6,
            content: `# Un objet. Plusieurs perceptions.

La même réalité peut être observée depuis plusieurs angles.

> Avant de dire **« tu as tort »**, demandons : **« Qu'est-ce que tu vois que je ne vois pas ? »**

## Le jeu de l'objet
Un objet est posé au centre de la salle. Chaque participant le décrit **depuis sa place**. Les descriptions sont toutes vraies… et toutes différentes.

**Leçon :** dans une équipe, les conflits naissent souvent de perceptions différentes d'une même situation, pas d'une mauvaise volonté.`,
          },
          {
            title: 'Simulation : le client insatisfait',
            type: 'exercise',
            duration_minutes: 15,
            content: `# Exercice — Le client insatisfait

**Situation :** un client appelle, très mécontent : sa commande est arrivée avec 5 jours de retard et incomplète. Il menace de passer à la concurrence.

**Consigne :** rédigez votre réponse en 4 temps :
1. Accueillir l'émotion (une phrase)
2. Reformuler le problème
3. Proposer une solution concrète + un délai
4. Conclure et vérifier la satisfaction

*Votre formateur notera votre réponse sur 20 et vous fera un retour.*`,
          },
          {
            title: 'Quiz — Communication interpersonnelle',
            type: 'quiz',
            duration_minutes: 5,
            questions: [
              q('Quelle est la première étape de l’écoute active ?', ['Donner son avis', 'Se rendre disponible', 'Proposer une solution', 'Conclure'], 1, 'On commence par être disponible : regard, posture, attention.'),
              q('« Si je comprends bien, vous… » est un exemple de :', ['Reformulation', 'Objection', 'Conclusion', 'Jugement'], 0, 'C’est une reformulation : elle prouve qu’on a compris.'),
              q('Face à un désaccord, la bonne question est :', ['« Pourquoi tu as tort ? »', '« Qu’est-ce que tu vois que je ne vois pas ? »', '« Qui a commencé ? »', '« On en reparle plus tard ? »'], 1, 'On cherche à comprendre la perception de l’autre.'),
              q('Face à un client tendu, on commence par :', ['Lui expliquer le règlement', 'Accueillir son émotion', 'Le transférer', 'Lui proposer une remise'], 1, 'Accueillir l’émotion fait baisser la tension et permet le dialogue.'),
            ],
          },
        ],
      },
      {
        title: 'Module 2 · Leadership et management',
        description: 'Manager avec clarté et équité, déléguer, accompagner une prise de fonction.',
        lessons: [
          {
            title: 'Manager et leader : deux rôles qui se complètent',
            type: 'text',
            duration_minutes: 6,
            content: `# Manager et leader

> **Le manager** organise et sécurise l'action.
> **Le leader** donne du sens, entraîne et fait progresser.

Un bon responsable d'équipe sait passer de l'un à l'autre selon la situation :
- **Urgence / risque** → posture de manager : cadrer, répartir, contrôler.
- **Changement / démotivation** → posture de leader : expliquer le pourquoi, embarquer, encourager.`,
          },
          {
            title: 'Hier collègue, aujourd’hui manager',
            type: 'text',
            duration_minutes: 8,
            content: `# Hier collègue, aujourd'hui manager

La relation peut rester humaine, tandis que le cadre et les responsabilités doivent devenir clairs.

| Geste | Comment |
|---|---|
| **Expliquer** | Clarifier son nouveau rôle, avec simplicité |
| **Être juste** | Appliquer des critères comparables à tous |
| **Écouter** | Laisser une place aux échanges |
| **Cadrer** | Donner du feedback factuel et respectueux |`,
          },
          {
            title: '« Ce n’est pas mon travail ! »',
            type: 'text',
            duration_minutes: 6,
            content: `# « Ce n'est pas mon travail ! »

Une réponse calme et professionnelle en **trois temps** :

1. **Comprendre** — Quel est le blocage ? Que dit réellement la mission ?
2. **Clarifier** — Quelles sont les responsabilités et les priorités ?
3. **Décider** — Quelle action et quel soutien pour avancer ?

## Savoir arrêter le temps
Quand tout semble urgent, identifier **ce qui a le plus de conséquence**, **ce qui peut attendre** et **qui doit agir**.`,
          },
          {
            title: 'Cas pratique : la délégation',
            type: 'exercise',
            duration_minutes: 15,
            content: `# Exercice — Déléguer avec la méthode C.L.E.F.

Vous devez confier à un collaborateur la préparation du rapport mensuel des ventes, qu'il n'a jamais fait.

**Rédigez votre message de délégation** en faisant apparaître les 4 gestes :
- **C** : le résultat attendu, la priorité, le délai
- **L** : les questions que vous lui posez
- **E** : comment vous garantissez un cadre juste
- **F** : le soutien proposé et ce qu'il va apprendre`,
          },
          {
            title: 'Quiz — Leadership et management',
            type: 'quiz',
            duration_minutes: 5,
            questions: [
              q('Dans C.L.E.F., le « C » signifie :', ['Contrôle', 'Clarté', 'Confiance', 'Coaching'], 1, 'C = Clarté : un résultat, une priorité, un délai.'),
              q('Le « F » de C.L.E.F. correspond à :', ['Fermeté', 'Feedback', 'Faire grandir', 'Formaliser'], 2, 'F = Faire grandir : soutien, responsabilités, progrès.'),
              q('Face à « Ce n’est pas mon travail ! », la première étape est :', ['Décider', 'Sanctionner', 'Comprendre', 'Ignorer'], 2, 'Comprendre le blocage avant de clarifier puis décider.'),
              q('Le leader se distingue surtout parce qu’il :', ['Contrôle les horaires', 'Donne du sens et entraîne', 'Rédige les procédures', 'Évite les conflits'], 1, 'Le leader donne du sens, entraîne et fait progresser.'),
              q('« Être juste » après une promotion signifie :', ['Favoriser ses anciens collègues', 'Appliquer des critères comparables à tous', 'Être plus sévère', 'Ne plus parler à l’équipe'], 1, 'L’équité repose sur des critères identiques pour tous.'),
            ],
          },
        ],
      },
      {
        title: 'Module 3 · Hygiène de vie et propreté',
        description: 'Santé, présentation professionnelle, cadre de travail et bien-être.',
        lessons: [
          {
            title: 'La qualité professionnelle se voit aussi',
            type: 'text',
            duration_minutes: 8,
            content: `# La qualité professionnelle se voit aussi

Présentation, bonnes habitudes, cadre de travail propre et bien-être contribuent à la **qualité du service**.

## 4 piliers
- **Hygiène personnelle** : la première impression compte.
- **Présentation professionnelle** : tenue adaptée au contexte et à l'image de l'entreprise.
- **Propreté du cadre de travail** : bureau rangé, espaces communs respectés.
- **Santé & équilibre** : sommeil, hydratation, pauses, gestion du stress et de la fatigue.

## Gestion du stress : la respiration 4-4-4
Inspirer 4 secondes · bloquer 4 secondes · expirer 4 secondes. À répéter 4 fois avant un moment important.`,
          },
          {
            title: 'Quiz — Hygiène de vie',
            type: 'quiz',
            duration_minutes: 3,
            questions: [
              q('Un cadre de travail propre contribue surtout à :', ['La décoration', 'La qualité du service', 'Réduire les réunions', 'Rien de particulier'], 1, 'L’environnement de travail fait partie de l’image et de la qualité perçues.'),
              q('La respiration 4-4-4 sert à :', ['Gagner du temps', 'Gérer le stress', 'Mémoriser un discours', 'Parler plus fort'], 1, 'C’est une technique simple de régulation du stress.'),
              q('Lequel n’est PAS un pilier présenté ?', ['Hygiène personnelle', 'Présentation professionnelle', 'Vitesse de frappe', 'Santé & équilibre'], 2, 'La vitesse de frappe n’en fait pas partie.'),
            ],
          },
        ],
      },
      {
        title: 'Module 4 · Prise de parole en public',
        description: 'Structurer sa prise de parole, travailler la voix, le regard, la posture et le stress.',
        lessons: [
          {
            title: 'Miroir vocal : voir son évolution',
            type: 'text',
            duration_minutes: 8,
            content: `# Miroir vocal : voir son évolution

Chacun réalise un **premier passage filmé**, reçoit un retour utile, travaille un point précis, puis recommence.

## Le format de la journée vidéo
1. **Premier passage** : environ 90 secondes devant la caméra.
2. **Analyse** : clarté, voix, regard, posture, gestion du stress.
3. **Entraînement** : respiration, reformulation, confiance, sketchs et scénarios.
4. **Deuxième passage** : nouvelle prestation filmée et comparaison concrète des progrès.

## Structurer 90 secondes
- **Accroche** (10 s) : une question, un chiffre, une image.
- **Message** (60 s) : 3 idées maximum.
- **Conclusion** (20 s) : ce que l'on retient + un appel à l'action.`,
          },
          {
            title: 'Vidéo : voix, posture et regard',
            type: 'video',
            duration_minutes: 6,
            video_url: '',
            content: `Le formateur peut ajouter ici une vidéo (YouTube, Vimeo ou fichier MP4) depuis l'éditeur de cours.

**Points d'attention pendant le visionnage :**
- l'ancrage des pieds,
- le regard qui balaie l'auditoire,
- les silences volontaires.`,
          },
          {
            title: 'Exercice : mon pitch de 90 secondes',
            type: 'exercise',
            duration_minutes: 20,
            content: `# Exercice — Mon pitch de 90 secondes

Rédigez le texte de votre présentation de 90 secondes (sujet : *mon métier et ma valeur ajoutée pour le client*).

Respectez la structure **Accroche · Message (3 idées) · Conclusion**. Vous pouvez joindre l'enregistrement vidéo de votre passage.`,
          },
          {
            title: 'Quiz — Prise de parole',
            type: 'quiz',
            duration_minutes: 4,
            questions: [
              q('Combien d’idées maximum dans un message de 90 secondes ?', ['1', '3', '5', '10'], 1, 'Trois idées : c’est ce que l’auditoire retient.'),
              q('Le deuxième passage filmé sert à :', ['Remplacer le premier', 'Comparer concrètement les progrès', 'Noter les participants entre eux', 'Rien'], 1, 'On compare avant/après pour mesurer les progrès.'),
              q('Quel élément n’est PAS analysé lors du visionnage ?', ['La voix', 'Le regard', 'La marque des vêtements', 'La posture'], 2, 'On analyse clarté, voix, regard, posture et stress.'),
            ],
          },
        ],
      },
      {
        title: 'Module 5 · Animation de réunions et influence',
        description: 'Conduire une réunion productive, argumenter, traiter les objections et conclure.',
        lessons: [
          {
            title: 'Une réunion qui produit une décision',
            type: 'text',
            duration_minutes: 8,
            content: `# Une réunion qui produit une décision

Terminer **chaque réunion** en répondant à trois questions :

| | |
|---|---|
| **QUOI ?** | Qu'avons-nous décidé ? |
| **QUI ?** | Qui est responsable de l'action ? |
| **QUAND ?** | Quelle échéance avons-nous fixée ? |

## Traiter une objection en 3 temps
1. **Accueillir** : « Je comprends votre point de vue… »
2. **Questionner** : « Qu'est-ce qui vous fait dire cela ? »
3. **Répondre** avec un fait ou un exemple, puis vérifier.`,
          },
          {
            title: 'Exercice : compte rendu Quoi / Qui / Quand',
            type: 'exercise',
            duration_minutes: 10,
            content: `# Exercice — Le compte rendu express

Pensez à la dernière réunion à laquelle vous avez participé. Rédigez son compte rendu en **5 lignes maximum** avec, pour chaque décision : **Quoi / Qui / Quand**.`,
          },
          {
            title: 'Quiz — Réunions',
            type: 'quiz',
            duration_minutes: 3,
            questions: [
              q('Les 3 questions de clôture d’une réunion sont :', ['Où / Comment / Combien', 'Quoi / Qui / Quand', 'Pourquoi / Pour qui / Par où', 'Qui / Où / Comment'], 1, 'Quoi a été décidé, qui est responsable, quand est l’échéance.'),
              q('Face à une objection, on commence par :', ['Contre-attaquer', 'Accueillir', 'Changer de sujet', 'Voter'], 1, 'Accueillir l’objection désamorce la tension.'),
            ],
          },
        ],
      },
      {
        title: 'J+30 · Continuer à progresser après la salle',
        description: 'Mémos, défis et suivi : ancrer les acquis dans le quotidien.',
        lessons: [
          { title: 'J+7 · Défi d’écoute active', type: 'exercise', duration_minutes: 10, content: `# J+7 — Défi d'écoute active\n\nPendant une semaine, pratiquez **la reformulation** au moins une fois par jour.\n\n**Racontez** une situation où la reformulation a changé la suite de l'échange.` },
          { title: 'J+14 · Une action C.L.E.F.', type: 'exercise', duration_minutes: 10, content: `# J+14 — Une action C.L.E.F.\n\nChoisissez **un des 4 gestes** et appliquez-le dans une situation réelle.\n\nDécrivez : la situation, le geste choisi, ce que vous avez fait, le résultat.` },
          { title: 'J+21 · Une présentation de 90 secondes', type: 'exercise', duration_minutes: 10, content: `# J+21 — Une présentation de 90 secondes\n\nPrésentez un sujet de votre choix en 90 secondes (réunion, client, équipe). Joignez votre texte ou le lien vers votre vidéo.` },
          { title: 'J+30 · Bilan et prochain engagement', type: 'exercise', duration_minutes: 10, content: `# J+30 — Bilan et prochain engagement\n\n1. Qu'est-ce qui a le plus changé dans votre manière de travailler ?\n2. Quelle compétence voulez-vous encore développer ?\n3. Quel est votre **prochain engagement** (quoi / quand) ?\n\n*Se découvrir. S'exprimer. Agir. Progresser.*` },
        ],
      },
    ],
  },
  {
    title: 'Méthode C.L.E.F. — Les 4 gestes du manager',
    subtitle: 'Un format court pour ancrer la méthode MCE au quotidien.',
    category: 'Management',
    level: 'debutant',
    estimated_minutes: 45,
    is_published: true,
    description: `Un parcours express pour maîtriser les **4 gestes du manager** : Clarté, Lucidité & écoute, Équité & équilibre, Faire grandir.

Idéal en révision après la formation présentielle ou pour les nouveaux managers.`,
    modules: [
      {
        title: 'Les 4 gestes',
        lessons: [
          { title: 'C — Clarté', type: 'text', duration_minutes: 5, content: `# C — Clarté\n\n**Un résultat, une priorité, un délai.**\n\nAvant de confier une mission, vérifiez que vous pouvez répondre en une phrase : *« J'attends ___ pour le ___, c'est prioritaire parce que ___. »*` },
          { title: 'L — Lucidité & écoute', type: 'text', duration_minutes: 5, content: `# L — Lucidité & écoute\n\n**Des faits, des questions, un dialogue.**\n\nRemplacez les jugements (« tu es lent ») par des faits (« le dossier devait être rendu mardi, il est arrivé jeudi ») puis posez une question ouverte.` },
          { title: 'E — Équité & équilibre', type: 'text', duration_minutes: 5, content: `# E — Équité & équilibre\n\n**Un cadre juste, une posture stable.**\n\nLes mêmes règles pour tous, une humeur qui ne change pas les décisions, et des critères connus à l'avance.` },
          { title: 'F — Faire grandir', type: 'text', duration_minutes: 5, content: `# F — Faire grandir\n\n**Du soutien, des responsabilités, des progrès.**\n\nDéléguer, ce n'est pas se débarrasser : c'est confier une responsabilité **avec** le soutien nécessaire, et célébrer les progrès.` },
          {
            title: 'Quiz final C.L.E.F.',
            type: 'quiz',
            duration_minutes: 5,
            questions: [
              q('« Un résultat, une priorité, un délai » correspond à :', ['Clarté', 'Lucidité', 'Équité', 'Faire grandir'], 0, 'C’est le geste Clarté.'),
              q('« Des faits, des questions, un dialogue » correspond à :', ['Clarté', 'Lucidité & écoute', 'Équité & équilibre', 'Faire grandir'], 1, 'C’est le geste Lucidité & écoute.'),
              q('« Un cadre juste, une posture stable » correspond à :', ['Faire grandir', 'Clarté', 'Équité & équilibre', 'Lucidité'], 2, 'C’est le geste Équité & équilibre.'),
              q('« Du soutien, des responsabilités, des progrès » correspond à :', ['Faire grandir', 'Clarté', 'Équité', 'Lucidité'], 0, 'C’est le geste Faire grandir.'),
            ],
          },
        ],
      },
    ],
  },
];

export const demoAnnouncements = [
  {
    title: 'Bienvenue sur MCE Academy !',
    body: 'Votre espace de formation VIGILUS IMPACT est ouvert. Commencez par le module « Bienvenue » puis suivez les modules dans l’ordre. Bonne formation à toutes et à tous !',
  },
  {
    title: 'Journée vidéo jeudi',
    body: 'Préparez votre pitch de 90 secondes (Module 4) : premier passage filmé le matin, second passage l’après-midi.',
  },
];
