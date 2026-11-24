/* Page d'un onglet de l'espace Apprenant (Parcours, Cours, Quiz, Exercices, Documents, Annonces).
   Onglet fermé : l'apprenant voit un cadenas. Le formateur ou l'admin en aperçu voit un bandeau.
   Le contenu de chaque onglet sera branché à l'étape suivante. */
import { Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LEARNER_TABS, isTabOpen } from '../../lib/learnerTabs';

export default function LearnerTab({ tabKey }) {
  const { company, isLearner } = useAuth();
  const tab = LEARNER_TABS.find((t) => t.key === tabKey);
  const open = isTabOpen(company, tabKey);
  const Icon = tab.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>
        <div>
          <p className="eyebrow">Ma formation</p>
          <h1 className="page-title">{tab.label}</h1>
          <p className="page-subtitle">{tab.desc}</p>
        </div>
      </div>

      {!open && !isLearner && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Aperçu : cet onglet est <b>fermé pour les apprenants</b>. Ouvrez-le depuis <i>Profils professionnels → Onglets de l’espace Apprenant</i>.
        </p>
      )}

      {!open && isLearner ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"><Lock className="h-8 w-8 text-slate-400" /></span>
          <p className="mt-4 text-lg font-bold text-navy-900">Bientôt disponible</p>
          <p className="mt-1 max-w-md text-sm text-slate-500">Cet espace sera ouvert par votre formateur au moment prévu dans votre formation. En attendant, commencez par votre test de profil professionnel.</p>
        </div>
      ) : (
        <div className="card flex flex-col items-center p-12 text-center">
          <Sparkles className="h-10 w-10 text-brand-400" />
          <p className="mt-4 text-lg font-bold text-navy-900">Contenu en préparation</p>
          <p className="mt-1 max-w-md text-sm text-slate-500">Les contenus de cet onglet apparaîtront ici dès que votre formateur les aura publiés.</p>
        </div>
      )}
    </div>
  );
}
