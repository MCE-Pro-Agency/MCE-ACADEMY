/* =====================================================================
   VIGILUS IMPACT — contenu pédagogique complet
   Sources : MCE_CLEF_Support_Participants.pdf, MCE_Livret_20_Memos.pdf,
             quizzes_5_modules_et_J30.json, missions_et_suivi_J30.json,
             GUIDE_EQUIPE_INTEGRATION_MCE_VIGILUS.pdf
   Un module = un jour du programme (Lundi → Vendredi), puis 4 étapes de suivi
   (J+7, J+14, J+21, J+30). Chaque module contient leçons, exercices et quiz.
   Les quiz et missions sont lus dans les fichiers JSON du kit (même dossier).
   ===================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const readJson = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'));
const QUIZZES = Object.fromEntries(readJson('quizzes_5_modules_et_J30.json').quizzes.map((q) => [q.id, q]));
const MISSIONS = Object.fromEntries(readJson('missions_et_suivi_J30.json').missions.map((m) => [m.id, m]));

const q = (question, options, correct, explanation) => ({ question, options, correct, explanation });

/** Quiz du kit (+ questions complémentaires MCE) */
function quiz(id, extra = [], { title, minutes = 8, passing = 60 } = {}) {
  const src = QUIZZES[id];
  return {
    title: title || src.titre,
    type: 'quiz',
    duration_minutes: minutes,
    passing_score: passing,
    content: `${src.type === 'quiz_formatif' ? 'Quiz formatif' : 'Quiz de progression'} : il sert à vérifier vos acquis, **sans classement** entre participants. Chaque réponse est suivie d'une explication.`,
    questions: [...src.questions.map((x) => q(x.enonce, x.options, x.bonne_reponse_index, x.explication)), ...extra],
  };
}

/** Mission du kit transformée en exercice à rendre */
function mission(id, body, minutes = 15) {
  const m = MISSIONS[id];
  const fmt = { texte: 'Réponse écrite', video: 'Vidéo privée (lien ou fichier)', audio_ou_texte: 'Audio ou texte' }[m.format] || 'Réponse écrite';
  return {
    title: `Mission ${m.moment} · ${m.titre}`,
    type: 'exercise',
    duration_minutes: minutes,
    content: `# ${m.titre}

> **Consigne :** ${m.consigne}

**Format attendu :** ${fmt} · **Confidentialité :** votre réponse n'est visible que par vous et l'équipe pédagogique MCE.

${body}`,
  };
}

/* =====================================================================
   LUNDI — COMMUNICATION INTERPERSONNELLE
   ===================================================================== */
