/* =====================================================================
   MCE Academy — Profil de fonctionnement professionnel (20 min)
   Modèle repris à l'identique de index.html / QUESTIONNAIRE_ET_BAREME_MCE.pdf
   Calcul :
   - auto-positionnement = (moyenne des 6 réponses − 1) × 25 (items inversés : 6 − réponse)
   - situation = 0 / 33 / 67 / 100 selon l'option choisie
   - score dimension = arrondi(0,70 × auto + 0,30 × situation)
   - indice global = moyenne arrondie des 8 dimensions
   Auto-positionnement pédagogique : ni test psychométrique étalonné, ni diagnostic.
   ===================================================================== */

const L = (id, dimension, text, reverse = false) => ({ id, dimension, text, reverse });
const S = (id, dimension, text, opts) => ({
  id,
  dimension,
  text,
  options: opts.map(([t, score], i) => ({ id: `opt${i + 1}`, text: t, score })),
});

export const PM = {
  version: '2.0.0',
  name: 'Profil de fonctionnement professionnel & compétences',
  duration: 25,
  instructions: 'Répondez selon votre expérience habituelle, et non selon la réponse idéale. Les résultats servent à personnaliser votre formation.',
  notice: 'Questionnaire de positionnement pédagogique, non étalonné et non diagnostique. Il n’est pas un test de personnalité clinique ni une évaluation psychométrique certifiée.',
  likert: ['Pas du tout d’accord', 'Plutôt pas d’accord', 'Ni d’accord ni pas d’accord', 'Plutôt d’accord', 'Tout à fait d’accord'],
  dimensions: [
    { id: 'communication', title: 'Communication et écoute', short: 'Communication', definition: 'Comprendre l’autre, transmettre un message clair et reformuler avant de répondre.', high: 'Vous savez créer les conditions d’un dialogue utile.', low: 'Vous gagnerez à poser davantage de questions ouvertes et à reformuler avant de conclure.', action30: 'Cette semaine, reformuler une demande importante dans trois échanges et vérifier l’accord sur les prochaines étapes.' },
    { id: 'leadership', title: 'Leadership et responsabilisation', short: 'Leadership', definition: 'Donner un cap, faire progresser ses collègues et responsabiliser sans tout contrôler.', high: 'Vous avez des réflexes de mobilisation et de responsabilisation.', low: 'Le passage de l’expertise personnelle au leadership collectif mérite d’être consolidé.', action30: 'Avant la prochaine délégation, préciser le résultat attendu, l’autonomie donnée et le point de suivi.' },
    { id: 'priorites', title: 'Organisation et priorisation', short: 'Organisation', definition: 'Distinguer l’urgent de l’important, arbitrer et tenir des engagements réalistes.', high: 'Vous disposez d’une bonne base pour arbitrer et structurer l’action.', low: 'Vous pourriez gagner en efficacité en formalisant les priorités et en anticipant les dépendances.', action30: 'Chaque matin, choisir deux priorités et noter une tâche à reporter, déléguer ou abandonner.' },
    { id: 'adaptation', title: 'Adaptabilité et régulation', short: 'Adaptabilité', definition: 'Garder une posture constructive face aux imprévus, aux tensions et aux changements.', high: 'Vous mobilisez des comportements utiles pour traverser des situations incertaines.', low: 'Un travail sur le recul, le rythme de réaction et l’expression des besoins pourrait vous aider.', action30: 'Avant de répondre sous pression, nommer les faits, l’objectif et une première action possible.' },
    { id: 'cooperation', title: 'Coopération et gestion des désaccords', short: 'Coopération', definition: 'Travailler avec d’autres fonctions et transformer les tensions en solutions.', high: 'Vous contribuez à une coopération constructive entre personnes et services.', low: 'Vous pourriez renforcer votre manière de clarifier les responsabilités sans créer de mise en accusation.', action30: 'Lors d’un désaccord, demander les faits, la contrainte de chacun et une solution commune.' },
    { id: 'initiative', title: 'Initiative et autonomie', short: 'Initiative', definition: 'Agir dans son périmètre, signaler les risques et rechercher des solutions.', high: 'Vous montrez une orientation vers la responsabilité et la résolution de problèmes.', low: 'Votre marge d’action peut progresser en clarifiant les décisions possibles et les règles d’escalade.', action30: 'Identifier une difficulté récurrente et proposer une solution concrète à votre responsable.' },
    { id: 'client', title: 'Orientation client et influence', short: 'Client & influence', definition: 'Comprendre les besoins, argumenter avec justesse et protéger les engagements.', high: 'Vous faites le lien entre besoins clients, fiabilité et argumentation.', low: 'Vous pourriez développer davantage la découverte des besoins et la réponse aux objections.', action30: 'Pour votre prochain entretien, préparer trois questions de découverte et deux preuves de valeur.' },
    { id: 'parole', title: 'Prise de parole et impact', short: 'Prise de parole', definition: 'Structurer un message clair, capter l’attention et gérer le trac devant un groupe.', high: 'Vous savez porter un message clair et capter l’attention.', low: 'Vous gagnerez à structurer vos interventions (une idée, un exemple, une conclusion) et à vous entraîner à voix haute.', action30: 'Préparer une présentation de 90 secondes (une idée, un exemple, une conclusion) et la faire devant au moins deux collègues.' },
    { id: 'presence', title: 'Présence professionnelle et équilibre', short: 'Présence & équilibre', definition: 'Soigner sa présentation, son cadre de travail et son énergie pour rester fiable dans la durée.', high: 'Vous prenez soin de votre image professionnelle et de votre énergie.', low: 'Vos habitudes de présentation, de récupération ou d’organisation de l’espace de travail peuvent devenir un levier de confiance.', action30: 'Choisir une habitude (pause, tenue, rangement, hydratation) et la tenir chaque jour pendant deux semaines.' },
    { id: 'progression', title: 'Apprentissage et confiance d’action', short: 'Apprentissage', definition: 'Recevoir du feedback, développer ses compétences et progresser avec méthode.', high: 'Vous semblez mobiliser une démarche de progression et d’apprentissage continu.', low: 'Vous pourrez renforcer votre confiance d’action par de petits essais concrets et des feedbacks ciblés.', action30: 'Choisir une compétence et planifier deux occasions de la pratiquer durant les 30 prochains jours.' },
  ],
  likertQuestions: [
    L('COMMUNICATION_1', 'communication', 'Je vérifie que mon interlocuteur a compris ce que je voulais dire.'),
    L('COMMUNICATION_2', 'communication', 'Lorsque quelqu’un formule une objection, j’écoute jusqu’au bout avant de répondre.'),
    L('COMMUNICATION_3', 'communication', 'Je reformule les demandes importantes avant de m’engager.'),
    L('COMMUNICATION_4', 'communication', 'Quand je suis pressé(e), j’ai tendance à couper la parole.', true),
    L('COMMUNICATION_5', 'communication', 'Je considère qu’un message est clair dès lors que je l’ai expliqué une fois.', true),
    L('COMMUNICATION_6', 'communication', 'Je cherche à comprendre ce qui n’a pas été dit lorsqu’un échange devient tendu.'),
    L('LEADERSHIP_1', 'leadership', 'Je sais expliquer à mon équipe pourquoi une décision est importante.'),
    L('LEADERSHIP_2', 'leadership', 'Je confie des responsabilités avec des attentes et un délai explicites.'),
    L('LEADERSHIP_3', 'leadership', 'Je reconnais la contribution des autres sans chercher à être au centre.'),
    L('LEADERSHIP_4', 'leadership', 'J’ai du mal à laisser une autre personne proposer une méthode différente de la mienne.', true),
    L('LEADERSHIP_5', 'leadership', 'Quand le résultat est insuffisant, j’ai tendance à reprendre moi-même la tâche plutôt qu’à accompagner.', true),
    L('LEADERSHIP_6', 'leadership', 'Je donne un retour concret qui aide la personne à progresser.'),
    L('PRIORITES_1', 'priorites', 'Je sais identifier les deux priorités qui comptent réellement dans une journée chargée.'),
    L('PRIORITES_2', 'priorites', 'Avant d’accepter une demande urgente, j’en vérifie l’impact sur les engagements déjà pris.'),
    L('PRIORITES_3', 'priorites', 'J’anticipe les échéances et les points de blocage possibles.'),
    L('PRIORITES_4', 'priorites', 'Je traite souvent les demandes dans leur ordre d’arrivée, sans réévaluer leur importance.', true),
    L('PRIORITES_5', 'priorites', 'Je reporte les décisions difficiles jusqu’à ce que la situation devienne urgente.', true),
    L('PRIORITES_6', 'priorites', 'Lorsque tout semble prioritaire, je clarifie les critères de décision.'),
    L('PRIORITES_7', 'priorites', 'Je termine une réunion en identifiant ce qui est décidé, par qui et pour quand.'),
    L('ADAPTATION_1', 'adaptation', 'Face à un imprévu, je cherche d’abord les faits et les options possibles.'),
    L('ADAPTATION_2', 'adaptation', 'Je peux garder un ton respectueux même lorsque je suis contrarié(e).'),
    L('ADAPTATION_3', 'adaptation', 'Je sais demander du soutien quand une situation dépasse mes moyens.'),
    L('ADAPTATION_4', 'adaptation', 'Lorsque la pression augmente, mon humeur influence fortement mes échanges.', true),
    L('ADAPTATION_5', 'adaptation', 'Quand une méthode change, j’ai tendance à résister avant de chercher à comprendre.', true),
    L('ADAPTATION_6', 'adaptation', 'Après une difficulté, je prends le temps d’identifier ce que j’ai appris.'),
    L('COOPERATION_1', 'cooperation', 'Je cherche les intérêts communs lorsque deux services sont en désaccord.'),
    L('COOPERATION_2', 'cooperation', 'Je sais exprimer un désaccord sans attaquer la personne.'),
    L('COOPERATION_3', 'cooperation', 'Je partage les informations utiles avec les collègues concernés.'),
    L('COOPERATION_4', 'cooperation', 'Je préfère éviter une discussion difficile même lorsqu’elle devient nécessaire.', true),
    L('COOPERATION_5', 'cooperation', 'Lorsque quelque chose se passe mal, je cherche d’abord à identifier qui a commis l’erreur.', true),
    L('COOPERATION_6', 'cooperation', 'Je peux reconnaître ma part de responsabilité dans une situation collective.'),
    L('INITIATIVE_1', 'initiative', 'Lorsqu’un problème apparaît, je propose au moins une piste de solution.'),
    L('INITIATIVE_2', 'initiative', 'Je sais distinguer ce que je peux décider seul(e) de ce qui doit être validé.'),
    L('INITIATIVE_3', 'initiative', 'Je prends des initiatives utiles sans attendre qu’on m’en donne le détail.'),
    L('INITIATIVE_4', 'initiative', 'Quand une demande sort de ma mission habituelle, je considère qu’elle ne me concerne pas.', true),
    L('INITIATIVE_5', 'initiative', 'Je préfère attendre des instructions détaillées, même sur une tâche que je connais bien.', true),
    L('INITIATIVE_6', 'initiative', 'Je signale rapidement un blocage qui pourrait affecter un client ou un collègue.'),
    L('CLIENT_1', 'client', 'Avant de proposer une solution, je cherche à comprendre la priorité réelle du client.'),
    L('CLIENT_2', 'client', 'Je sais expliquer la valeur d’une prestation sans me limiter à son prix.'),
    L('CLIENT_3', 'client', 'Je préfère une promesse réaliste à un engagement séduisant mais incertain.'),
    L('CLIENT_4', 'client', 'Quand un client insiste, il m’arrive de promettre un délai que je n’ai pas vérifié.', true),
    L('CLIENT_5', 'client', 'Une objection commerciale me donne souvent l’impression que la discussion est terminée.', true),
    L('CLIENT_6', 'client', 'J’adapte mon argumentation aux préoccupations de mon interlocuteur.'),
    L('PAROLE_1', 'parole', 'Je peux présenter une idée clairement en 90 secondes devant un groupe.'),
    L('PAROLE_2', 'parole', 'Je structure mes interventions : une idée clé, un exemple, une conclusion.'),
    L('PAROLE_3', 'parole', 'Je parviens à réguler mon stress lorsque je prends la parole.'),
    L('PAROLE_4', 'parole', 'J’évite de prendre la parole en réunion, même quand j’ai une idée utile.', true),
    L('PAROLE_5', 'parole', 'Devant un groupe, j’accélère et je perds facilement le fil.', true),
    L('PAROLE_6', 'parole', 'Après une intervention, je cherche un retour pour m’améliorer.'),
    L('PRESENCE_1', 'presence', 'J’adapte ma tenue et ma présentation au contexte professionnel.'),
    L('PRESENCE_2', 'presence', 'Je garde un espace de travail ordonné qui facilite le travail de l’équipe.'),
    L('PRESENCE_3', 'presence', 'Je respecte des temps de pause et de récupération pour rester efficace.'),
    L('PRESENCE_4', 'presence', 'Il m’arrive de négliger ma présentation quand la journée est chargée.', true),
    L('PRESENCE_5', 'presence', 'Je continue à travailler malgré une fatigue importante, sans le signaler.', true),
    L('PRESENCE_6', 'presence', 'Je sais aborder un sujet de tenue ou d’hygiène avec respect et discrétion.'),
    L('PROGRESSION_1', 'progression', 'Je transforme un retour critique en une action précise de progression.'),
    L('PROGRESSION_2', 'progression', 'Quand je ne sais pas faire quelque chose, je cherche comment l’apprendre.'),
    L('PROGRESSION_3', 'progression', 'Je suis capable de nommer une compétence que je souhaite développer cette année.'),
    L('PROGRESSION_4', 'progression', 'Une difficulté me pousse parfois à penser que je ne suis pas fait(e) pour cette mission.', true),
    L('PROGRESSION_5', 'progression', 'Je considère que les qualités de manager sont essentiellement innées.', true),
    L('PROGRESSION_6', 'progression', 'J’essaie de nouvelles pratiques et j’observe ce qui fonctionne réellement.'),
  ],
  situations: [
    S('S_COMMUNICATION', 'communication', 'Un client explique un problème complexe, mais vous pensez déjà avoir compris. Comment réagissez-vous ?', [
      ['Je laisse le client finir puis propose immédiatement une solution.', 67],
      ['Je l’interromps pour aller directement au point qui me paraît essentiel.', 33],
      ['Je lui demande d’envoyer un courriel et clos l’échange.', 0],
      ['Je reformule le problème et demande si mon résumé est juste.', 100],
    ]),
    S('S_LEADERSHIP', 'leadership', 'Une collaboratrice obtient un résultat en utilisant une méthode différente de la vôtre. Que faites-vous ?', [
      ['Je demande qu’elle revienne à ma méthode, même si le résultat est bon.', 33],
      ['Je reprends la tâche pour éviter que la méthode se reproduise.', 0],
      ['Je vérifie le résultat et les risques, puis valorise l’initiative si le cadre a été respecté.', 100],
      ['Je félicite le résultat sans discuter de la méthode.', 67],
    ]),
    S('S_PRIORITES', 'priorites', 'Deux urgences arrivent alors qu’une échéance client importante approche. Votre premier réflexe ?', [
      ['Je demande de l’aide tout en poursuivant mon travail initial sans arbitrer.', 67],
      ['Je compare impacts et délais, puis clarifie l’ordre de traitement avec les parties concernées.', 100],
      ['Je traite d’abord la demande de la personne la plus insistante.', 33],
      ['Je commence par le sujet qui me semble le plus simple à régler.', 0],
    ]),
    S('S_ADAPTATION', 'adaptation', 'Un incident provoque une remarque vive d’un collègue devant l’équipe. Que faites-vous ?', [
      ['Je garde un ton posé, clarifie les faits et propose de traiter le désaccord au bon moment.', 100],
      ['Je ne réponds pas tout de suite et reviens plus tard sur le sujet.', 67],
      ['Je réplique immédiatement pour défendre mon travail.', 33],
      ['Je me retire de toute collaboration avec ce collègue.', 0],
    ]),
    S('S_COOPERATION', 'cooperation', 'Le service commercial et l’exploitation se renvoient la responsabilité d’un retard. Que proposez-vous ?', [
      ['Nous demandons à la direction de désigner rapidement un responsable.', 33],
      ['Nous laissons chaque service traiter sa partie séparément.', 0],
      ['Nous reconstituons les faits, identifions les interfaces et convenons d’une réponse client commune.', 100],
      ['Nous organisons une réunion pour que chacun explique son point de vue.', 67],
    ]),
    S('S_INITIATIVE', 'initiative', 'Un client pose une question en dehors de votre périmètre habituel. Que faites-vous ?', [
      ['Je donne une réponse approximative pour ne pas paraître démuni(e).', 0],
      ['Je clarifie le besoin, identifie le bon interlocuteur et assure une transmission suivie.', 100],
      ['Je transmets le nom d’un autre service au client.', 67],
      ['Je réponds que ce n’est pas de mon ressort.', 33],
    ]),
    S('S_CLIENT', 'client', 'Un prospect demande une baisse de prix importante tout en conservant toutes les prestations. Votre réponse ?', [
      ['Je lui présente les avantages puis demande un délai de réflexion.', 67],
      ['Je concède immédiatement une forte remise pour sauver la vente.', 33],
      ['Je réponds que notre tarif ne se discute pas.', 0],
      ['Je clarifie ses contraintes, rappelle la valeur et explore une adaptation de périmètre viable.', 100],
    ]),
    S('S_PAROLE', 'parole', 'On vous demande, au dernier moment, de présenter en 3 minutes les résultats de votre équipe devant la direction. Que faites-vous ?', [
      ['Je présente en parlant vite pour tout dire dans le temps, en m’appuyant sur les chiffres.', 67],
      ['J’improvise en espérant que l’inspiration viendra.', 33],
      ['Je prends deux minutes pour fixer trois messages clés, un exemple et une conclusion.', 100],
      ['Je demande à quelqu’un d’autre de présenter à ma place.', 0],
    ]),
    S('S_PRESENCE', 'presence', 'Un collègue en contact avec les clients arrive régulièrement avec une tenue inadaptée. Que faites-vous ?', [
      ['Je plaisante sur sa tenue devant l’équipe pour qu’il comprenne.', 0],
      ['J’attends que quelqu’un d’autre s’en charge.', 33],
      ['J’en parle en privé, avec des faits et du respect, et cherche une solution compatible avec son poste.', 100],
      ['Je signale la situation à notre responsable sans en parler au collègue.', 67],
    ]),
    S('S_PROGRESSION', 'progression', 'On vous confie l’animation de votre première réunion de direction. Vous manquez d’expérience. Que faites-vous ?', [
      ['Je prépare les objectifs, demande un retour sur mon plan, puis m’exerce avant la réunion.', 100],
      ['Je prépare soigneusement l’ordre du jour et espère que cela suffira.', 67],
      ['Je demande qu’une personne expérimentée anime à ma place.', 33],
      ['Je décline car je ne suis pas naturellement à l’aise.', 0],
    ]),
  ],
  bands: [
    { min: 80, label: 'Pratiques bien installées', color: '#10B981' },
    { min: 60, label: 'Ressources mobilisables', color: '#2B9FDC' },
    { min: 40, label: 'Axes à développer', color: '#F59E0B' },
    { min: 0, label: 'Priorité de développement', color: '#EF4444' },
  ],
};

