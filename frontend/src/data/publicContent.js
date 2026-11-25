import { Brain, CalendarClock, LineChart, FolderDown, Mic, Users, Sparkles, ShieldCheck, UserCog, User, GraduationCap, TrendingUp, HeartHandshake, Rocket, Briefcase, Wallet, Laptop, Target, Layers, Eye, Search, PenTool, MessageSquareText, FileCheck2, Zap, Clock, Building2, Landmark, School, HandHeart, Lightbulb, Globe2, Award } from 'lucide-react';

export const HIGHLIGHTS = [
  { icon: Brain, title: 'Test de profil', text: '20 minutes pour découvrir vos forces et vos axes de progrès.' },
  { icon: CalendarClock, title: 'À votre rythme', text: 'Les modules s’ouvrent au fil de votre formation.' },
  { icon: LineChart, title: 'Suivi personnalisé', text: 'Votre formateur suit vos progrès et vous conseille.' },
  { icon: FolderDown, title: 'Supports à garder', text: 'Mémos, fiches et documents à télécharger.' },
];

export const PILLARS = [
  { icon: Target, title: 'Des contenus pratiques', text: 'Chaque formation est construite autour de cas concrets, d’exercices et de situations professionnelles réelles.' },
  { icon: Layers, title: 'Des parcours adaptables', text: 'Les modules s’adaptent aux entreprises, écoles, ONG, institutions, jeunes talents ou entrepreneurs.' },
  { icon: Eye, title: 'Des résultats observables', text: 'La formation doit améliorer la posture, la méthode, la communication, l’organisation ou la performance.' },
];

export const FORMATIONS = [
  { icon: TrendingUp, color: '#1C82BD', title: 'Vente & prospection', summary: 'Prospecter avec méthode et développer ses ventes.', text: 'Développer les réflexes commerciaux, la relance, l’argumentaire, la négociation et le closing.', topics: ['Techniques de vente', 'Prospection terrain et digitale', 'Négociation et relance'] },
  { icon: Users, color: '#1C82BD', title: 'Leadership & management', summary: 'Donner un cap et faire progresser son équipe.', text: 'Renforcer la posture managériale, la communication, la prise de décision et la gestion d’équipe.', topics: ['Leadership opérationnel', 'Gestion d’équipe', 'Responsabilité et décision'] },
  { icon: Mic, color: '#1C82BD', title: 'Prise de parole & impact', summary: 'Structurer ses idées et gagner en aisance à l’oral.', text: 'Améliorer l’aisance orale, la présence, le pitch, la clarté du message et la confiance en public.', topics: ['Pitch professionnel', 'Présentation orale', 'Gestion du stress'] },
  { icon: HeartHandshake, color: '#1C82BD', title: 'Relation client', summary: 'Soigner les échanges et construire une relation de confiance.', text: 'Professionnaliser l’accueil, la communication client, le suivi, la fidélisation et la gestion des situations difficiles.', topics: ['Accueil professionnel', 'Gestion des objections', 'Fidélisation client'] },
  { icon: Rocket, color: '#1C82BD', title: 'Entrepreneuriat', summary: 'Clarifier son projet et préparer le développement de son activité.', text: 'Aider les porteurs de projets à structurer leur idée, présenter leur offre, vendre et avancer avec méthode.', topics: ['Structuration de projet', 'Offre et positionnement', 'Pitch et lancement'] },
  { icon: Briefcase, color: '#1C82BD', title: 'Insertion professionnelle', summary: 'Valoriser ses compétences et préparer ses candidatures et entretiens.', text: 'Préparer les jeunes talents au monde de l’entreprise : CV, entretien, posture, communication et confiance.', topics: ['Préparation entretien', 'CV et présentation', 'Posture professionnelle'] },
  { icon: Wallet, color: '#1C82BD', title: 'Finance & gestion d’argent', summary: 'Comprendre son budget et organiser ses finances au quotidien.', text: 'Sensibiliser à la gestion de l’argent, au budget, à l’épargne, au réinvestissement et aux décisions financières simples.', topics: ['Budget personnel', 'Épargne et priorités', 'Réinvestissement'] },
  { icon: Laptop, color: '#1C82BD', title: 'Digital & outils professionnels', summary: 'Utiliser les outils numériques pour mieux organiser son travail.', text: 'Former les équipes aux outils numériques utiles : organisation, communication, visibilité, gestion et productivité.', topics: ['Outils digitaux', 'Organisation numérique', 'Visibilité professionnelle'] },
];