const lundi = {
  day: 'Lundi',
  title: 'Lundi · Communication interpersonnelle',
  description: 'Écouter, reformuler, coopérer. Comprendre que la même réalité se voit sous plusieurs angles.',
  lessons: [
    {
      title: 'Objectifs du jour : écouter, reformuler, coopérer',
      type: 'text',
      duration_minutes: 10,
      content: `# Communication interpersonnelle

*Des compétences qui s'apprennent. Des progrès qui se voient.*

Bienvenue dans la première journée de **VIGILUS IMPACT**. Avant de manager, d'animer ou de convaincre, il faut savoir **se comprendre**. La plupart des tensions au travail ne viennent pas d'une mauvaise volonté, mais d'informations incomplètes, de perceptions différentes ou de messages mal reçus.

## À la fin de la journée, vous saurez
- **Écouter pour comprendre** avant d'écouter pour répondre ;
- **reformuler** pour vérifier que vous avez bien compris ;
- **distinguer les faits des interprétations** dans un échange tendu ;
- **exprimer un désaccord** sans condamner la personne ;
- **coopérer entre services** en partant des faits communs.

## Le fil conducteur MCE
Toute la formation suit la même logique :

| Étape | Ce que vous faites |
|---|---|
| **Comprendre** | Un apport court, des repères simples |
| **Pratiquer** | Une situation, un jeu, une mise en situation |
| **Observer** | Ce qui a fonctionné, ce qui a bloqué |
| **Améliorer** | Une action concrète à tester dès demain |

## Comment travailler dans la plateforme aujourd'hui
1. Lisez les leçons dans l'ordre (environ 45 minutes au total).
2. Réalisez la **mission du jour** : elle est privée et lue uniquement par l'équipe MCE.
3. Terminez par le **quiz de vérification des acquis** : il n'y a ni note de classement, ni comparaison entre collègues.
4. Téléchargez les **mémos du jour** (M04, M14, M15, M18) pour les garder avec vous.

> **Question d'ouverture :** pensez à une conversation récente qui s'est mal passée. Qu'est-ce que l'autre personne voyait, que vous ne voyiez pas ?`,
    },
    {
      title: 'L’écoute active : comprendre avant de répondre',
      type: 'text',
      duration_minutes: 15,
      content: `# L'écoute active

> **Mémo M04 —** *Écouter n'est ni approuver ni renoncer à son cadre.*

Écouter activement, ce n'est pas se taire en attendant son tour de parole. C'est **chercher à comprendre** ce que l'autre vit, ce qu'il sait et ce qu'il demande, avant de chercher à répondre.

## Pourquoi c'est difficile
- Nous pensons à notre réponse pendant que l'autre parle.
- Nous interprétons très vite (« il est de mauvaise foi », « elle ne fait pas d'effort »).
- Nous voulons régler le problème avant même de l'avoir compris.

## Les 4 réflexes de l'écoute active
1. **Se rendre disponible** : regard, posture ouverte, téléphone retourné. Si ce n'est pas le moment, dites-le et proposez un créneau.
2. **Laisser exposer** les faits *et* le ressenti, sans interrompre.
3. **Reformuler** : *« Si je comprends bien, la difficulté principale est… »*
4. **Explorer et conclure** : *« Qu'est-ce qui te manque pour avancer ? »* puis convenir d'une suite concrète.

## La reformulation, mode d'emploi
La reformulation **n'est pas une répétition mot à mot**. Elle reprend l'essentiel avec vos mots :

| La personne dit | Vous reformulez |
|---|---|
| « Ça fait trois fois que j'appelle et personne ne me rappelle ! » | « Vous avez appelé trois fois sans retour, et vous avez besoin d'une réponse aujourd'hui. C'est bien ça ? » |
| « Je n'y arrive pas avec ce nouveau logiciel. » | « Si je comprends bien, c'est l'outil qui te bloque, pas la tâche elle-même ? » |

Terminez toujours par une **question de validation** (« C'est bien cela ? »). Si la personne corrige, tant mieux : vous venez d'éviter un malentendu.

## Faits, ressentis, demandes
Dans un échange tendu, séparez trois niveaux :
- **Les faits** : ce qui s'est passé, observable (« la livraison est arrivée le 12 au lieu du 7 ») ;
- **Les ressentis** : ce que la personne vit (« je suis exaspéré ») ;
- **Les demandes** : ce qu'elle attend (« je veux une solution avant vendredi »).

On accueille le ressenti, on vérifie les faits, on répond à la demande.

## Exemple VIGILUS (fictif)
Un commercial semble résistant à un nouveau processus. En l'écoutant vraiment, son responsable découvre qu'il n'a **pas accès à l'outil** depuis le terrain. Le problème n'était pas l'engagement, mais l'équipement.

> **Question à se poser :** ai-je recherché la cause ou seulement corrigé le symptôme ?

**À tester demain :** faire une reformulation complète avant de répondre, au moins une fois dans la journée.`,
    },
    {
      title: 'Un objet. Plusieurs perceptions.',
      type: 'text',
      duration_minutes: 12,
      content: `# Un objet. Plusieurs perceptions.

> **Mémo M14 —** *Nous observons parfois le même objet sans en voir la même face.*

La même réalité peut être observée depuis plusieurs angles. Avant de dire **« tu as tort »**, demandons : **« Qu'est-ce que tu vois que je ne vois pas ? »**

## L'atelier de l'objet sur la table
1. Un objet asymétrique est posé au milieu de la table. On ne le retourne pas.
2. Deux personnes placées face à face décrivent **uniquement ce qu'elles observent**, sans interpréter.
3. Les descriptions sont toutes vraies… et pourtant différentes.
4. On tourne l'objet : qu'est-ce qui a changé dans votre vision ? Qu'est-ce qui était déjà vrai ?

**Ce que l'atelier enseigne :** dans une équipe, les désaccords naissent souvent de **positions différentes** face à une même situation. Le service commercial voit le client et ses délais ; l'exploitation voit les risques techniques ; la direction voit les coûts. Chacun a une partie de la réalité.

## De la perception aux faits communs
Quand deux services s'opposent :
1. **Rétablir les faits communs** : qu'est-ce que nous savons tous les deux avec certitude ?
2. **Nommer les angles** : « De ton côté, tu vois… ; du mien, je vois… »
3. **Choisir des critères partagés** : qualité, sécurité, délai, satisfaction client, responsabilité.
4. **Décider** sur la base de ces critères, et non sur la base de qui parle le plus fort.

## Exemple VIGILUS (fictif)
Un service parle de « retard client », l'autre de « risque technique ». En posant les faits sur la table (date promise, état réel du matériel, impact sur le client), les deux équipes découvrent qu'elles défendent le même objectif : **un client satisfait et une intervention sûre**.

## Exercice mental
Pensez à un désaccord récent. Écrivez :
- trois faits observables que vous partagez avec l'autre personne ;
- ce que l'autre voyait depuis sa place ;
- ce qui aurait pu faire évoluer votre propre point de vue.

**À tester demain :** dans un désaccord, demander trois faits observables avant de conclure.`,
    },
    {
      title: 'Exprimer un désaccord sans condamner',
      type: 'text',
      duration_minutes: 12,
      content: `# Exprimer un désaccord sans condamner

> **Mémo M15 —** *Comprendre une perception ne signifie pas que toutes les décisions se valent.*

Écouter ne veut pas dire tout accepter. Un professionnel sait **dire non**, **contester une décision** ou **signaler un risque**, sans attaquer la personne.

## La méthode en trois temps
1. **Dire ce que l'on voit** : *« De mon côté, le risque principal est… »*
2. **Demander ce que l'autre sait** : *« Quelles informations te conduisent à cette conclusion ? »*
3. **Comparer les critères communs** : qualité, sécurité, délai, client, responsabilité.

## Le message en « je » (inspiration Jacques Salomé — mémo M18)
Les reproches en « tu » (« tu ne m'écoutes jamais ») déclenchent la défense. Le message en « je » décrit **un fait, ce que je vis et une demande** :

| Au lieu de… | Dites plutôt… |
|---|---|
| « Tu ne m'écoutes jamais. » | « Lorsque je suis interrompu, je n'arrive pas à terminer ; pouvons-nous convenir d'un tour de parole ? » |
| « Ton rapport est nul. » | « Il me manque les chiffres de mars pour valider ; peux-tu les ajouter avant jeudi ? » |
| « Vous êtes toujours en retard. » | « Les trois dernières livraisons sont arrivées après la date annoncée ; j'ai besoin qu'on trouve une solution ensemble. » |

> « J'ai besoin que mon point de vue soit entendu, même s'il n'est pas toujours retenu. » — Jacques Salomé (site officiel, *Charte de vie au travail*).

## Le client contrarié : un cas particulier
Face à un client mécontent, l'ordre compte :
1. **Accueillir l'émotion** : « Je comprends que ce retard vous pose un vrai problème. »
2. **Reformuler les faits** : « Si je résume : commande livrée avec cinq jours de retard et incomplète. »
3. **Proposer une solution réaliste** avec un délai, sans promesse impossible.
4. **Vérifier** : « Est-ce que cette solution vous convient ? »

On ne lui oppose pas immédiatement le contrat, et on ne lui promet pas une solution qu'on ne pourra pas tenir.

**À tester demain :** remplacer « tu as tort » par « montrons nos critères ».`,
    },
    mission(
      'D01',
      `## Pour vous aider
Repensez à l'atelier de l'objet sur la table, ou à une situation réelle (anonymisée) où deux personnes voyaient les choses différemment.

Rédigez **trois phrases** :
1. Ce que je voyais de ma place ;
2. ce que l'autre voyait de la sienne ;
3. ce qui change quand j'écoute sa perspective.

*Exemple : « Je voyais un collègue qui refusait d'aider. Lui voyait une file de clients qu'il ne pouvait pas quitter. En l'écoutant, j'ai compris qu'il fallait d'abord organiser le relais. »*`,
      10
    ),
    {
      title: 'Mise en situation : le client insatisfait',
      type: 'exercise',
      duration_minutes: 15,
      content: `# Mise en situation — le client insatisfait

**Situation (fictive) :** un client appelle, très mécontent. Sa commande est arrivée avec **cinq jours de retard** et **incomplète**. Il menace de passer à la concurrence.

## Consigne
Rédigez votre réponse en **quatre temps** :
1. **Accueillir l'émotion** (une phrase) ;
2. **Reformuler** le problème avec vos mots ;
3. **Proposer** une solution concrète et un délai réaliste ;
4. **Conclure** en vérifiant que la solution lui convient.

## Critères d'évaluation (sur 20)
- L'émotion est accueillie sans se justifier (4 pts)
- La reformulation est fidèle et vérifiée (5 pts)
- La solution est concrète, datée et tenable (6 pts)
- La conclusion vérifie l'accord du client (3 pts)
- Le ton reste professionnel et respectueux (2 pts)

*Votre formateur vous fera un retour personnalisé.*`,
    },
    quiz('QUIZ_COMM', [
      q('« Si je comprends bien, vous… » est un exemple de :', ['Reformulation', 'Objection', 'Jugement', 'Conclusion'], 0, 'La reformulation prouve que l’on a compris et permet à l’autre de corriger.'),
      q('Dans un échange tendu, on sépare :', ['Les faits, les ressentis et les demandes', 'Les gagnants et les perdants', 'Le passé et le futur uniquement'], 0, 'Accueillir le ressenti, vérifier les faits, répondre à la demande.'),
      q('Quel message respecte la personne tout en exprimant un désaccord ?', ['« Tu ne m’écoutes jamais. »', '« Lorsque je suis interrompu, je n’arrive pas à terminer ; pouvons-nous convenir d’un tour de parole ? »', '« Laisse tomber, ce n’est pas grave. »'], 1, 'Le message en « je » décrit un fait, un vécu et une demande, sans accuser.'),
    ]),
  ],
};