/* Couleur propre à chaque dimension (diagrammes) */
export const DIM_COLORS = {
  communication: '#2B9FDC',
  leadership: '#6366F1',
  priorites: '#0EA5E9',
  adaptation: '#14B8A6',
  cooperation: '#10B981',
  initiative: '#F59E0B',
  client: '#EC4899',
  parole: '#F43F5E',
  presence: '#84CC16',
  progression: '#8B5CF6',
};

export const DIM = Object.fromEntries(PM.dimensions.map((d) => [d.id, d]));

/* ---------- Contexte professionnel (décrit la personne, non noté) ---------- */
export const CONTEXT = [
  { id: 'CTX_TEAM', question: 'Encadrez-vous une équipe actuellement ?', options: ['Non', 'Oui, 1 à 5 personnes', 'Oui, plus de 5 personnes', 'Pas encore, mais c’est prévu'] },
  { id: 'CTX_SENIORITY', question: 'Depuis combien de temps occupez-vous votre poste actuel ?', options: ['Moins d’un an', '1 à 3 ans', '3 à 10 ans', 'Plus de 10 ans'] },
  { id: 'CTX_CONTACT', question: 'Êtes-vous en contact avec des clients ou le public ?', options: ['Rarement', 'Parfois', 'Tous les jours'] },
];