export const FORMATS = [
  { n: '01', tag: 'Format ciblé', icon: Zap, title: 'Atelier court', text: 'Pour traiter un besoin précis : pitch, entretien, posture, vente, relation client ou digital.' },
  { n: '02', tag: 'Format intensif', icon: Clock, title: 'Journée intensive', text: 'Une journée complète avec théorie utile, exercices, mises en situation et restitution.' },
  { n: '03', tag: 'Format sur mesure', icon: Building2, title: 'Programme entreprise', text: 'Formation conçue pour une équipe, un service ou une organisation avec objectifs définis.' },
  { n: '04', tag: 'Format parcours', icon: GraduationCap, title: 'Parcours jeunes talents', text: 'Préparation à l’emploi, posture professionnelle, CV, entretien, confiance et mise en relation.' },
];

export const STEPS = [
  { icon: Search, title: 'Diagnostic du besoin', text: 'Nous clarifions le public, les attentes, les difficultés rencontrées et les résultats souhaités.' },
  { icon: PenTool, title: 'Adaptation du programme', text: 'Nous adaptons les modules, les exemples, les exercices et les supports au contexte réel.' },
  { icon: MessageSquareText, title: 'Animation & mise en situation', text: 'La formation alterne contenu, échanges, cas pratiques, simulations et exercices guidés.' },
  { icon: FileCheck2, title: 'Restitution & recommandations', text: 'Une restitution, des axes de progression et une attestation selon le format.' },
];

// Logo officiel : https://vigilus-facilities.com/media/site/logo.png
export const PARTNERS = [
  {
    name: 'VIGILUS Facilities', logo: '/logos/vigilus.png',
    text: 'VIGILUS a bénéficié de l’accompagnement de MCE pour développer les compétences de ses équipes en communication, en management et en coopération.',
    themes: ['Communication', 'Leadership', 'Prise de parole', 'Réunions'],
  },
];

export const SPACES = [
  { icon: ShieldCheck, role: 'Administrateur MCE', items: ['Crée les entreprises clientes', 'Gère formateurs et apprenants', 'Voit toute l’activité et tous les profils'] },
  { icon: UserCog, role: 'Formateur', items: ['Construit cours et modules', 'Ouvre les modules au bon moment', 'Suit, corrige et accompagne ses apprenants'] },
  { icon: User, role: 'Apprenant', items: ['Passe son test de profil', 'Suit ses formations et ses quiz', 'Voit son évolution et ses documents'] },
];

export const AUDIENCES = [
  { icon: Building2, t: 'Entreprises & PME' }, { icon: Landmark, t: 'Institutions' }, { icon: HandHeart, t: 'ONG' },
  { icon: School, t: 'Écoles & universités' }, { icon: Lightbulb, t: 'Entrepreneurs' }, { icon: GraduationCap, t: 'Jeunes talents' },
  { icon: Sparkles, t: 'Femmes porteuses de projet' },
];

export const STATS = [['3', 'pays d’implantation'], ['+50', 'clients accompagnés'], ['+20', 'partenaires stratégiques'], ['+20 ans', 'd’expérience']];

export const VALUES = [
  ['Notre vision', Globe2, 'Devenir le connecteur de référence entre l’Europe, le Maroc et l’Afrique de l’Ouest pour les talents et la transformation des organisations.'],
  ['Notre mission', Target, 'Apporter des solutions concrètes aux entreprises, institutions, ONG, écoles, universités et entrepreneurs pour structurer, former, recruter, digitaliser et accélérer leur croissance.'],
  ['Nos valeurs', Award, 'Excellence, transmission, proximité, innovation, inclusion et impact mesurable.'],
];

export const COUNTRIES = [
  { c: 'France', r: 'Siège & direction', items: ['Stratégie et partenariats internationaux', 'Conseil et accompagnement des entreprises', 'Formations & développement des talents'] },
  { c: 'Sénégal', r: 'Hub Afrique de l’Ouest', items: ['Accompagnement des PME & start-up', 'Développement des compétences et formations', 'Recrutement & placement de talents'] },
  { c: 'Maroc', r: 'Partenariats & développement régional', items: ['Conseil & accompagnement stratégique', 'Partenariats institutionnels & privés', 'Programmes de formation & RH'] },
];