/* =====================================================================
   MARDI — LEADERSHIP ET MANAGEMENT
   ===================================================================== */
const mardi = {
  day: 'Mardi',
  title: 'Mardi · Leadership et management',
  description: 'Clarifier, écouter, décider, faire progresser : la méthode MCE C.L.E.F.',
  lessons: [
    {
      title: 'Manager et leader : deux rôles qui se complètent',
      type: 'text',
      duration_minutes: 12,
      content: `# Manager et leader : deux rôles qui se complètent

> **Mémo M01 —** *Le manager rend l'action fiable ; le leader rend la direction désirable.*

## Objectifs du jour
- Distinguer **manager** et **leader**, et savoir passer de l'un à l'autre ;
- appliquer les **4 gestes C.L.E.F.** au quotidien ;
- réussir le passage de **collègue à manager** ;
- répondre calmement à **« ce n'est pas mon travail »** ;
- savoir **arrêter le temps** quand tout semble urgent.

## Deux rôles, une même personne

| Le manager… | Le leader… |
|---|---|
| fixe les objectifs | transmet le sens |
| organise les moyens | inspire confiance |
| suit les engagements | accompagne le changement |
| sécurise les résultats | mobilise les énergies |

Un excellent responsable sait faire **les deux** : organiser *et* entraîner. Une équipe très bien organisée mais sans sens s'épuise ; une équipe très motivée mais sans organisation se disperse.

## Diriger : vision, arbitrage, exécution (mémo M10)
Pour les directions, une vision vaut par **les décisions concrètes qu'elle rend possibles** :
- **Vision** : expliciter une destination compréhensible par tous ;
- **Arbitrage** : choisir, donc renoncer à certaines options ;
- **Exécution** : traduire la vision en priorités, responsables et échéances.

## Meilleur vendeur ≠ meilleur manager (mémo M11)
Devenir manager, c'est passer de **« vendre plus »** à **« faire mieux vendre l'équipe »**. Les compétences qui font un excellent commercial (énergie, réactivité, sens du client) ne suffisent pas : il faut apprendre à transmettre, à déléguer, à observer et à faire progresser.

## Exemple VIGILUS (fictif)
Une équipe atteint ses objectifs mais ne comprend plus pourquoi elle se mobilise. Le responsable remet du sens (à quoi servent nos chiffres pour le client ?) **sans abandonner le suivi** des engagements.

> **Question à se poser :** dans mes pratiques, qu'est-ce que j'organise bien ? Qu'est-ce que j'inspire ?

**À tester demain :** donner un objectif clair et expliquer sa contribution à la mission.`,
    },
    {
      title: 'La méthode MCE C.L.E.F. : les 4 gestes du manager',
      type: 'text',
      duration_minutes: 18,
      content: `# La méthode MCE C.L.E.F.

> **Mémo M02 —** *Quatre gestes qui ouvrent les portes de l'autonomie.*

| Lettre | Geste | En pratique |
|---|---|---|
| **C** | **Clarté** | Un résultat, une priorité, un délai |
| **L** | **Lucidité & écoute** | Des faits, des questions, un dialogue |
| **E** | **Équité & équilibre** | Un cadre juste, une posture stable |
| **F** | **Faire grandir** | Du soutien, des responsabilités, des progrès |

Avant chaque décision importante, passez mentalement par les quatre lettres.

## C — La clarté n'est pas une option (M03)
*Ce qui n'est pas clairement attendu ne peut pas être évalué justement.*
- Formuler un **résultat observable** : quoi, pour quand, avec quel niveau de qualité.
- Expliquer **pourquoi** la mission compte et **qui décide quoi**.
- Vérifier la compréhension : *« Comment vas-tu t'y prendre ? »* plutôt que *« C'est compris ? »*

**Exemple :** « Fais le suivi client rapidement » devient « Contacte ces trois clients avant 16 h, puis consigne le résultat dans le CRM ».

## L — Lucidité & écoute (M04, M12)
*Une étiquette ferme le dialogue ; une observation permet l'action.*
- Partir des **faits** : « Depuis deux semaines, les rapports arrivent le lundi au lieu du vendredi. »
- Poser des **questions ouvertes** : « Qu'est-ce qui a changé pour toi ? »
- Éviter les étiquettes (« il est démotivé ») qui enferment la personne.

## E — Équité & équilibre (M05)
*La constance ne veut pas dire sourire chaque jour ; elle veut dire rester prévisible et juste.*
- Annoncer les règles **avant** de les appliquer, et les appliquer **à tous**.
- Garder une posture émotionnelle stable, même sous pression.
- Expliquer ses décisions, surtout quand elles déçoivent.

## F — Faire grandir (M06, M13)
*Un manager ne brille pas à la place de son équipe. Il lui donne les moyens de briller.*
- **Déléguer** une mission avec le résultat attendu, les moyens et un point de suivi.
- **Reconnaître** les progrès, précisément et publiquement quand c'est approprié.
- Aider à passer de **« je ne sais pas »** à **« j'apprends »** : une compétence s'apprend, une limite n'est pas toujours une identité.

## Votre point fort, votre point à muscler
> **Question à se poser :** quel pilier est mon point fort ? Lequel dois-je muscler ?

**À tester demain :** choisir une lettre de C.L.E.F. et l'appliquer pendant sept jours.`,
    },
    {
      title: 'Hier collègue, aujourd’hui manager',
      type: 'text',
      duration_minutes: 12,
      content: `# Hier collègue, aujourd'hui manager

> **Mémo M07 —** *Garder le respect, changer la responsabilité.*

La relation peut rester humaine, tandis que **le cadre et les responsabilités doivent devenir clairs**.

## Les quatre gestes de la transition

| Geste | Ce que cela veut dire |
|---|---|
| **Expliquer** | Clarifier son nouveau rôle, avec simplicité |
| **Être juste** | Appliquer des critères comparables à tous |
| **Écouter** | Laisser une place aux échanges et aux inquiétudes |
| **Cadrer** | Donner du feedback factuel et respectueux |

## Les pièges à éviter
- **Changer brusquement d'attitude** : devenir distant ou autoritaire du jour au lendemain.
- **Favoriser ses amis** : un traitement différent détruit la confiance de toute l'équipe.
- **Ne rien dire** en espérant que « ça se fera tout seul ».

## Une première réunion d'équipe réussie
1. Dire clairement **ce qui change** : vous êtes responsable des décisions, des priorités et du suivi.
2. Dire **ce qui ne change pas** : le respect, l'écoute, l'envie de travailler ensemble.
3. Annoncer **les règles du jeu** : comment vous allez fixer les objectifs, suivre et faire des retours.
4. **Écouter** : « Qu'attendez-vous de moi dans ce rôle ? »

## Exemple VIGILUS (fictif)
Aminata devient cheffe d'équipe de ses anciens collègues. Elle organise un entretien individuel avec chacun : « Notre relation reste la même, ma responsabilité change. J'appliquerai les mêmes critères à tous, toi compris. » Un ancien ami teste la règle en arrivant en retard : elle lui fait le même retour qu'aux autres, en privé et calmement.

**À tester demain :** préparer la phrase qui explique votre rôle en une minute.`,
    },
    {
      title: '« Ce n’est pas mon travail ! » et savoir arrêter le temps',
      type: 'text',
      duration_minutes: 12,
      content: `# Deux situations réelles

## 1. « Ce n'est pas mon travail ! » (mémo M08)
*Ne pas culpabiliser ; clarifier la mission et construire la coopération.*

Une réponse calme et professionnelle en **trois temps** :

| Étape | Question à poser |
|---|---|
| **1. Comprendre** | Quel est le blocage ? Que dit réellement la mission ? |
| **2. Clarifier** | Quelles sont les responsabilités et les priorités ? |
| **3. Décider** | Quelle action et quel soutien pour avancer ? |

**Exemple de dialogue :**
- *Collaborateur :* « Ce n'est pas mon travail de rappeler ce client. »
- *Manager :* « D'accord, aide-moi à comprendre : qu'est-ce qui te fait dire ça ? »
- *Collaborateur :* « Je suis déjà sur trois dossiers urgents. »
- *Manager :* « Je comprends. Le rappel client fait bien partie de la fiche de poste ; regardons ensemble lequel de tes dossiers peut attendre demain. »

On évite de **sanctionner sans écouter** et de **faire la tâche à sa place**.

## 2. Savoir « arrêter le temps » (mémo M09)
*Prendre deux minutes pour choisir vaut mieux que disperser toute une journée.*

Quand tout semble urgent, posez-vous trois questions :
1. **Qu'est-ce qui a le plus de conséquences** si ce n'est pas fait aujourd'hui ?
2. **Qu'est-ce qui peut attendre**, et jusqu'à quand ?
3. **Qui doit agir** ? Moi, un membre de l'équipe, un autre service ?

| | Important | Moins important |
|---|---|---|
| **Urgent** | Je fais maintenant | Je délègue |
| **Moins urgent** | Je planifie | Je supprime ou je reporte |

## Le feedback factuel (mémo M12)
« Il est démotivé » est une étiquette. « Depuis deux semaines, il ne participe plus aux réunions » est un **fait**. Commencez toujours par le fait, puis demandez : *« Qu'est-ce qui a changé pour toi ? »*

**À tester demain :** commencer la journée par deux minutes d'« arrêt du temps » pour choisir trois priorités.`,
    },
    mission(
      'D02',
      `## Pour vous aider
Choisissez une **mission réelle** que vous confiez (ou qu'on vous confie) cette semaine, et appliquez les quatre lettres :

- **C — Clarté :** quel est le résultat attendu, pour quand, avec quel niveau de qualité ?
- **L — Lucidité & écoute :** quelle question allez-vous poser pour comprendre le point de vue de la personne ?
- **E — Équité :** quel critère rend cette décision juste par rapport au reste de l'équipe ?
- **F — Faire grandir :** quel appui proposez-vous (moyens, temps, point de suivi) ?

*Quatre phrases suffisent, une par lettre.*`
    ),
    {
      title: 'Cas pratique : réussir une délégation',
      type: 'exercise',
      duration_minutes: 15,
      content: `# Cas pratique — la délégation

**Situation (fictive) :** vous devez confier à un collaborateur la préparation du rapport mensuel des ventes, que vous faisiez vous-même jusqu'ici. Il ne l'a jamais fait.

## Consigne
Rédigez le message (ou le déroulé de l'entretien) par lequel vous lui confiez cette mission. Il doit contenir :
1. Le **résultat attendu** et l'échéance ;
2. **Pourquoi** ce rapport est important ;
3. Les **moyens** et l'aide que vous apportez ;
4. Le **point de suivi** prévu ;
5. Une **question** qui vérifie sa compréhension.

*Votre formateur notera votre proposition sur 20.*`,
    },
    quiz('QUIZ_LEAD', [
      q('Que signifie la lettre E de C.L.E.F. ?', ['Exigence', 'Équité & équilibre', 'Efficacité', 'Énergie'], 1, 'E = Équité & équilibre : un cadre juste et une posture stable.'),
      q('Quelle formulation est la plus claire ?', ['« Fais le suivi client rapidement. »', '« Contacte ces trois clients avant 16 h, puis consigne le résultat dans le CRM. »', '« Occupe-toi des clients quand tu peux. »'], 1, 'Un résultat observable, un délai, un livrable.'),
      q('Quand tout semble urgent, le premier réflexe est de…', ['Tout faire soi-même', 'Prendre deux minutes pour choisir ce qui a le plus de conséquences', 'Répondre au plus pressant au téléphone'], 1, 'Savoir « arrêter le temps » évite de disperser toute une journée.'),
    ]),
  ],
};