/* ---------- 5 axes de fonctionnement (2 choix chacun, non notés) ---------- */
export const AXES = [
  { id: 'autonomie', a: 'Autonomie', b: 'Collectif', ia: '🦅', ib: '👥' },
  { id: 'cadre', a: 'Structure', b: 'Exploration', ia: '🏛️', ib: '🧪' },
  { id: 'rythme', a: 'Réflexion', b: 'Action', ia: '🧠', ib: '⚡' },
  { id: 'reconnaissance', a: 'Apprentissage', b: 'Résultats', ia: '📚', ib: '🏆' },
  { id: 'contribution', a: 'Transmission', b: 'Expertise', ia: '🌱', ib: '🔧' },
];
const PR = (id, axis, question, a, b) => ({ id, axis, question, options: [a, b] });
export const PREFERENCES = [
  PR('P1', 'autonomie', 'Je me sens particulièrement motivé(e) lorsque…', 'je peux décider de ma façon d’agir', 'je peux construire quelque chose avec une équipe'),
  PR('P2', 'autonomie', 'Pour avancer sur un dossier, je préfère…', 'travailler seul(e) puis présenter le résultat', 'avancer à plusieurs, étape par étape'),
  PR('P3', 'cadre', 'Je préfère un environnement dans lequel…', 'les objectifs et les rôles sont très explicités', 'j’ai de la liberté pour expérimenter'),
  PR('P4', 'cadre', 'Lorsque je commence un nouveau projet, je recherche d’abord…', 'des repères clairs et un cadre organisé', 'des idées nouvelles et des pistes à tester'),
  PR('P5', 'rythme', 'Face à une décision importante, je…', 'prends le temps d’analyser avant d’agir', 'agis vite et j’ajuste en chemin'),
  PR('P6', 'rythme', 'Ce qui me donne le plus d’énergie est…', 'comprendre en profondeur un sujet', 'obtenir un résultat ambitieux rapidement'),
  PR('P7', 'reconnaissance', 'J’apprécie davantage…', 'avoir un retour constructif régulier', 'être jugé(e) sur mes résultats, avec de l’autonomie entre deux points'),
  PR('P8', 'reconnaissance', 'Une journée réussie, pour moi, c’est…', 'une journée où j’ai appris quelque chose', 'une journée où j’ai atteint un objectif concret'),
  PR('P9', 'contribution', 'Je trouve particulièrement satisfaisant de…', 'voir un collègue progresser grâce à notre travail', 'résoudre moi-même un problème complexe'),
  PR('P10', 'contribution', 'On me sollicite surtout pour…', 'expliquer, accompagner, rassurer', 'trouver la solution ou la bonne réponse'),
];

