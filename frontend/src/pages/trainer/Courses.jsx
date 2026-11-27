import { useLocation as useWorkspaceLocation } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, FileText, GraduationCap,
  LockKeyhole, Plus, Search, Sparkles, UsersRound, Volume2, MessageSquareText,
  ShieldCheck, Mic2, Presentation, Clock3, CircleHelp,
} from 'lucide-react';
import TrainingCalendar from '../../components/TrainingCalendar';
import { moduleTitle, scheduleLabel } from '../../lib/moduleSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { EmptyState, Field, Modal, PageLoader } from '../../components/ui';

const MAIN_ICONS = [MessageSquareText, UsersRound, ShieldCheck, Mic2, Presentation];
const FOLLOWUP = ['J+7', 'J+14', 'J+21', 'J+30'];
const contentCount = (module, type) => (module.lessons || []).filter(l => type === 'lesson' ? !['quiz','exercise'].includes(l.type) : l.type === type).length;
const isFollowup = (m) => /\bJ\s*\+\s*(7|14|21|30)\b/i.test(m.title);

function ModuleCard({ module, courseId, index, followup, onPlan }) {
  const base = useWorkspaceLocation().pathname.startsWith('/admin/') ? '/admin' : '/formateur';
  const Icon = followup ? CalendarDays : MAIN_ICONS[index % MAIN_ICONS.length];
  const lessons = module.lessons || [];
  return (
    <div className="flex min-w-0 flex-col gap-2">
    <Link to={`${base}/cours/${courseId}/modules/${module.id}`}
      className="group flex min-w-0 h-full flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-sky-100">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><Icon className="h-6 w-6" /></span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{followup ? 'SUIVI' : `MODULE ${String(index + 1).padStart(2,'0')}`}</span>
      </div>
      <h3 className="mt-5 break-words text-lg font-extrabold leading-snug text-[#0b2341] group-hover:text-sky-700">{moduleTitle(module.title)}</h3>
      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-sky-700 capitalize"><CalendarDays size={16}/>{scheduleLabel(module.scheduled_date)}</p>
      <p className="mt-2 line-clamp-2 min-h-[36px] text-sm leading-relaxed text-slate-500">{module.description || 'Leçons, mises en situation et évaluation du module.'}</p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5"><BookOpen className="mr-1 inline h-3.5 w-3.5" />{contentCount(module,'lesson')} contenu(s)</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5"><ClipboardCheck className="mr-1 inline h-3.5 w-3.5" />{contentCount(module,'quiz')} quiz</span>
        <span className="rounded-lg bg-slate-50 px-2.5 py-1.5"><FileText className="mr-1 inline h-3.5 w-3.5" />{contentCount(module,'exercise')} mission(s)</span>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-sky-700" style={{ marginTop: 24 }}>
        Ouvrir le tableau du module <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
    <button type="button" className="btn-secondary w-full" onClick={()=>onPlan(module)}><CalendarDays size={16}/> {module.scheduled_date?"Modifier la date":"Planifier la séance"}</button>
    </div>
  );
}