/* =====================================================================
   MERCREDI — HYGIÈNE DE VIE ET PROPRETÉ
   ===================================================================== */
const mercredi = {
  day: 'Mercredi',
  title: 'Mercredi · Hygiène de vie et propreté (hommes et femmes)',
  description: 'Santé, présentation et habitudes professionnelles : la qualité professionnelle se voit aussi.',
  lessons: [
    {
      title: 'La qualité professionnelle se voit aussi',
      type: 'text',
      duration_minutes: 12,
      content: `# La qualité professionnelle se voit aussi

> **Mémo M19 —** *Soigner le cadre et sa santé soutient la confiance, sans juger les personnes.*

La présentation, les bonnes habitudes, un cadre de travail propre et le bien-être contribuent directement à **la qualité du service**. Le client, le partenaire ou le collègue perçoit notre professionnalisme bien avant d'entendre nos arguments.

## Objectifs du jour
- Comprendre le lien entre **hygiène, présentation et confiance** ;
- adapter sa tenue et ses gestes **au poste et aux consignes** de l'entreprise ;
- prévenir la **fatigue** et prendre soin de sa santé au travail ;
- aborder ces sujets **avec respect**, sans jugement ni moquerie.

## Un principe essentiel : le respect
Ce module ne juge **personne**. Les situations personnelles (santé, moyens, contraintes familiales, conditions de transport) sont différentes pour chacun. On parle de **standards professionnels**, de **solutions concrètes** et de **soutien**, jamais de critiques individuelles.

## Les trois dimensions
| Dimension | Exemples |
|---|---|
| **Présentation** | Tenue adaptée au poste, propreté, badge visible, posture |
| **Hygiène** | Gestes d'hygiène, espace de travail propre, gestion des repas |
| **Bien-être** | Sommeil, hydratation, pauses, gestion de la fatigue et du stress |

> **Question à se poser :** quelles routines simples rendent nos journées plus professionnelles et plus sereines ?`,
    },
    {
      title: 'Présentation et hygiène professionnelles (hommes et femmes)',
      type: 'text',
      duration_minutes: 15,
      content: `# Présentation et hygiène professionnelles

## Une tenue adaptée au poste
La bonne tenue n'est pas la plus chère : c'est celle qui est **adaptée à la fonction**, **propre** et **conforme aux consignes** de l'entreprise.
- **Fonctions en contact client** : tenue soignée, cohérente avec l'image de l'entreprise, badge ou signe d'identification visible.
- **Fonctions terrain et techniques** : tenue de sécurité, équipements de protection, chaussures adaptées.
- **Fonctions de bureau** : tenue correcte et confortable, adaptée aux réunions prévues dans la journée.

## Les repères d'hygiène, pour toutes et tous
- **Mains** : lavage régulier, surtout avant les repas et après les déplacements.
- **Hygiène corporelle** quotidienne, adaptée à la chaleur et à l'activité physique du poste.
- **Haleine** : attention particulière lors des échanges rapprochés avec les clients.
- **Parfums** : discrets, pour respecter les collègues sensibles.
- **Tenue de rechange** pour les postes physiques ou par forte chaleur, quand c'est possible.

## Le cadre de travail
Un espace propre et rangé est aussi un message :
- bureau dégagé en fin de journée, documents confidentiels rangés ;
- espaces communs (cuisine, salle de pause, sanitaires) laissés tels qu'on aimerait les trouver ;
- véhicules de service propres et entretenus.

## Le cas d'un collaborateur en difficulté
Si un collaborateur signale une difficulté de tenue liée à son poste (chaleur, coût, contraintes), on **cherche une solution compatible** avec le métier et les conditions réelles. On ne fait jamais de remarque en public.

## Comment en parler à quelqu'un
1. **En privé**, au bon moment ;
2. avec **des faits** et sans jugement : « Plusieurs clients ont remarqué… » ;
3. en rappelant **le cadre** commun ;
4. en proposant **une solution** ou un soutien.

**À tester demain :** vérifier sa tenue et son espace de travail avec le regard d'un client qui vous rencontre pour la première fois.`,
    },
    {
      title: 'Hygiène de vie : énergie, fatigue et récupération',
      type: 'text',
      duration_minutes: 12,
      content: `# Hygiène de vie : énergie, fatigue et récupération

Notre énergie est une **ressource professionnelle**. Une fatigue persistante dégrade l'écoute, la patience, la concentration et la sécurité.

## Les cinq leviers simples
| Levier | Habitude à tester |
|---|---|
| **Sommeil** | Heure de coucher régulière, écrans coupés 30 minutes avant |
| **Hydratation** | Une bouteille d'eau à portée de main, surtout par forte chaleur |
| **Alimentation** | Un vrai repas à midi, des en-cas simples plutôt que du sucre |
| **Pauses** | Une courte pause toutes les 90 minutes, même de 3 minutes |
| **Mouvement** | Marcher, s'étirer, changer de position régulièrement |

## Fatigue persistante : que faire ?
- **Ne pas faire comme si de rien n'était** : la fatigue accumulée finit par se voir.
- **Signaler la difficulté** à son responsable ou aux personnes compétentes.
- **Rechercher des solutions adaptées** : organisation, horaires, charge, appui médical si nécessaire.

## Le rôle du manager
Le manager ne juge pas la vie personnelle, mais il :
- **observe les signaux** (erreurs inhabituelles, retards, irritabilité) ;
- **ouvre le dialogue** avec un fait et une question bienveillante ;
- **adapte l'organisation** quand c'est possible ;
- **oriente** vers les bonnes ressources.

## Sensibiliser une équipe
On privilégie toujours **un message respectueux et un cadre clair**, jamais la moquerie ni les commentaires personnels. Une affiche, une règle partagée, un rappel collectif valent mieux qu'une remarque humiliante.

**À tester demain :** choisir une habitude de récupération ou d'organisation à tester pendant une semaine.`,
    },
    mission(
      'D03',
      `## Pour vous aider
Choisissez **une seule habitude**, réaliste, que vous pouvez tester dès cette semaine. Elle peut concerner :
- votre **présentation** (tenue, préparation de la veille…) ;
- votre **hygiène** ou celle de votre espace de travail ;
- votre **bien-être** (sommeil, hydratation, pauses…).

Répondez en trois points :
1. L'habitude que je souhaite améliorer ;
2. pourquoi elle compte pour mon travail ;
3. comment je saurai, dans sept jours, que j'ai progressé.

*Votre réponse reste strictement confidentielle.*`,
      10
    ),
    quiz('QUIZ_HYGIENE', [
      q('Comment aborder une question d’hygiène avec un collègue ?', ['En public, pour que tout le monde comprenne', 'En privé, avec des faits, le rappel du cadre et une solution', 'Par une plaisanterie devant l’équipe'], 1, 'Respect, discrétion et solution concrète.'),
      q('Quel levier aide le plus à maintenir l’énergie par forte chaleur ?', ['Sauter le repas de midi', 'S’hydrater régulièrement', 'Enchaîner sans pause'], 1, 'L’hydratation est un levier simple et essentiel.'),
    ]),
  ],
};