/* Étapes : contexte → 10 compétences → préférences → objectif */
export const PROFIL_STEPS = [
  { type: 'context' },
  ...PM.dimensions.map((d) => ({
    type: 'module',
    dim: d,
    questions: PM.likertQuestions.filter((q) => q.dimension === d.id),
    situation: PM.situations.find((s) => s.dimension === d.id),
  })),
  { type: 'preferences' },
  { type: 'objective' },
];

export const stepIds = (st) => {
  if (st.type === 'context') return CONTEXT.map((c) => c.id);
  if (st.type === 'module') return st.questions.map((q) => q.id).concat(st.situation.id);
  if (st.type === 'preferences') return PREFERENCES.map((p) => p.id);
  return ['OBJ_DIM'];
};

export const bandOf = (score) => PM.bands.find((b) => score >= b.min);

/* ---------- Calcul ---------- */
export function scoreProfil(answers, minutes = 20) {
  const dimensions = PM.dimensions.map((d) => {
    const qs = PM.likertQuestions.filter((q) => q.dimension === d.id);
    const total = qs.reduce((a, q) => a + (q.reverse ? 6 - answers[q.id] : answers[q.id]), 0);
    const auto = Math.round((total / qs.length - 1) * 25);
    const situ = PM.situations.find((s) => s.dimension === d.id);
    const situation = situ.options.find((o) => o.id === answers[situ.id]).score;
    const score = Math.round(auto * 0.7 + situation * 0.3);
    return { id: d.id, title: d.title, score, auto_score: auto, situation_score: situation, band: bandOf(score).label, summary: score >= 70 ? d.high : d.low, action30: d.action30 };
  });
  const global_score = Math.round(dimensions.reduce((a, x) => a + x.score, 0) / dimensions.length);
  const strengths = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.id);
  const priorities = [...dimensions].sort((a, b) => a.score - b.score).slice(0, 2).map((x) => x.id);

  // Axes : -100 (pôle A) … +100 (pôle B)
  const axes = Object.fromEntries(
    AXES.map((ax) => {
      const items = PREFERENCES.filter((p) => p.axis === ax.id);
      const b = items.filter((p) => answers[p.id] === 1).length;
      return [ax.id, Math.round(((b / items.length) * 2 - 1) * 100)];
    })
  );

  // Fiabilité des réponses (repères, pas un jugement)
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const direct = PM.likertQuestions.filter((q) => !q.reverse).map((q) => answers[q.id]);
  const reversed = PM.likertQuestions.filter((q) => q.reverse).map((q) => answers[q.id]);
  const all = PM.likertQuestions.map((q) => answers[q.id]);
  const mode = Math.max(...[1, 2, 3, 4, 5].map((v) => all.filter((x) => x === v).length)) / all.length;
  const coherence = Math.round(100 - dimensions.reduce((a, d) => a + Math.abs(d.auto_score - d.situation_score), 0) / dimensions.length);
  const notes = [];
  if (mean(direct) >= 4 && mean(reversed) >= 3.8) notes.push('Tendance à approuver la plupart des affirmations, y compris celles formulées à l’inverse : certains scores peuvent être surestimés.');
  if (mode >= 0.6) notes.push('Réponses très uniformes (même niveau choisi la plupart du temps) : le profil est moins nuancé.');
  if (minutes < 8) notes.push('Questionnaire rempli très rapidement : résultats à confirmer en entretien.');
  if (coherence < 55) notes.push('Écart important entre l’auto-évaluation et les choix en situation : un bon sujet d’échange avec la formatrice.');
  const reliability = { coherence, level: notes.length === 0 ? 'Bonne' : notes.length === 1 ? 'Correcte' : 'À confirmer', notes };

  const context = Object.fromEntries(CONTEXT.map((c) => [c.id, answers[c.id]]));
  const objective = { dim: answers.OBJ_DIM, text: String(answers.OBJ_TEXT || '').trim() };
  return { dimensions, global_score, strengths, priorities, axes, reliability, context, objective };
}

