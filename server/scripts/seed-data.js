import { vigilusImpact } from './content/vigilus-impact.js';

// Données de démonstration MCE Academy · VIGILUS IMPACT
// Le contenu de la formation est dans ./content/vigilus-impact.js (construit à partir du kit MCE)
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

export const demoCourses = [vigilusImpact];

/** Documents de l'espace « Mes documents » (fichiers servis depuis frontend/public/documents) */
export const demoDocuments = [
  {
    kind: 'support',
    title: 'Support participants — Méthode C.L.E.F.',
    description: 'Diaporama de la formation (PDF)',
    file_url: '/documents/MCE_CLEF_Support_Participants.pdf',
    is_available: true,
  },
  {
    kind: 'livret',
    title: 'Livret des 20 mémos MCE C.L.E.F.',
    description: 'Tous les mémos réunis (PDF)',
    file_url: '/documents/MCE_Livret_20_Memos.pdf',
    is_available: true,
  },
];

export const demoAnnouncements = [
  {
    title: 'Bienvenue sur MCE Academy !',
    body: 'Votre espace VIGILUS IMPACT est ouvert. Commencez par votre profil professionnel, puis le module du lundi. Les modules suivants s’ouvriront jour après jour.',
  },
  {
    title: 'Journée vidéo jeudi',
    body: 'Préparez votre message de 90 secondes : premier passage filmé le matin, second passage l’après-midi (missions Miroir Vocal).',
  },
];