/* =====================================================================
   JEUDI — PRISE DE PAROLE EN PUBLIC
   ===================================================================== */
const jeudi = {
  day: 'Jeudi',
  title: 'Jeudi · Prise de parole en public',
  description: 'Trouver sa voix, structurer son message. Miroir Vocal : deux passages filmés pour voir son évolution.',
  lessons: [
    {
      title: 'Miroir Vocal : voir son évolution',
      type: 'text',
      duration_minutes: 10,
      content: `# Miroir Vocal : voir son évolution

Chacun réalise **un premier passage filmé**, reçoit **un retour utile**, travaille **un point précis**, puis **recommence**. L'objectif n'est pas d'être parfait : c'est de **voir son propre progrès**.

## Objectifs du jour
- Structurer un message clair en **90 secondes** ;
- maîtriser **la voix, le regard et la posture** ;
- apprivoiser **le trac** ;
- recevoir et utiliser **un feedback** concret.

## Le déroulé de la journée
| Moment | Activité |
|---|---|
| Matin | Apports : structure du message, voix, posture, trac |
| Fin de matinée | **Passage 1** filmé (90 secondes) |
| Début d'après-midi | Feedback individuel : **un seul axe** de travail |
| Après-midi | Entraînement ciblé |
| Fin de journée | **Passage 2** filmé, sur le même sujet |

## Confidentialité des vidéos
Vos deux enregistrements sont **privés** : ils sont reliés à votre compte, visibles uniquement par vous et l'équipe pédagogique MCE, et ne sont **jamais** utilisés comme support de communication sans autorisation. Ils ne servent pas à classer les participants.`,
    },
    {
      title: 'Structurer un message en 90 secondes',
      type: 'text',
      duration_minutes: 15,
      content: `# Structurer un message en 90 secondes

Avant de parler, la question la plus importante est : **quel est mon message clé ?** Si vous ne pouvez pas le dire en une phrase, votre public ne pourra pas le retenir.

## La structure en trois temps
| Temps | Durée | Contenu |
|---|---|---|
| **Accroche** | 15 s | Le besoin du public, une question, un fait marquant |
| **Idée centrale + exemple** | 60 s | Une seule idée, illustrée par un exemple concret |
| **Conclusion** | 15 s | Ce que le public doit retenir ou faire |

## Exemple (fictif) : présenter un service en 90 secondes
- **Accroche :** « Combien de temps perdez-vous chaque semaine à relancer vos fournisseurs ? »
- **Idée centrale :** « Notre service centralise les suivis de commandes en un seul tableau. »
- **Exemple :** « Une agence de Thiès a ainsi réduit ses relances de moitié en un mois. »
- **Conclusion :** « Je vous propose une démonstration de 15 minutes cette semaine. »

## Les erreurs fréquentes
- Commencer par **une longue liste de détails** ;
- vouloir tout dire : **trois idées, c'est déjà deux de trop** en 90 secondes ;
- conclure par « voilà, c'est tout » au lieu d'un message clair.

## Préparer sans réciter
Ne rédigez pas un texte à apprendre par cœur. Préparez :
1. votre **phrase d'accroche** (mot pour mot) ;
2. votre **idée centrale** et votre **exemple** (en mots-clés) ;
3. votre **phrase de conclusion** (mot pour mot).

**À tester demain :** présenter une idée de votre activité en une phrase, puis en 90 secondes.`,
    },
    {
      title: 'Voix, regard, posture et gestion du trac',
      type: 'text',
      duration_minutes: 15,
      content: `# Voix, regard, posture et trac

## La voix
- **Le rythme** : ralentissez légèrement. Sous stress, on accélère sans s'en rendre compte.
- **Les pauses** : une pause de deux secondes après une idée importante lui donne du poids.
- **Le volume** : parlez pour la personne la plus éloignée de la salle.
- **L'articulation** : terminez vos phrases, ne laissez pas la voix tomber.

## Le regard
- Regardez **les personnes**, pas vos notes ni le plafond.
- Face caméra : regardez **l'objectif**, comme si c'était une personne.
- En salle : balayez lentement le public, une phrase par personne.

## La posture
- **Ancrage** : les deux pieds au sol, à la largeur des épaules.
- **Mains visibles**, gestes ouverts et naturels.
- Évitez de vous balancer, de croiser les bras ou de jouer avec un stylo.

## Apprivoiser le trac
Le trac est **normal** : c'est de l'énergie. On ne cherche pas à le supprimer, mais à le canaliser.
1. **Respiration** : inspirez 4 secondes, bloquez 2 secondes, expirez 6 secondes. Trois fois.
2. **Première phrase préparée** mot pour mot : les 10 premières secondes sont les plus difficiles.
3. **Pause** : si vous perdez le fil, marquez une pause, respirez, reprenez votre idée centrale.
4. **Regard ami** : commencez en regardant une personne bienveillante.

## Recevoir un feedback utile
Un bon retour après une vidéo, c'est **une observation concrète et une amélioration réalisable** (« Tu as regardé tes notes pendant la conclusion ; essaie de la dire en regardant la caméra »). Après un passage peu convaincant, on ne renonce pas : on choisit **un seul axe** et on recommence.`,
    },
    mission(
      'D04',
      `## Pour vous aider
- Préparez votre **accroche**, votre **idée centrale avec un exemple** et votre **conclusion**.
- Filmez-vous (téléphone posé à hauteur des yeux, lumière face à vous).
- Durée : **90 secondes** environ.

**Pour rendre la mission :** déposez le lien privé de votre vidéo (ou celui fourni par l'équipe audiovisuelle) et ajoutez en une phrase **ce que vous voulez améliorer**.`,
      20
    ),
    mission(
      'D05',
      `## Pour vous aider
Reprenez **le même sujet** que lors du premier passage. Avant de filmer, relisez le feedback reçu et choisissez **un seul point précis** à améliorer (rythme, regard, structure, conclusion…).

**Pour rendre la mission :** déposez le lien de votre seconde vidéo et décrivez en deux phrases **ce qui a changé** entre les deux passages.`,
      20
    ),
    quiz('QUIZ_PAROLE', [
      q('Combien d’idées centrales pour un message de 90 secondes ?', ['Une seule, illustrée par un exemple', 'Trois au minimum', 'Autant que possible'], 0, 'Une idée claire et un exemple : c’est ce que le public retient.'),
      q('Face caméra, où regarder ?', ['Ses notes', 'L’objectif de la caméra', 'L’écran de retour'], 1, 'Regarder l’objectif, c’est regarder son public.'),
      q('Quel est l’effet d’une pause de deux secondes après une idée importante ?', ['Elle montre qu’on a oublié la suite', 'Elle donne du poids à l’idée', 'Elle fait perdre du temps'], 1, 'La pause souligne l’idée et laisse au public le temps de l’intégrer.'),
    ]),
  ],
};