export const dimOf = (run, id) => run.result.dimensions.find((d) => d.id === id);
export const runValues = (run) => Object.fromEntries(run.result.dimensions.map((d) => [d.id, d.score]));

/* ---------- Styles de fonctionnement (dimension la plus forte) ---------- */
export const ARCH = {
  communication: { nom: 'Le Médiateur', emoji: '🤝', court: 'crée les conditions du dialogue', apport: 'Vous aidez une équipe à se comprendre : vous clarifiez les demandes, écoutez les objections et faites baisser les tensions.', vigilance: 'Veillez à ce que le temps passé à écouter débouche sur une décision et une action claires.', env: 'les rôles de relation : accueil, suivi client, coordination entre services.' },
  leadership: { nom: 'Le Mobilisateur', emoji: '🚀', court: 'donne un cap et fait grandir les autres', apport: 'Vous expliquez le sens des décisions, confiez des responsabilités et reconnaissez les contributions de chacun.', vigilance: 'Évitez de reprendre la main trop vite quand le résultat tarde : accompagner rapporte plus à long terme.', env: 'l’animation d’équipe, le pilotage de projet et l’accompagnement de nouveaux collègues.' },
  priorites: { nom: 'L’Organisateur', emoji: '🧭', court: 'structure l’action et tient les engagements', apport: 'Vous distinguez l’urgent de l’important, anticipez les échéances et arbitrez quand tout semble prioritaire.', vigilance: 'Expliquez vos arbitrages aux personnes concernées pour garder leur adhésion.', env: 'la coordination, la planification et le suivi d’activité.' },
  adaptation: { nom: 'Le Stabilisateur', emoji: '⚓', court: 'garde le cap dans l’imprévu', apport: 'Face à une tension ou un changement, vous revenez aux faits, gardez un ton respectueux et cherchez des options.', vigilance: 'Votre calme peut masquer une charge réelle : exprimez vos besoins et demandez du soutien à temps.', env: 'les contextes changeants, les périodes chargées et les situations sensibles.' },
  cooperation: { nom: 'Le Facilitateur', emoji: '🧩', court: 'transforme les désaccords en solutions', apport: 'Vous cherchez les intérêts communs, partagez l’information et reconnaissez votre part dans les situations collectives.', vigilance: 'Ne laissez pas la recherche d’accord retarder une discussion difficile mais nécessaire.', env: 'les projets transversaux et les interfaces entre services.' },
  initiative: { nom: 'Le Bâtisseur', emoji: '🛠️', court: 'agit et propose des solutions', apport: 'Vous proposez des pistes, prenez des initiatives utiles et signalez vite les blocages.', vigilance: 'Vérifiez que vos initiatives restent dans votre périmètre et alignées avec les priorités de l’équipe.', env: 'la résolution de problèmes, l’amélioration des processus et le lancement d’actions.' },
  parole: { nom: 'L’Orateur', emoji: '🎤', court: 'porte les messages et donne envie d’agir', apport: 'Vous structurez vos idées, captez l’attention et savez représenter l’équipe avec clarté.', vigilance: 'Laissez aussi la place à l’écoute : un bon message répond d’abord aux questions du public.', env: 'les présentations, la représentation de l’équipe, la formation et l’animation.' },
  presence: { nom: 'Le Pilier', emoji: '🌿', court: 'inspire confiance par sa fiabilité et son équilibre', apport: 'Vous incarnez une image professionnelle soignée et gérez votre énergie pour rester constant(e) dans la durée.', vigilance: 'Votre exigence envers vous-même ne doit pas devenir un jugement envers les autres.', env: 'les fonctions en contact client, l’accueil et les rôles très exposés.' },
  client: { nom: 'Le Négociateur', emoji: '🎯', court: 'relie besoins clients, valeur et engagements', apport: 'Vous cherchez la priorité réelle du client, argumentez sur la valeur et préférez une promesse tenable.', vigilance: 'Gardez l’écoute sous pression commerciale : une objection est une information, pas une fin de discussion.', env: 'la relation commerciale, la négociation et le développement de partenariats.' },
  progression: { nom: 'L’Explorateur', emoji: '🔭', court: 'apprend et progresse par l’action', apport: 'Vous transformez les retours en actions, testez de nouvelles pratiques et cherchez à apprendre.', vigilance: 'Choisissez un ou deux axes à la fois pour que vos apprentissages deviennent des habitudes.', env: 'les missions nouvelles, les projets pilotes et les rôles qui évoluent.' },
};
export function profilType(run) {
  const [a, b] = run.result.strengths;
  return { main: ARCH[a], second: ARCH[b], mainId: a, secondId: b };
}

