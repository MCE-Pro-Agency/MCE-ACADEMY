/* Formateur / admin : ouvrir ou fermer les onglets de l'espace Apprenant pour une entreprise.
   Écrit companies.learner_tabs ; la base refuse l'accès aux contenus d'un onglet fermé. */
import { useEffect, useState } from 'react';
import { Lock, LockOpen, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../lib/db';
import { LEARNER_TABS } from '../lib/learnerTabs';
import { cn } from '../lib/utils';

export default function LearnerTabsCard({ companyId }) {
  const [tabs, setTabs] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (companyId) db.from('companies').select('learner_tabs').eq('id', companyId).single().then(({ data }) => setTabs(data?.learner_tabs || {}));
  }, [companyId]);

  if (!tabs) return null;
  const openCount = LEARNER_TABS.filter((t) => tabs[t.key] === true).length;

  const toggle = async (key) => {
    const next = { ...tabs, [key]: !(tabs[key] === true) };
    setSaving(key);
    const { error } = await db.from('companies').update({ learner_tabs: next }).eq('id', companyId);
    setSaving(null);
    if (error) return toast.error(error.message);
    setTabs(next);
    toast.success(next[key] ? 'Onglet ouvert aux apprenants' : 'Onglet fermé aux apprenants');
  };

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white"><LayoutGrid className="h-5 w-5" /></span>
          <div>
            <p className="font-bold text-navy-900">Onglets de l’espace Apprenant</p>
            <p className="text-sm text-slate-500">Le test de profil reste toujours ouvert. Les autres onglets s’ouvrent quand vous le décidez.</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{openCount} / {LEARNER_TABS.length} ouverts</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNER_TABS.map(({ key, label, icon: Icon, desc }) => {
          const open = tabs[key] === true;
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              disabled={saving === key}
              className={cn('flex items-start gap-3 rounded-2xl p-4 text-left ring-1 transition', open ? 'bg-emerald-50 ring-emerald-200 hover:ring-emerald-300' : 'bg-slate-50 ring-slate-200 hover:ring-slate-300')}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', open ? 'text-emerald-600' : 'text-slate-400')} />
              <span className="flex-1">
                <span className="block text-sm font-bold text-navy-900">{label}</span>
                <span className="block text-xs text-slate-500">{desc}</span>
              </span>
              <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', open ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600')}>
                {open ? <><LockOpen className="h-3.5 w-3.5" /> Ouvert</> : <><Lock className="h-3.5 w-3.5" /> Fermé</>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
