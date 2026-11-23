/* Interrupteur formateur / admin : ouvrir l'espace apprenant complet ou ne laisser que le test de profil */
import { useEffect, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { LEARNER_SPACES } from '../lib/learnerSpace';
import { cn } from '../lib/utils';

export default function LearnerSpaceSwitch({ companyId, stats }) {
  const { loadProfile, profile } = useAuth();
  const [mode, setMode] = useState(null);

  useEffect(() => {
    if (companyId) db.from('companies').select('learner_space').eq('id', companyId).single().then(({ data }) => setMode(data?.learner_space || 'complet'));
  }, [companyId]);

  const change = async (next) => {
    if (next === mode) return;
    const msg = next === 'complet'
      ? 'Ouvrir l’espace complet ? Les apprenants verront leur programme, les modules ouverts, les mémos et leurs documents.'
      : 'Revenir au mode « test uniquement » ? Les apprenants ne verront plus que leur test de profil.';
    if (!confirm(msg)) return;
    const { error } = await db.from('companies').update({ learner_space: next }).eq('id', companyId);
    if (error) return toast.error(error.message);
    setMode(next);
    toast.success(next === 'complet' ? 'Espace apprenant complet ouvert' : 'Seul le test de profil est ouvert');
    if (profile?.company_id === companyId) loadProfile?.(profile.id);
  };

  if (!mode) return null;
  const testOnly = mode === 'test';
  return (
    <div className={cn('flex flex-col gap-4 rounded-3xl p-6 ring-1 lg:flex-row lg:items-center', testOnly ? 'bg-amber-50 ring-amber-200' : 'bg-emerald-50 ring-emerald-200')}>
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white', testOnly ? 'bg-amber-500' : 'bg-emerald-500')}>
        {testOnly ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
      </span>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Espace apprenant</p>
        <p className="text-lg font-bold text-navy-900">{LEARNER_SPACES[mode].label}</p>
        <p className="text-sm text-slate-600">{LEARNER_SPACES[mode].hint}{stats ? ` · ${stats}` : ''}</p>
      </div>
      <div className="flex rounded-xl bg-white p-1 text-sm font-semibold shadow-sm ring-1 ring-slate-200">
        {Object.entries(LEARNER_SPACES).map(([k, v]) => (
          <button key={k} onClick={() => change(k)} className={cn('rounded-lg px-4 py-2 transition', mode === k ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800')}>
            {k === 'test' ? '🧭 Test uniquement' : '📚 Espace complet'}
          </button>
        ))}
      </div>
    </div>
  );
}