/* ---------- Lecture des axes ---------- */
const AXIS_TXT = {
  autonomie: ['a besoin d’autonomie et de marge de décision', 'alterne travail autonome et travail en équipe', 'tire son énergie du collectif et de la co-construction'],
  cadre: ['avance mieux avec des repères clairs et un cadre organisé', 'combine besoin de cadre et goût de l’essai', 'aime explorer, tester et sortir des sentiers battus'],
  rythme: ['prend le temps d’analyser avant de s’engager', 'équilibre réflexion et passage à l’action', 'privilégie l’action rapide et l’ajustement en marche'],
  reconnaissance: ['est nourri(e) par l’apprentissage et les retours réguliers', 'apprécie autant les retours que les résultats', 'est motivé(e) par des objectifs concrets et des résultats visibles'],
  contribution: ['aime transmettre, accompagner et faire grandir', 'sait à la fois accompagner et résoudre', 'aime résoudre par soi-même les problèmes complexes'],
};
const AXIS_TIPS = {
  autonomie: ['Donner un objectif clair, puis laisser de la marge sur la méthode.', null, 'L’associer aux décisions et aux temps d’équipe.'],
  cadre: ['Formaliser les attentes, les rôles et les délais par écrit.', null, 'Laisser de la place à l’essai et aux idées nouvelles.'],
  rythme: ['Laisser un temps de préparation avant de demander une décision.', null, 'Proposer des défis concrets avec des échéances courtes.'],
  reconnaissance: ['Prévoir des retours réguliers, précis et bienveillants.', null, 'Rendre visibles les résultats obtenus et les célébrer.'],
  contribution: ['Confier des missions de tutorat ou d’accompagnement.', null, 'Confier des problèmes exigeants à résoudre.'],
};
const axisPos = (v) => (v <= -50 ? 0 : v >= 50 ? 2 : 1);
export const axisText = (id, v) => AXIS_TXT[id][axisPos(v)];
const du = (nom) => nom.replace(/^Le /, 'du ').replace(/^L’/, 'de l’');