/* =====================================================================
   VENDREDI — ANIMATION DE RÉUNIONS ET COMMUNICATION D'INFLUENCE
   ===================================================================== */
const vendredi = {
  day: 'Vendredi',
  title: "Vendredi · Animation de réunions et communication d'influence",
  description: 'Influencer, décider et faire avancer : une réunion qui produit une décision.',
  lessons: [
    {
      title: 'Une réunion qui produit une décision',
      type: 'text',
      duration_minutes: 15,
      content: `# Une réunion qui produit une décision

> **Mémo M16 —** *Une bonne réunion se termine par une décision, une personne responsable et une échéance.*

## Objectifs du jour
- Préparer, animer et **conclure** une réunion utile ;
- recadrer une réunion qui **s'écarte du sujet** ;
- **influencer sans imposer** ;
- faire adhérer à une décision.

## Avant, pendant, après
| Moment | Ce que fait l'animateur |
|---|---|
| **Avant** | Annoncer le sujet et **le résultat que la réunion doit produire** ; inviter les bonnes personnes ; préparer les faits |
| **Pendant** | Écouter les avis, comparer les faits, faire respecter le temps |
| **Après** | Résumer en une phrase : **ce qui a été décidé, qui agit et pour quand** |

## Terminer chaque réunion par trois questions
| | |
|---|---|
| **QUOI ?** | Qu'avons-nous décidé ? |
| **QUI ?** | Qui est responsable de l'action ? |
| **QUAND ?** | Quelle échéance avons-nous fixée ? |

> **Question à se poser :** si je quitte la salle maintenant, chacun sait-il ce qu'il doit faire ?

## Exemple VIGILUS (fictif)
Réunion de suivi client : les avis divergent sur la réponse à apporter à un retard. La responsable écoute chaque service, rappelle le critère commun (la satisfaction du client dans un délai tenable), puis conclut : « Nous proposons une livraison partielle jeudi ; Moussa appelle le client aujourd'hui avant 17 h ; point de suivi lundi. »

**À tester demain :** conclure votre prochaine réunion par « Qui fait quoi, pour quand ? »`,
    },
    {
      title: 'Animer une réunion utile, sans la prolonger',
      type: 'text',
      duration_minutes: 12,
      content: `# Animer une réunion utile, sans la prolonger

> **Mémo M17 —** *Une réunion efficace répond à une vraie question et respecte le temps de chacun.*

## Le bon format
- **Une question principale** par réunion (« Quelle solution proposons-nous au client X ? »).
- **Une durée annoncée** et tenue : 30 minutes suffisent souvent.
- **Les bonnes personnes** : celles qui savent, celles qui décident, celles qui agiront.

## Les rôles de l'animateur
1. **Ouvrir** : objectif, durée, ordre du jour.
2. **Faire parler** : donner la parole à ceux qui parlent peu, cadrer ceux qui parlent beaucoup.
3. **Recadrer** : quand la réunion s'écarte du sujet, relancer la question centrale et rappeler le temps (« Ce point est important, notons-le pour une autre réunion ; revenons à notre question »).
4. **Arbitrer** : quelle information manque réellement pour décider ?
5. **Conclure** : décision, responsable, échéance.

## Les situations délicates
| Situation | Réponse de l'animateur |
|---|---|
| Un participant monopolise la parole | « Merci, j'aimerais entendre aussi l'avis de… » |
| Le débat tourne en rond | « Quels sont les faits qui nous permettraient de trancher ? » |
| Personne n'ose s'exprimer | Tour de table rapide : une phrase chacun |
| Pas de décision possible | Fixer qui obtient l'information manquante, et pour quand |

## Le compte rendu en cinq lignes
Date · Participants · Décision(s) · Responsable(s) · Échéance(s). Envoyé **le jour même**.

**À tester demain :** préparer votre prochaine réunion avec une question principale et terminer par une action concrète.`,
    },
    {
      title: 'Communication d’influence : convaincre sans imposer',
      type: 'text',
      duration_minutes: 15,
      content: `# Communication d'influence

Influencer, ce n'est ni manipuler ni hausser le ton. C'est **aider l'autre à voir pourquoi une proposition sert aussi ses propres objectifs**.

## Les quatre étapes de l'influence
1. **Comprendre l'objectif de son interlocuteur** : qu'est-ce qui compte pour lui (délai, coût, image, sécurité, équipe) ?
2. **Relier sa proposition à cet objectif** : « Cette solution vous permet de… »
3. **Écouter les objections** : une objection est une information, pas une attaque.
4. **Clarifier les responsabilités** : qui fait quoi pour que la décision devienne réalité.

## Faire adhérer à une décision
Pour qu'une équipe adhère, il faut :
- **Montrer le sens** : pourquoi cette décision, pour qui, avec quel bénéfice ;
- **écouter les objections** et y répondre honnêtement ;
- **clarifier les responsabilités** et les prochaines étapes.

Imposer sans expliquer obtient au mieux une obéissance de façade.

## Répondre à une objection
| Objection | Réponse d'influence |
|---|---|
| « On a toujours fait comme ça. » | « Ça a bien fonctionné. Qu'est-ce qui a changé chez nos clients depuis ? » |
| « C'est trop cher. » | « Comparons avec ce que nous coûte le problème actuel chaque mois. » |
| « On n'a pas le temps. » | « Quelle tâche pourrions-nous arrêter pour dégager ce temps ? » |

## Le lien avec C.L.E.F.
L'influence durable repose sur la **Clarté** (une proposition simple), la **Lucidité** (écouter les vraies objections), l'**Équité** (des critères justes) et le **Faire grandir** (associer l'autre à la solution).

**À tester demain :** avant votre prochaine demande, écrire en une ligne l'objectif de votre interlocuteur.`,
    },
    mission(
      'D06',
      `## Pour vous aider
À partir de la réunion simulée en salle (ou d'une réunion réelle, anonymisée), rédigez le **compte rendu en cinq lignes** :

1. **Sujet / question principale :**
2. **Décision prise :**
3. **Responsable :**
4. **Échéance / date de suivi :**
5. **Message à transmettre** (au client, à l'équipe…) :`,
      15
    ),
    quiz('QUIZ_REUN', [
      q('Quand envoyer le compte rendu d’une réunion ?', ['Le jour même', 'À la réunion suivante', 'Seulement si quelqu’un le demande'], 0, 'Un compte rendu rapide fixe les engagements pendant qu’ils sont frais.'),
      q('Un participant répond « on a toujours fait comme ça ». La meilleure réponse est :', ['« Ce n’est pas un argument. »', '« Ça a bien fonctionné. Qu’est-ce qui a changé chez nos clients depuis ? »', 'Ignorer la remarque'], 1, 'On reconnaît l’expérience, puis on ouvre sur les faits nouveaux.'),
      q('Pour faire adhérer une équipe à une décision, il faut :', ['Imposer sans explication', 'Montrer le sens, écouter les objections, clarifier les responsabilités', 'Éviter les questions'], 1, 'Sens, écoute et responsabilités claires construisent l’adhésion.'),
    ]),
  ],
};

