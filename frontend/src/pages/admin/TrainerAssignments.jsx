import {useAdminConfirm} from '../../components/layout/AdminConfirm';
import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, RefreshCcw, ShieldCheck, Users, BookOpen, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/db';

const errorText = e => e?.message || String(e || 'Erreur inconnue');
export default function TrainerAssignments() {
  const ask=useAdminConfirm();
  const [companies, setCompanies] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [links, setLinks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseLinks, setCourseLinks] = useState([]);
  const [courseLinksAvailable, setCourseLinksAvailable] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('');
  const [opened, setOpened] = useState('');

  async function load() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        db.from('companies').select('id,name,is_active,join_code').order('name'),
        db.from('profiles').select('id,full_name,email,company_id').eq('role','trainer').order('full_name'),
        db.from('trainer_companies').select('trainer_id,company_id'),
        db.from('courses').select('id,title,company_id').order('title'),
        db.from('trainer_courses').select('trainer_id,course_id'),
      ]);
      const setters=[setCompanies,setTrainers,setLinks,setCourses,setCourseLinks];
      const names=['Entreprises','Formateurs','Affectations','Formations','Affectations par formation'];
      const errs=[];
      results.forEach((r,i) => {
        if(r.status==='rejected') {setters[i]([]);if(i!==4) errs.push(names[i]+' : '+errorText(r.reason));return;}
        const {data,error}=r.value;
        setters[i](error?[]:(data||[]));
        if(i===4) setCourseLinksAvailable(!error);
        else if(error) errs.push(names[i]+' : '+errorText(error));
      });
      setErrors(errs);
    } catch(e) {setErrors([errorText(e)]);} finally {setLoading(false);}
  }
  useEffect(()=>{load();},[]);
  useEffect(()=>{if(companies.length && !companies.some(c=>c.id===opened)) setOpened(companies[0].id);},[companies,opened]);
  const matching = useMemo(()=>companies.filter(c=>c.name.toLowerCase().includes(filter.toLowerCase())),[companies,filter]);
  const isCompanyAssigned = (t,c) => t.company_id===c.id || links.some(a=>a.company_id===c.id&&a.trainer_id===t.id);
  const toggleCompany = async(t,c) => {
    const key='company:'+c.id+':'+t.id;
    if(busy) return;
    const present=links.some(a=>a.company_id===c.id&&a.trainer_id===t.id);
    if(t.company_id===c.id) return;
    if(present && !await ask(`Retirer ${t.full_name||t.email} de ${c.name} ?`)) return;
    setBusy(key);
    try {
      const {error}=present ? await db.from('trainer_companies').delete().eq('trainer_id',t.id).eq('company_id',c.id) : await db.from('trainer_companies').insert({trainer_id:t.id,company_id:c.id});
      if(error) throw error;
      toast.success(present?'Affectation retirée':'Formateur ajouté à cette entreprise');
      await load();
    } catch(e){toast.error(errorText(e));} finally{setBusy('');}
  };
  const toggleCourse=async(t,course)=>{
    if(busy || !courseLinksAvailable) return;
    const company=companies.find(c=>c.id===course.company_id);
    if(!company || !isCompanyAssigned(t,company)) return toast.error('Affectez d’abord le formateur à cette entreprise.');
    const present=courseLinks.some(a=>a.course_id===course.id&&a.trainer_id===t.id);
    setBusy('course:'+course.id+':'+t.id);
    try {
      const {error}=present?await db.from('trainer_courses').delete().eq('trainer_id',t.id).eq('course_id',course.id):await db.from('trainer_courses').insert({trainer_id:t.id,course_id:course.id});
      if(error) throw error;
      toast.success(present?'Responsabilité retirée':'Formateur ajouté à cette formation');
      await load();
    } catch(e){toast.error(errorText(e));}finally{setBusy('');}
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between gap-3"><div><p className="eyebrow">Administration MCE</p><h1 className="page-title admin-page-title">Affectations des formateurs</h1><p className="page-subtitle">Plusieurs formateurs par entreprise et par formation, sans perdre les affectations existantes.</p></div><button className="btn-secondary" onClick={load} disabled={loading}><RefreshCcw className="h-4 w-4"/> Actualiser</button></div>
    {errors.length>0&&<div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex items-center gap-2 font-bold"><AlertTriangle size={18}/> Certaines données n’ont pas pu être chargées</div>{errors.map((x,i)=><p key={i} className="mt-1 break-words">{x}</p>)}</div>}
    {!courseLinksAvailable&&<div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700"><p className="font-bold">Affectation par formation non activée</p><p>Exécutez d’abord le script SQL optionnel « ADMIN_V2_FORMATEURS_PAR_FORMATION.sql » dans Supabase, puis actualisez. Les affectations par entreprise fonctionnent déjà sans ce script.</p></div>}
    <div className="flex gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700"><ShieldCheck className="h-5 w-5 shrink-0"/><span>Le rattachement par formation indique les formateurs responsables. Il ne restreint pas encore les droits du formateur déjà autorisé sur l’entreprise : ces droits existants sont conservés.</span></div>
    <input className="input max-w-lg" placeholder="Rechercher une entreprise…" value={filter} onChange={e=>setFilter(e.target.value)} />
    {loading?<p>Chargement…</p>:<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{matching.map(c=>{
      const n=trainers.filter(t=>isCompanyAssigned(t,c)).length;
      return <button type="button" key={c.id} onClick={()=>setOpened(c.id)} className={`rounded-2xl border p-4 text-left ${opened===c.id?'border-sky-500 bg-sky-50 ring-2 ring-sky-100':'border-slate-200 bg-white'}`}><div className="flex items-center gap-2 font-bold"><Building2 className="h-5 w-5"/>{c.name}</div><p className="mt-2 text-sm text-slate-500">{n} formateur(s) · {courses.filter(x=>x.company_id===c.id).length} formation(s)</p><p className="text-xs text-slate-500">{c.is_active?'Entreprise active':'Entreprise suspendue'}</p></button>;
    })}</div>}
    {companies.filter(c=>c.id===opened).map(c=><section key={c.id} className="card space-y-5 p-5"><h2 className="text-xl font-bold text-navy-900">{c.name} — équipe pédagogique</h2>
      <div><h3 className="mb-2 flex items-center gap-2 font-semibold"><Users className="h-4 w-4"/> Affecter des formateurs à l’entreprise</h3><p className="mb-3 text-sm text-slate-500">Cochez autant de comptes formateurs que nécessaire. Le formateur principal ne peut être retiré ici.</p>
      <div className="grid gap-3 md:grid-cols-2">{trainers.map(t=>{const checked=isCompanyAssigned(t,c);const primary=t.company_id===c.id;return <label key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={checked} disabled={!!busy||primary} onChange={()=>toggleCompany(t,c)} className="h-4 w-4"/><span className="min-w-0 flex-1"><span className="block font-semibold">{t.full_name||t.email}</span><span className="block truncate text-xs text-slate-500">{t.email}</span></span>{primary?<span className="text-xs text-slate-500">Principal</span>:checked?<CheckCircle2 className="h-4 w-4 text-emerald-600"/>:null}</label>})}</div>
      {!trainers.length&&<p className="text-sm text-slate-500">Aucun compte formateur chargé. Vérifiez les comptes et les erreurs de chargement.</p>}</div>
      <div><h3 className="mb-3 flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4"/> Répartition par formation</h3>
      {courses.filter(course=>course.company_id===c.id).map(course=><div key={course.id} className="mb-3 rounded-xl border border-slate-200 p-4"><p className="mb-2 font-semibold">{course.title}</p><div className="grid gap-2 md:grid-cols-2">{trainers.filter(t=>isCompanyAssigned(t,c)).map(t=><label key={t.id} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!courseLinksAvailable||!!busy} checked={courseLinks.some(a=>a.course_id===course.id&&a.trainer_id===t.id)} onChange={()=>toggleCourse(t,course)}/><span>{t.full_name||t.email}</span></label>)}</div>{!trainers.some(t=>isCompanyAssigned(t,c))&&<p className="text-xs text-slate-500">Ajoutez d’abord un formateur à l’entreprise.</p>}</div>)}
      {!courses.some(course=>course.company_id===c.id)&&<p className="text-sm text-slate-500">Aucune formation rattachée à cette entreprise.</p>}</div>
    </section>)}
  </div>;
}