/** Portrait rédigé (neutre, sans pronom genré) */
export function portrait(run, name = 'La personne') {
  const r = run.result;
  const t = profilType(run);
  const first = name.split(' ')[0] || name;
  const s = r.strengths.map((id) => DIM[id].short.toLowerCase());
  const p = r.priorities.map((id) => DIM[id].short.toLowerCase());
  const ctx = r.context || {};
  const parts = [];
  if (ctx.CTX_TEAM !== undefined) {
    const sen = CONTEXT[1].options[ctx.CTX_SENIORITY];
    let c = `${first} occupe son poste depuis ${sen ? sen.toLowerCase() : 'un certain temps'}`;
    if (ctx.CTX_TEAM === 1 || ctx.CTX_TEAM === 2) c += ` et encadre une équipe (${CONTEXT[0].options[ctx.CTX_TEAM].replace('Oui, ', '')})`;
    if (ctx.CTX_TEAM === 3) c += ', avec une prise de responsabilités managériales en vue';
    if (ctx.CTX_CONTACT === 2) c += ', au contact quotidien des clients ou du public';
    parts.push(`${c}.`);
  }
  parts.push(`Son style dominant est celui ${du(t.main.nom)} : ${t.main.court}, avec une tendance ${du(t.second.nom)} (${t.second.court}).`);
  parts.push(`Ses appuis les plus nets : ${s[0]}, ${s[1]} et ${s[2]}.`);
  if (r.axes) {
    const ax = AXES.map((a) => axisText(a.id, r.axes[a.id]));
    parts.push(`Au quotidien, ${first} ${ax[0]}, ${ax[1]} et ${ax[2]}. Côté motivation, ${first} ${ax[3]} et ${ax[4]}.`);
  }
  let obj = `Les marges de progression portent d’abord sur ${p[0]} et ${p[1]}.`;
  if (r.objective?.dim) {
    const o = DIM[r.objective.dim];
    if (r.priorities.includes(o.id)) obj += ` C’est cohérent avec l’objectif choisi : « ${o.title} ».`;
    else if (r.strengths.includes(o.id)) obj += ` L’objectif choisi (« ${o.title} ») porte sur une compétence déjà solide : l’enjeu sera d’aller vers l’excellence et la transmission.`;
    else obj += ` L’objectif personnel choisi est « ${o.title} » (${dimOf(run, o.id).score}/100).`;
  }
  parts.push(obj);
  return parts.join(' ');
}

/** Conseils pour bien travailler avec la personne (formateur / manager) */
export function workWithTips(run) {
  const r = run.result;
  const tips = [];
  if (r.axes) AXES.forEach((a) => { const t = AXIS_TIPS[a.id][axisPos(r.axes[a.id])]; if (t) tips.push(t); });
  tips.push(`En formation, prévoir des mises en pratique sur « ${DIM[r.priorities[0]].short} » avec un retour concret.`);
  tips.push(`S’appuyer sur sa force en « ${DIM[r.strengths[0]].short} » pour l’impliquer (exemple, binôme, démonstration).`);
  return tips;
}