export default function TrainerCourses() {
  const base = useWorkspaceLocation().pathname.startsWith('/admin/') ? '/admin' : '/formateur';
  const { activeCompanyId, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [calendarOpen,setCalendarOpen]=useState(false);
  const [planning,setPlanning]=useState(null);
  const [date,setDate]=useState('');
  const [savingDate,setSavingDate]=useState(false);
  const openPlan=(m,d)=>{setCalendarOpen(false);setPlanning(m);setDate(d ?? m.scheduled_date ?? '');};
  const saveDate=async()=>{if(!planning)return;setSavingDate(true);try{const {data,error}=await db.from('modules').update({scheduled_date:date||null}).eq('id',planning.id).eq('course_id',courseId).select('id,scheduled_date').single();if(error)throw error;setModules(old=>old.map(m=>m.id===data.id?{...m,scheduled_date:data.scheduled_date}:m));setPlanning(null);toast.success('Calendrier enregistré');}catch(e){toast.error(e.message);}finally{setSavingDate(false);}};
  const [modal, setModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', subtitle: '', category: '', level: 'debutant' });

  const loadCourses = useCallback(async () => {
    if (!activeCompanyId) { setLoading(false); return; }
    setLoading(true);
    const { data, error: e } = await db.from('courses').select('*').eq('company_id', activeCompanyId).order('created_at', { ascending: false });
    if (e) setError(e.message); else { setError(''); setCourses(data || []); setCourseId(old => (data || []).some(c=>c.id===old) ? old : ((data || []).find(c=>/VIGILUS IMPACT/i.test(c.title)) || data?.[0])?.id || ''); }
    setLoading(false);
  }, [activeCompanyId]);
  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => {
    if (!courseId) { setModules([]); return; }
    let valid = true;
    db.from('modules').select('*,lessons(id,title,type,position)').eq('course_id',courseId).order('position').then(({data,error:e}) => {
      if (!valid) return;
      if (e) { setError(e.message); setModules([]); }
      else setModules((data||[]).map(m=>({...m,lessons:(m.lessons||[]).sort((a,b)=>a.position-b.position)})));
    });
    return () => { valid = false; };
  }, [courseId]);

  const course = courses.find(c=>c.id===courseId);
  const ordered = useMemo(()=>modules.filter(m=>(m.title+' '+(m.description||'')).toLowerCase().includes(query.trim().toLowerCase())),[modules,query]);
  const main = ordered.filter(m=>!isFollowup(m));
  const followups = ordered.filter(isFollowup);
  const create = async (e) => {
    e.preventDefault(); setCreating(true);
    const {data,error:e2} = await db.from('courses').insert({...form,company_id:activeCompanyId,created_by:profile.id}).select().single();
    if (e2) toast.error(e2.message);
    else { await db.from('modules').insert({course_id:data.id,title:'Module 1',position:0}); toast.success('Formation créée en brouillon'); setModal(false); navigate(`${base}/cours/${data.id}`); }
    setCreating(false);
  };
  if (loading) return <PageLoader />;
  return <div className="min-w-0 space-y-5 pb-10 sm:space-y-7">
    <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
      <div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-sky-700">MCE Academy · Pilotage pédagogique</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0b2341]">Mes formations</h1><p className="mt-2 text-sm text-slate-500">Une carte par module. Un espace de travail clair pour chaque séance.</p></div>
      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex sm:shrink-0"><button type="button" disabled={!courseId || !modules.length} onClick={()=>setCalendarOpen(true)} className="btn-secondary min-h-11"><CalendarDays className="h-4 w-4 shrink-0"/> Planifier</button><button onClick={()=>base==='/admin'?navigate('/admin/studio'):setModal(true)} className="btn-primary min-h-11"><Plus className="h-4 w-4 shrink-0" /> Nouvelle formation</button></div>
    </header>
    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Impossible de charger les données : {error}</div>}
    {courses.length === 0 ? <EmptyState icon={GraduationCap} title="Aucune formation" description="Le programme importé apparaîtra ici une fois rattaché à cette entreprise." /> : <>
      {courses.length > 1 && <div className="rounded-2xl border border-slate-200 bg-white p-4"><label htmlFor="v3course" className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Sélectionner une formation</label><select id="v3course" className="input min-w-0 max-w-full sm:max-w-xl" value={courseId} onChange={e=>setCourseId(e.target.value)}>{courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div>}
      <section className="overflow-hidden rounded-[28px] bg-[#102941] p-4 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-300">Programme sélectionné</p><h2 className="mt-2 text-2xl font-extrabold">{course?.title}</h2><p className="mt-2 max-w-2xl text-sm text-slate-300">{course?.subtitle || 'Parcours immersif · théorie courte, pratique et débriefing.'}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${course?.is_published?'bg-emerald-200 text-emerald-900':'bg-amber-200 text-amber-900'}`}>{course?.is_published?'Publié':'Brouillon · non publié'}</span></div>
        <div className="mt-6 flex flex-wrap gap-3"><span className="rounded-xl bg-white/10 px-4 py-2 text-sm"><strong>{main.length}</strong> modules principaux</span><span className="rounded-xl bg-white/10 px-4 py-2 text-sm"><strong>{followups.length}</strong> étapes de suivi</span><span className="rounded-xl bg-white/10 px-4 py-2 text-sm"><strong>{modules.reduce((a,m)=>a+m.lessons.length,0)}</strong> éléments pédagogiques</span></div>
        <div className="mt-5"><Link to={`${base}/cours/${courseId}`} className="inline-flex items-center gap-2 text-sm font-bold text-sky-200 hover:text-white">Modifier le programme général <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
      
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5"><Search className="h-5 w-5 text-slate-400" /><input className="min-w-0 w-full border-0 bg-transparent py-1 text-sm outline-none" placeholder="Rechercher un module, un thème..." value={query} onChange={e=>setQuery(e.target.value)} /></div>
      <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-extrabold text-[#102941]">Modules de formation</h2><p className="mt-1 text-sm text-slate-500">Cliquez sur une carte pour les contenus, les résultats et le déblocage.</p></div><span className="text-xs font-bold text-slate-400">{main.length} module(s)</span></div>{main.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{main.map((mod,i)=><ModuleCard key={mod.id} module={mod} index={modules.indexOf(mod)} courseId={courseId} onPlan={openPlan}/>)}</div> : <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Aucun module correspondant.</p>}</section>
      {followups.length > 0 && <section className="space-y-4"><div><h2 className="text-xl font-extrabold text-[#102941]">Consolidation · J+30</h2><p className="mt-1 text-sm text-slate-500">Réactivation des acquis, défis terrain et bilan final.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{followups.map((mod,i)=><ModuleCard key={mod.id} module={mod} index={i} courseId={courseId} followup onPlan={openPlan} />)}</div></section>}
      <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4 text-sm text-sky-950"><Sparkles className="h-5 w-5 shrink-0 text-sky-700" /><p>Chaque module possède sa propre fiche. Le déblocage des apprenants reste indépendant de la publication générale du cours.</p></div>
    </>}
    <Modal open={calendarOpen} onClose={()=>setCalendarOpen(false)} title="Planifier les séances" size="lg">
      {calendarOpen && <TrainingCalendar key={courseId} modules={modules} onPlan={openPlan}/>}
    </Modal>
    <Modal open={!!planning} onClose={()=>!savingDate&&setPlanning(null)} title="Planifier la séance" description={planning?moduleTitle(planning.title):''}><div className="space-y-4"><Field label="Date de formation"><input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)}/></Field><p className="text-sm text-slate-500">Cette date ne change pas le déblocage des contenus.</p><div className="flex flex-wrap gap-2"><button type="button" className="btn-primary" disabled={savingDate} onClick={saveDate}>{savingDate?'Enregistrement…':'Enregistrer'}</button><button type="button" className="btn-secondary" disabled={savingDate} onClick={()=>setDate('')}>Effacer la date</button></div></div></Modal>
    <Modal open={modal} onClose={()=>setModal(false)} title="Créer une formation"><form onSubmit={create} className="space-y-4"><Field label="Titre *"><input className="input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></Field><Field label="Sous-titre"><input className="input" value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})}/></Field><Field label="Catégorie"><input className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></Field><button disabled={creating} className="btn-primary w-full justify-center">{creating?'Création...':'Créer en brouillon'}</button></form></Modal>
  </div>;
}
