/* Synthèse du support participants MCE C.L.E.F. et du Livret des 20 mémos.
   Les exemples sont pédagogiques ; ils ne décrivent pas des faits chez un partenaire. */
export const CLEF_PRINCIPLES = [
  {
    letter: 'C', title: 'Clarté', action: 'Donner le cap',
    summary: 'Un résultat attendu, une priorité, une échéance.',
    description: 'Chacun doit pouvoir expliquer ce qu’il doit accomplir et pourquoi cela compte. Une attente précise permet de travailler avec davantage d’autonomie et d’évaluer les résultats sur une base commune.',
    practices: [
      'Décrire un résultat observable : quoi, pour quand et avec quel niveau de qualité.',
      'Expliquer le sens de la mission, les priorités et les responsabilités de décision.',
      'Faire reformuler la consigne avec une question : « Comment vas-tu t’y prendre ? »',
    ],
    example: '« Contacte ces trois clients avant 16 h, puis consigne le résultat dans le CRM » donne une direction plus précise que « Fais le suivi rapidement ».',
    question: 'Mon équipe pourrait-elle reformuler les trois priorités de la semaine ?',
    exercise: 'Écrire un objectif précis et le faire reformuler par la personne concernée.',
  },
  {
    letter: 'L', title: 'Lucidité & écoute', action: 'Comprendre l’autre',
    summary: 'Observer les faits, questionner, puis reformuler.',
    description: 'L’écoute sert à comprendre une situation avant de décider. Elle permet de distinguer une difficulté réelle d’une interprétation, tout en conservant un cadre et des responsabilités clairs.',
    practices: [
      'Partir de faits observables et laisser la personne exposer sa situation sans l’interrompre.',
      'Poser une question ouverte sur les obstacles, les moyens ou la charge de travail.',
      'Reformuler ce qui a été compris, puis convenir ensemble d’une suite concrète.',
    ],
    example: '« Si je comprends bien, le retard vient d’un outil inaccessible. Qu’est-ce qui te manque pour avancer ? » ouvre une recherche de solution.',
    question: 'Ai-je recherché la cause du problème ou seulement corrigé son symptôme ?',
    exercise: 'Faire une reformulation complète avant de répondre lors du prochain échange.',
  },
  {
    letter: 'E', title: 'Équité & équilibre', action: 'Poser un cadre juste',
    summary: 'Des règles partagées et une posture constante.',
    description: 'Un cadre juste rend les décisions compréhensibles et prévisibles. L’équité tient compte des responsabilités et des situations, avec des critères explicites et une posture stable, même sous pression.',
    practices: [
      'Annoncer les règles et les critères d’évaluation avant de les appliquer.',
      'Utiliser des critères comparables pour des responsabilités comparables et expliquer les adaptations.',
      'Garder une attitude respectueuse et éviter que son humeur ou ses affinités dictent une décision.',
    ],
    example: 'Face à une erreur similaire de deux collaborateurs, garder le même cadre de traitement et examiner les responsabilités et le contexte de chacun.',
    question: 'Mes décisions reposent-elles sur des critères que je pourrais expliquer à toute l’équipe ?',
    exercise: 'Identifier une règle implicite et la rendre explicite avec l’équipe.',
  },
  {
    letter: 'F', title: 'Faire grandir', action: 'Développer l’autonomie',
    summary: 'Responsabiliser, soutenir et reconnaître les progrès.',
    description: 'Le rôle du manager consiste aussi à développer les capacités de son équipe. Confier une responsabilité avec une marge d’action réelle aide chacun à apprendre, à proposer et à progresser.',
    practices: [
      'Déléguer une responsabilité en précisant le résultat, les moyens et un point de suivi.',
      'Accompagner par des questions et un feedback utile, sans reprendre systématiquement la main.',
      'Reconnaître précisément les contributions et rendre les progrès visibles.',
    ],
    example: '« Quelle solution proposes-tu ? Testons-la ensemble, puis faisons le point jeudi » permet d’accompagner une décision sans la prendre à la place du collaborateur.',
    question: 'Quels résultats mon équipe peut-elle obtenir sans ma présence ?',
    exercise: 'Confier une décision adaptée au niveau d’autonomie de la personne et convenir d’un point de suivi.',
  },
];