/* ---------- Lecture personnalisée ---------- */
export function narrative(run) {
  const d = Object.fromEntries(run.result.dimensions.map((x) => [x.id, x.score]));
  const tone = (k, h, m, l) => (d[k] >= 75 ? h : d[k] >= 50 ? m : l);
  const act = (d.initiative + d.priorites) / 2;
  return [
    { t: 'Votre manière d’entrer en relation', b: tone('communication', 'Vos réponses indiquent une tendance à clarifier les demandes et à écouter avant de conclure. Vous pourrez utiliser cette ressource pour traiter des objections et apaiser les tensions.', 'Vous montrez des habitudes de dialogue, avec une marge de progression sur la reformulation et l’écoute dans les échanges rapides.', 'Vous pourriez bénéficier d’entraînements guidés pour questionner, laisser l’autre terminer et reformuler les demandes avant de proposer une solution.') },
    { t: 'Votre posture lorsque vous devez entraîner les autres', b: tone('leadership', 'Vous exprimez une approche du leadership attentive au cap, à la délégation et à la reconnaissance du travail collectif.', 'Votre positionnement combine une capacité à prendre des responsabilités et un besoin possible de mieux structurer la délégation.', 'Vous pourriez travailler le passage de « faire soi-même » à « expliquer, accompagner et donner du feedback », particulièrement si vous accédez à des responsabilités managériales.') },
    { t: 'Votre manière de prendre la parole', b: tone('parole', 'Vous semblez à l’aise pour structurer un message et le porter devant un groupe. Les exercices filmés permettront d’affiner l’impact.', 'Vous savez prendre la parole, mais le trac ou la structure du message peuvent encore freiner votre impact.', 'La prise de parole est un vrai levier pour vous : une méthode simple (une idée, un exemple, une conclusion) et de courtes répétitions feront vite la différence.') },
    { t: 'Votre manière de fonctionner sous pression', b: tone('adaptation', 'Vous décrivez une tendance à garder du recul et à chercher des options en situation tendue. Cela reste à vérifier par des exercices concrets.', 'Vous semblez capable de revenir aux faits dans certaines situations, mais la pression peut perturber votre façon de communiquer.', 'Votre priorité pourrait être l’apprentissage de techniques simples : ralentir, distinguer faits et interprétations, puis choisir une première action réaliste.') },
    { t: 'Votre rapport à l’action et à la responsabilité', b: act >= 72 ? 'Vous privilégiez dans vos réponses l’initiative et l’organisation. Vérifiez que vos décisions restent alignées avec les priorités de l’équipe.' : act >= 50 ? 'Vous gagnez à clarifier votre marge d’autonomie ainsi que vos priorités lorsque plusieurs demandes arrivent simultanément.' : 'Votre axe principal pourrait être de rendre plus explicites les décisions que vous pouvez prendre et de formuler une première solution au lieu d’attendre toutes les instructions.' },
    { t: 'Votre présence professionnelle', b: tone('presence', 'Vous accordez de l’importance à votre présentation, à votre cadre de travail et à votre énergie : un atout de confiance, notamment face aux clients.', 'Vos habitudes sont globalement adaptées ; la régularité dans les journées chargées (pauses, tenue, rangement) reste à consolider.', 'Quelques routines simples (récupération, tenue, organisation de l’espace) pourraient renforcer votre image professionnelle et votre énergie.') },
  ];
}

/* Écarts entre ce que la personne déclare et ce qu'elle choisit en situation */
export function gaps(run) {
  const out = [];
  run.result.dimensions.forEach((d) => {
    const g = d.auto_score - d.situation_score;
    if (g >= 40) out.push({ title: d.title, text: `Vous vous décrivez à l’aise (${d.auto_score}/100), mais votre choix en situation (${d.situation_score}/100) s’éloigne de la pratique recommandée. C’est un bon point à tester en exercice.` });
    else if (g <= -40) out.push({ title: d.title, text: `Vos choix en situation (${d.situation_score}/100) sont plus solides que votre auto-évaluation (${d.auto_score}/100). Vous avez peut-être plus de ressources que vous ne le pensez.` });
  });
  return out.slice(0, 3);
}

/* ---------- Statistiques de groupe (sans classement) ---------- */
export function groupStats(runs) {
  const n = runs.length;
  const avg = {};
  const bands = {};
  PM.dimensions.forEach((d) => {
    const v = runs.map((r) => dimOf(r, d.id).score);
    avg[d.id] = n ? Math.round(v.reduce((a, b) => a + b, 0) / n) : 0;
    bands[d.id] = PM.bands.map((b) => runs.filter((r) => dimOf(r, d.id).band === b.label).length);
  });
  const axes = Object.fromEntries(AXES.map((a) => [a.id, n ? Math.round(runs.reduce((x, r) => x + (r.result.axes?.[a.id] || 0), 0) / n) : 0]));
  const prio = {};
  runs.forEach((r) => r.result.priorities.forEach((id) => (prio[id] = (prio[id] || 0) + 1)));
  const objectives = {};
  runs.forEach((r) => { const o = r.result.objective?.dim; if (o) objectives[o] = (objectives[o] || 0) + 1; });
  const types = {};
  runs.forEach((r) => (types[r.result.strengths[0]] = (types[r.result.strengths[0]] || 0) + 1));
  const global = n ? Math.round(runs.reduce((a, r) => a + r.result.global_score, 0) / n) : 0;
  return { n, avg, bands, axes, prio, objectives, types, global };
}
