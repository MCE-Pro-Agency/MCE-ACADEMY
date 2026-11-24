import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LearnerTabsCardV6 from '../../components/LearnerTabsCardV6';

/**
 * V6 : septième onglet autonome de l'espace Formateur.
 * Les droits sont appliqués au niveau de l'entreprise sélectionnée.
 * N'altère ni les fiches apprenants, ni les modules, ni les résultats.
 */
export default function AccessManagement() {
  const { activeCompanyId, authorizedCompanies, companiesLoading } = useAuth();
  const company = authorizedCompanies.find((c) => c.id === activeCompanyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-sky-100 p-3 text-sky-700">
          <LockKeyhole className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600">Espace formateur</p>
          <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">Gestion des accès</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ouvrez ou fermez les onglets des apprenants, entreprise par entreprise.
          </p>
        </div>
      </div>

      {!activeCompanyId && !companiesLoading ? (
        <div className="card p-6 text-sm text-slate-600" role="status">
          Sélectionnez une entreprise dans le menu de gauche pour gérer les accès de ses apprenants.
        </div>
      ) : activeCompanyId ? (
        <>
          <p className="text-sm text-slate-600">
            Entreprise sélectionnée : <strong>{company?.name || 'Entreprise'}</strong>
          </p>
          <LearnerTabsCardV6 companyId={activeCompanyId} />
        </>
      ) : (
        <div className="card p-6 text-sm text-slate-600" role="status">
          Chargement des entreprises autorisées…
        </div>
      )}
    </div>
  );
}