/* =====================================================================
   APRÈS — SUIVI J+7, J+14, J+21, J+30
   ===================================================================== */
const suivi = [
  {
    day: 'J+7',
    title: 'J+7 · Défi d’écoute active',
    description: 'Quiz court et défi d’écoute active dans une situation réelle.',
    lessons: [
      {
        title: 'Rappel : les réflexes de l’écoute active',
        type: 'text',
        duration_minutes: 6,
        content: `# J+7 — Le défi d'écoute active

Une semaine après la formation, il est temps de vérifier ce qui s'est ancré.

## Les réflexes à mobiliser cette semaine
1. **Se rendre disponible** (regard, posture, téléphone retourné) ;
2. **laisser exposer** faits et ressenti ;
3. **reformuler** : « Si je comprends bien… C'est bien cela ? » ;
4. **explorer et conclure** sur une action.

## Le défi
Au moins **une fois par jour** pendant la semaine, pratiquez une reformulation complète avant de répondre, avec un client, un collègue ou un proche.

## Rappel des mémos utiles
- **M04** — Écouter pour comprendre
- **M14** — L'objet sur la table : changer d'angle
- **M15** — Exprimer un désaccord sans condamner

> *Ai-je recherché la cause ou seulement corrigé le symptôme ?*`,
      },
      mission('J07', `Décrivez en quelques lignes :\n1. La situation (sans nom ni détail permettant d'identifier les personnes) ;\n2. la reformulation que vous avez utilisée ;\n3. ce qui a changé dans l'échange.`, 10),
      quiz('SUIVI_J7', [], { minutes: 5 }),
    ],
  },
  {
    day: 'J+14',
    title: 'J+14 · Une action C.L.E.F.',
    description: 'Quiz C.L.E.F. et mini-action de management.',
    lessons: [
      {
        title: 'Rappel : les 4 gestes C.L.E.F.',
        type: 'text',
        duration_minutes: 6,
        content: `# J+14 — Une C.L.E.F. dans mon quotidien

| Lettre | Geste | Question clé |
|---|---|---|
| **C** | Clarté | Le résultat attendu est-il observable et daté ? |
| **L** | Lucidité & écoute | Suis-je parti des faits ? Ai-je posé une vraie question ? |
| **E** | Équité & équilibre | Mes critères sont-ils les mêmes pour tous ? |
| **F** | Faire grandir | Quel appui ai-je proposé ? Quel progrès ai-je reconnu ? |

## La mini-action de management
Choisissez **une seule lettre** et appliquez-la dans une action concrète cette semaine : un objectif reformulé, un entretien qui part des faits, une règle appliquée équitablement, une délégation accompagnée…

## Mémos utiles
**M02** La méthode C.L.E.F. · **M03** Clarté · **M05** Équité · **M06** Faire briller son équipe · **M12** Regarder les faits`,
      },
      mission('J14', `Précisez :\n1. La lettre choisie (C, L, E ou F) ;\n2. l'action menée cette semaine ;\n3. son **effet observable** (ce que vous avez vu changer).`, 10),
      quiz('SUIVI_J14', [], { minutes: 5 }),
    ],
  },
  {
    day: 'J+21',
    title: 'J+21 · Mon message en 90 secondes',
    description: 'Quiz de prise de parole et exercice de message court.',
    lessons: [
      {
        title: 'Rappel : structurer et porter son message',
        type: 'text',
        duration_minutes: 6,
        content: `# J+21 — Mon message en 90 secondes

## La structure
1. **Accroche** (15 s) : le besoin du public ;
2. **Idée centrale + exemple** (60 s) ;
3. **Conclusion** (15 s) : ce que le public doit retenir ou faire.

## Les trois réglages
- **Voix** : ralentir légèrement, marquer des pauses ;
- **Regard** : les personnes ou l'objectif de la caméra ;
- **Trac** : respiration 4-2-6 et première phrase préparée.

> Un retour utile = **une observation concrète + une amélioration réalisable**.`,
      },
      mission('J21', `Rendez votre mini-présentation **écrite** (accroche, idée, exemple, conclusion) **ou** le lien d'un **enregistrement audio** de 90 secondes.`, 15),
      quiz('SUIVI_J21', [], { minutes: 5 }),
    ],
  },
  {
    day: 'J+30',
    title: 'J+30 · Bilan et prochain engagement',
    description: 'Quiz final, engagement de progrès et clôture du parcours.',
    lessons: [
      {
        title: 'Un engagement de progrès à 30 jours',
        type: 'text',
        duration_minutes: 8,
        content: `# J+30 — Bilan et prochain engagement

> **Mémo M20 —** *Un bon séminaire commence à produire ses résultats après la salle.*

## Votre parcours en un coup d'œil
| Étape | Ce que vous avez travaillé |
|---|---|
| Lundi | Écouter, reformuler, coopérer |
| Mardi | Les 4 gestes C.L.E.F. |
| Mercredi | Présentation, hygiène et énergie |
| Jeudi | Message en 90 secondes, voix et trac |
| Vendredi | Réunions qui décident, influence |
| J+7 → J+21 | Écoute, action C.L.E.F., message court |

## Faire le bilan
- **Une action que je maintiens** au quotidien ;
- **un progrès que j'ai observé** (ou qu'on m'a fait remarquer) ;
- **mon prochain objectif**, concret et daté.

## Coaching individuel
Pendant le mois de suivi, vous pouvez demander **un échange de coaching individuel** (60 minutes maximum, par téléphone ou visioconférence) auprès de votre formateur.

## Et après ?
Vos documents (support, livret des mémos, rapport de profil, attestation) restent téléchargeables dans **Mes documents** jusqu'à la fermeture des accès. Pensez à les enregistrer.

*Se découvrir. S'exprimer. Agir. Progresser. — MCE, Ensemble vers la réussite.*`,
      },
      mission('J30', `Répondez en trois points :\n1. **Une action maintenue** depuis la formation ;\n2. **un progrès observé** ;\n3. **mon prochain objectif** (quoi, pour quand).`, 10),
      quiz('SUIVI_J30', [], { minutes: 5 }),
    ],
  },
];

