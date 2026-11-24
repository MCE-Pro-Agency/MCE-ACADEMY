import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/db';

export default function TrainerAssignments(){
  const [companies,setCompanies]=useState([]);
  const [trainers,setTrainers]=useState([]);
  const [links,setLinks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState('');
  const [filter,setFilter]=useState('');
  const load=async()=>{
    setLoading(true);
    const [c,t,l]=await Promise.all([
      db.from('companies').select('id,name,is_active,join_code').order('name'),
      db.from('profiles').select('id,full_name,email,company_id').eq('role','trainer').order('full_name'),
      db.from('trainer_companies').select('trainer_id,company_id')
    ]);
    if(c.error||t.error||l.error) toast.error('Vérifiez la migration SQL 004 : '+(c.error||t.error||l.error).message);
    setCompanies(c.data||[]);setTrainers(t.data||[]);setLinks(l.data||[]);setLoading(false);
  };
  useEffect(()=>{load()},[]);
  const selected=useMemo(()=>companies.filter(c=>c.name.toLowerCase().includes(filter.toLowerCase())),[companies,filter]);
  const toggle=async(trainer,company)=>{
    const key=trainer.id+':'+company.id;
    const on=links.some(x=>x.trainer_id===trainer.id&&x.company_id===company.id);
    setBusy(key);
    const result=on
      ? await db.from('trainer_companies').delete().eq('trainer_id',trainer.id).eq('company_id',company.id)
      : await db.from('trainer_companies').insert({trainer_id:trainer.id,company_id:company.id});
    setBusy('');
    if(result.error) return toast.error(result.error.message);
    toast.success(on ? 'Affectation retirée' : 'Entreprise attribuée au formateur');
    await load();
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">Administration MCE</p><h1 className="page-title">Affectations des formateurs</h1>
      <p className="page-subtitle">Un formateur peut intervenir dans plusieurs entreprises. Seul le Super Admin décide des affectations.</p></div>
      <button className="btn-secondary" onClick={load}><RefreshCw className="h-4 w-4"/> Actualiser</button>
    </div>
    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700 flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-sky-700"/>
    Les formations, évaluations et apprenants restent séparés par entreprise. Le formateur conserve ses droits de création et de pilotage dans chaque entreprise attribuée.</div>
    <input className="input max-w-lg" placeholder="Rechercher une entreprise…" value={filter} onChange={e=>setFilter(e.target.value)}/>
    {loading ? <p>Chargement des affectations…</p> : selected.length===0 ? <p>Aucune entreprise trouvée.</p> :
      <div className="grid gap-5 lg:grid-cols-2">{selected.map(c=><section key={c.id} className="card p-5 space-y-4">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-slate-100 p-3"><Building2 className="h-5 w-5 text-sky-700"/></div><div className="flex-1"><h2 className="font-bold text-navy-900">{c.name}</h2><p className="text-xs text-slate-500">{c.is_active?'Entreprise active':'Entreprise suspendue'}</p></div></div>
        <div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-500">Code d’inscription</span><p className="font-mono text-sm font-bold">{c.join_code||'Non défini'}</p></div>
        <p className="text-sm font-semibold text-navy-800 flex items-center gap-2"><Users className="h-4 w-4"/> Formateurs autorisés</p>
        {trainers.length===0?<p className="text-sm text-slate-500">Créez d’abord un compte formateur dans Administration → Formateurs.</p>:<div className="space-y-2">{trainers.map(t=>{
          const checked=links.some(x=>x.trainer_id===t.id&&x.company_id===c.id)||t.company_id===c.id;
          const primary=t.company_id===c.id;
          return <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
            <input type="checkbox" checked={checked} disabled={busy!==''||primary} onChange={()=>toggle(t,c)} className="h-4 w-4"/>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{t.full_name||t.email}</span><span className="block truncate text-xs text-slate-500">{t.email}</span></span>
            {primary?<span className="text-[11px] text-slate-400">Rattachement principal</span>:checked?<Check className="h-4 w-4 text-emerald-600"/>:null}
          </label>})}</div>}
      </section>)}</div>}
    </div>;
}