export const CLEF_APPLICATIONS = [
  {
    title: 'Prendre sa place de manager',
    text: 'Lorsqu’un collègue devient responsable, expliquer ce qui change : décisions, confidentialité, arbitrages et évaluation. Rester accessible, poser des limites claires et appliquer des critères transparents.',
    action: 'Préparer une courte conversation avec l’équipe pour présenter son rôle et les règles communes.',
  },
  {
    title: 'Répondre à « Ce n’est pas mon travail »',
    text: 'Commencer par comprendre le blocage : charge, compétences, consignes ou sécurité. Clarifier ensuite le périmètre de la mission, ses priorités et ses limites, puis convenir de qui fait quoi, avec quels moyens et pour quand.',
    action: 'Suivre trois étapes : comprendre, clarifier, convenir d’une action et de son suivi.',
  },
  {
    title: 'Prioriser et décider',
    text: 'Lorsque tout semble urgent, prendre un temps de recul pour distinguer ce qui est important, urgent, délégable ou à reporter. Relier les arbitrages à une direction commune et désigner un responsable, un jalon et un indicateur utile.',
    action: 'Écrire trois priorités, une tâche à reporter et une décision à déléguer.',
  },
  {
    title: 'Faire progresser une équipe commerciale',
    text: 'Passer de la performance individuelle à la réussite collective demande de suivre l’activité de l’équipe, d’anticiper les obstacles et de développer les compétences. Un temps de coaching et un retour précis aident davantage que la reprise de tous les dossiers.',
    action: 'Observer un échange client puis consacrer quelques minutes à un feedback concret.',
  },
  {
    title: 'Donner un feedback sans coller d’étiquette',
    text: 'Décrire un changement observable dans les délais, la qualité ou la coopération. Demander ce qui a changé et explorer les consignes, les moyens, la charge et les compétences avant de choisir une action réalisable et un point de suivi.',
    action: 'Remplacer un jugement par deux faits datés et une question ouverte.',
  },
  {
    title: 'Construire la confiance pour apprendre',
    text: 'Une compétence peut se travailler. Aider la personne à passer de « Je ne sais pas » à « Je ne sais pas encore », puis choisir une première action observable, un soutien et une échéance.',
    action: 'Identifier une compétence à développer et une première étape à tester cette semaine.',
  },
  {
    title: 'Accueillir un désaccord et changer d’angle',
    text: 'Décrire ce que l’on observe, demander les informations qui fondent l’autre point de vue et comparer des critères communs : qualité, délai, sécurité ou besoin client. L’exercice de l’objet sur la table montre comment deux personnes peuvent observer des faces différentes d’une même réalité.',
    action: 'Demander : « Que vois-tu que je ne vois pas ? » et rechercher trois faits communs avant de conclure.',
  },
  {
    title: 'Animer une réunion qui débouche sur une action',
    text: 'Annoncer l’objectif, apporter les faits nécessaires et donner une place aux points de vue utiles. Recentrer les échanges lorsque le débat se disperse, puis conclure par une décision, une personne responsable et une échéance.',
    action: 'Terminer par trois questions : « Quoi ? Qui ? Pour quand ? »',
  },
  {
    title: 'Travailler sa parole et sa communication',
    text: 'Préparer un message clair, parler depuis les faits et formuler une demande avec « je ». Le Miroir Vocal consiste à faire un premier passage, recevoir un retour sur un point précis, puis recommencer pour observer son évolution.',
    action: 'Préparer une présentation de 90 secondes et retravailler un seul point après le retour reçu.',
  },
  {
    title: 'Entretenir un cadre de travail respectueux',
    text: 'La présentation, les habitudes de travail, la prévention de la fatigue et l’organisation contribuent à la qualité du service. Aborder les difficultés avec discrétion, sans jugement personnel, en recherchant des solutions adaptées au métier.',
    action: 'Choisir une habitude simple d’organisation ou de récupération à mettre en place.',
  },
];

export const CLEF_FOLLOW_UP = [
  { day: 'J+7', title: 'Écouter', text: 'Tester l’écoute active dans une situation réelle et observer ce qu’une reformulation change.' },
  { day: 'J+14', title: 'Appliquer', text: 'Choisir une lettre C.L.E.F. et décrire l’action menée ainsi que son effet observable.' },
  { day: 'J+21', title: 'Partager', text: 'Présenter son expérience en 90 secondes avec un message clair et un exemple précis.' },
  { day: 'J+30', title: 'Faire le bilan', text: 'Évaluer les progrès, identifier les ajustements et prendre un nouvel engagement concret.' },
];