export const vigilusImpact = {
  title: 'VIGILUS IMPACT — Programme professionnel',
  subtitle: 'Des compétences qui s’apprennent. Des progrès qui se voient.',
  category: 'Soft skills',
  level: 'intermediaire',
  estimated_minutes: 600,
  is_published: true,
  description: `Programme de **cinq jours** suivi d'un **accompagnement jusqu'à J+30**, conçu par MCE Academy pour les collaborateurs de VIGILUS (profils commerciaux, directions et fonctions support).

**Notre fil conducteur : comprendre, pratiquer, observer, améliorer.**

### Mon programme
| Jour | Module |
|---|---|
| Lundi | Communication interpersonnelle |
| Mardi | Leadership et management |
| Mercredi | Hygiène de vie et propreté (hommes et femmes) |
| Jeudi | Prise de parole en public |
| Vendredi | Animation de réunions et communication d'influence |
| Après | Suivi à J+7, J+14, J+21 et J+30 |

Chaque module contient des **leçons**, une ou plusieurs **missions** et un **quiz**. Les modules s'ouvrent **jour après jour**, à l'initiative de votre formateur.

*Les cas présentés sont fictifs mais inspirés des réalités de la relation client, de la coordination opérationnelle, du commerce et du management.*`,
  modules: [lundi, mardi, mercredi, jeudi, vendredi, ...suivi],
};
