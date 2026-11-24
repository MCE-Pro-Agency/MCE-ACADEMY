/* Onglets de l'espace Apprenant, ouverts ou fermés par le formateur pour son entreprise.
   Réglage : companies.learner_tabs (supabase/003_formateur_deblocage_documents.sql).
   Le verrou est appliqué par la base (RLS) : cet écran ne fait qu'afficher le cadenas. */
import { BookOpen, ClipboardCheck, FolderOpen, Megaphone, PenLine, Route } from 'lucide-react';

export const LEARNER_TABS = [
  { key: 'parcours', to: '/app/parcours', label: 'Mon parcours', icon: Route, desc: 'Les modules dans l’ordre, votre progression et la prochaine étape.' },
  { key: 'cours', to: '/app/cours', label: 'Mes cours', icon: BookOpen, desc: 'Les leçons de chaque module : textes, vidéos et mémos.' },
  { key: 'quiz', to: '/app/quiz', label: 'Quiz', icon: ClipboardCheck, desc: 'Le quiz de chaque module, vos notes et vos tentatives.' },
  { key: 'exercices', to: '/app/exercices', label: 'Exercices', icon: PenLine, desc: 'Les exercices à rendre et le retour de votre formateur.' },
  { key: 'documents', to: '/app/documents', label: 'Documents', icon: FolderOpen, desc: 'Les supports et fiches à télécharger.' },
  { key: 'annonces', to: '/app/annonces', label: 'Annonces', icon: Megaphone, desc: 'Les messages de votre formateur.' },
];

/** Onglet ouvert pour les apprenants de l'entreprise ? (clé absente = fermé) */
export const isTabOpen = (company, key) => company?.learner_tabs?.[key] === true;
