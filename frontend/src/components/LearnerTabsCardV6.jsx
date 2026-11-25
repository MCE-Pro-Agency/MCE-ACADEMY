/**
 * MCE Academy V6 — Ouverture / fermeture des six onglets par entreprise.
 * Source : companies.learner_tabs (jsonb), confirmée par la note technique du 24/11/2026.
 * Le profil professionnel n'est pas verrouillé ici.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { LockKeyhole, UnlockKeyhole, RefreshCw, AlertCircle, Building2 } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

const TABS = [
  { key: 'parcours', label: 'Mon parcours', description: 'Parcours de formation' },
  { key: 'cours', label: 'Mes cours', description: 'Leçons, textes et vidéos' },
  { key: 'quiz', label: 'Quiz', description: 'Questionnaires et évaluations' },
  { key: 'exercices', label: 'Exercices', description: 'Mises en pratique' },
  { key: 'documents', label: 'Documents', description: 'Supports et documents' },
  { key: 'annonces', label: 'Annonces', description: 'Informations des formateurs' },
];

export default function LearnerTabsCardV6({ companyId }) {
  const { authorizedCompanies, isAdmin, isTrainer } = useAuth();
  const [tabs, setTabs] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const currentCompanyRef = useRef(companyId);
  currentCompanyRef.current = companyId;

  const company = authorizedCompanies.find((c) => c.id === companyId);
  const allowed = Boolean(companyId && (isAdmin || isTrainer) && company);

  const refresh = useCallback(async () => {
    const requestedId = companyId;
    if (!requestedId) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: queryError } = await db
        .from('companies')
        .select('id,learner_tabs')
        .eq('id', requestedId)
        .single();
      if (queryError) throw queryError;
      if (currentCompanyRef.current !== requestedId) return;
      setTabs(data?.learner_tabs || {});
    } catch (err) {
      if (currentCompanyRef.current !== requestedId) return;
      setTabs(null);
      setError(err?.message || 'Impossible de lire les autorisations.');
    } finally {
      if (currentCompanyRef.current === requestedId) setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    setTabs(null);
    setError('');
    if (allowed) refresh();
  }, [allowed, refresh]);

  async function changeTabs(key, desired) {
    if (!allowed || saving || loading || tabs === null) return;
    const requestedId = companyId;
    setSaving(true);
    setError('');
    try {
      // Relire avant l'écriture : learner_tabs est un objet JSON remplacé en entier.
      const { data: fresh, error: readError } = await db
        .from('companies')
        .select('id,learner_tabs')
        .eq('id', requestedId)
        .single();
      if (readError) throw readError;
      if (currentCompanyRef.current !== requestedId) return;
      const next = { ...(fresh?.learner_tabs || {}), [key]: desired };
      const { data: updated, error: writeError } = await db
        .from('companies')
        .update({ learner_tabs: next })
        .eq('id', requestedId)
        .select('id,learner_tabs')
        .single();
      if (writeError) throw writeError;
      if (currentCompanyRef.current !== requestedId) return;
      setTabs(updated?.learner_tabs || {});
    } catch (err) {
      if (currentCompanyRef.current !== requestedId) return;
      setError(err?.message || 'La modification a échoué.');
      await refresh();
    } finally {
      if (currentCompanyRef.current === requestedId) setSaving(false);
    }
  }

  // Si le Super Admin n'a pas choisi d'entreprise, ne rien afficher.
  if (!companyId) return null;
  if (!allowed) return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
      Cette entreprise ne fait pas partie des entreprises autorisées pour ce compte.
    </p>
  );

  const openedCount = TABS.filter((tab) => tabs?.[tab.key] === true).length;
  return (
    <section className="card space-y-5 p-5 sm:p-6" aria-label="Onglets de l'espace Apprenant">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
            <Building2 className="h-4 w-4" /> {company?.name || 'Entreprise'}
          </div>
          <h2 className="mt-2 text-xl font-bold text-navy-900">Onglets de l'espace Apprenant</h2>
          <p className="mt-1 text-sm text-slate-500">{tabs === null ? 'Chargement des autorisations…' : `${openedCount} / 6 onglets ouverts`}. Le test de profil reste toujours accessible.</p>
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={refresh} disabled={loading || saving}>
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TABS.map(({ key, label, description }) => {
          const open = tabs?.[key] === true;
          return (
            <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="min-w-0">
                <p className="font-bold text-navy-900">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                <span className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${open ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {open ? <UnlockKeyhole className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                  {open ? 'Ouvert' : 'Fermé'}
                </span>
              </div>
              <button type="button" aria-label={`${open ? 'Fermer' : 'Ouvrir'} ${label}`} aria-pressed={open}
                onClick={() => changeTabs(key, !open)} disabled={loading || saving || tabs === null}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${open ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-navy-900 text-white hover:bg-navy-800'}`}>
                {saving ? 'Patientez…' : open ? 'Fermer' : 'Ouvrir'}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Ces réglages s'appliquent à tous les apprenants de l'entreprise sélectionnée. Pour voir une leçon, l'onglet ET le module doivent être ouverts. Après modification, l'apprenant actualise sa page pour mettre à jour le cadenas du menu.</p>
    </section>
  );
}
