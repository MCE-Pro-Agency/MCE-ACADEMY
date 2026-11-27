import { useLocation as useWorkspaceLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, FileQuestion, Plus, ArrowRight, Search, SlidersHorizontal, CalendarDays, Target, Pencil, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { PageLoader } from '../../components/ui';

function Stat({ icon: Icon, tone, value, label, to }) {
  const content = <><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-7 w-7"/></div><div className="min-w-0 border-l border-slate-200 pl-4"><p className="text-3xl font-bold leading-none text-navy-900 tabular-nums">{value}</p><p className="mt-1 text-sm text-navy-600">{label}</p></div>{to && <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-amber-600"/>}</>;
  const classes = 'flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card';
  return to ? <Link to={to} className={`${classes} transition hover:border-amber-300 hover:shadow-lift`}>{content}</Link> : <div className={classes}>{content}</div>;
}

function ActivityCard({ item }) {
  const base = useWorkspaceLocation().pathname.startsWith('/admin/') ? '/admin' : '/formateur';
  const quiz = item.type === 'quiz';
  const Icon = quiz ? FileQuestion : Target;
  const tone = quiz ? 'bg-brand-100 text-brand-700' : 'bg-violet-100 text-violet-700';
  return <Link to={`${base}/cours/${item.course_id}`} className="group flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:flex-row sm:items-center">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-6 w-6"/></div>
    <div className="min-w-0 flex-1"><p className="break-words text-sm font-bold leading-snug text-navy-900">{item.title}</p><div className="mt-1.5 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{quiz ? 'Quiz' : 'Exercice pratique'}</span>{quiz && item.passing_score != null && <span className="text-xs text-slate-600">Seuil : {item.passing_score}%</span>}</div><p className="mt-1.5 break-words text-xs text-slate-500">{item.courseTitle}</p></div>
    <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-brand-300 px-2.5 py-2 text-xs font-semibold text-brand-700 transition group-hover:bg-brand-50"><Pencil className="h-3.5 w-3.5"/> Modifier</span>
  </Link>;
}

export default function Exercises() {
  const base = useWorkspaceLocation().pathname.startsWith('/admin/') ? '/admin' : '/formateur';
  const { activeCompanyId } = useAuth();
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [course, setCourse] = useState('all');
  useEffect(() => {
    if (!activeCompanyId) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    Promise.all([
      db.from('courses').select('id, title').eq('company_id', activeCompanyId),
      db.from('exercise_submissions').select('id, course:courses!inner(company_id)', { count: 'exact', head: true }).eq('status', 'submitted').eq('course.company_id', activeCompanyId),
    ]).then(async ([coursesResult, submissionsResult]) => {
      if (!alive) return;
      if (coursesResult.error) toast.error(coursesResult.error.message);
      if (submissionsResult.error) toast.error(submissionsResult.error.message);
      const courses = coursesResult.data || [];
      setPending(submissionsResult.count || 0);
      if (!courses.length) { setItems([]); setLoading(false); return; }
      const { data, error } = await db.from('lessons').select('id, title, type, course_id, module_id, passing_score, duration_minutes').in('course_id', courses.map(c => c.id)).in('type', ['quiz', 'exercise']).order('created_at', { ascending: false });
      if (!alive) return;
      if (error) toast.error(error.message);
      setItems((data || []).map(l => ({ ...l, courseTitle: courses.find(c => c.id === l.course_id)?.title || 'Formation' })));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [activeCompanyId]);
  const quizCount = items.filter(i => i.type === 'quiz').length;
  const exerciseCount = items.filter(i => i.type === 'exercise').length;
  const courses = useMemo(() => [...new Map(items.map(i => [i.course_id, i.courseTitle])).entries()], [items]);
  const filtered = useMemo(() => items.filter(i => (kind === 'all' || i.type === kind) && (course === 'all' || i.course_id === course) && `${i.title} ${i.courseTitle}`.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr'))), [items, kind, course, search]);
  const groups = useMemo(() => {
    const result = new Map();
    for (const item of filtered) {
      const day = item.title.match(/\bJ\s*\+\s*(\d+)\b/i)?.[1];
      const key = `${item.course_id}:${day ? `J+${day}` : 'other'}`;
      if (!result.has(key)) result.set(key, { key, day: day ? Number(day) : null, courseTitle: item.courseTitle, items: [] });
      result.get(key).items.push(item);
    }
    return [...result.values()].sort((a,b) => (b.day ?? -1) - (a.day ?? -1));
  }, [filtered]);
  if (loading) return <PageLoader />;
  return <div className="space-y-5">
    <header className="relative isolate overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-r from-white via-white to-brand-50 px-5 py-6 sm:px-6">
      <svg aria-hidden="true" className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2 opacity-60" viewBox="0 0 400 150" preserveAspectRatio="none"><path d="M0 150 Q100 130 170 60 T400 0 V150Z" fill="#D4EEFB"/><path d="M110 150 Q240 120 300 65 T400 20 V150Z" fill="#A9DCF6"/></svg>
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><ClipboardCheck className="h-8 w-8"/></div><div><p className="eyebrow">Bibliothèque pédagogique</p><h1 className="page-title">Exercices &amp; Évaluations</h1><p className="page-subtitle">Retrouvez, organisez et gérez vos activités pédagogiques.</p><div className="mt-3 h-1 w-16 rounded-full bg-brand-500"/></div></div><Link to={`${base}/cours`} className="btn-primary"><Plus className="h-4 w-4"/> Créer dans une formation</Link></div>
    </header>
    <div className="grid gap-4 sm:grid-cols-3"><Stat icon={FileQuestion} tone="bg-brand-100 text-brand-700" value={quizCount} label="Quiz"/><Stat icon={BookOpen} tone="bg-violet-100 text-violet-700" value={exerciseCount} label="Exercices"/><Stat icon={ClipboardCheck} tone="bg-amber-100 text-amber-700" value={pending} label="Copies à corriger" to={`${base}/corrections`}/></div>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-700"/><input className="input pl-10" aria-label="Rechercher une activité ou une formation" placeholder="Rechercher une activité ou une formation…" value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="relative sm:w-64"><SlidersHorizontal className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-700"/><select aria-label="Filtrer par formation" className="input pl-10" value={course} onChange={e=>setCourse(e.target.value)}><option value="all">Toutes les formations</option>{courses.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label></div>
    <div className="flex flex-wrap gap-2 border-b-2 border-brand-200 pb-3" aria-label="Types d’activités">{[{id:'all',label:'Toutes',count:items.length},{id:'quiz',label:'Quiz',count:quizCount},{id:'exercise',label:'Exercices',count:exerciseCount}].map(t=><button key={t.id} type="button" aria-pressed={kind===t.id} onClick={()=>setKind(t.id)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-brand-400 ${kind===t.id?'bg-brand-600 text-white shadow-sm':'border border-slate-200 bg-white text-navy-700 hover:bg-brand-50'}`}>{t.label} ({t.count})</button>)}</div>
    {groups.map(g=><details key={g.key} open className="group rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-card sm:p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-lg pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 [&::-webkit-details-marker]:hidden"><CalendarDays className="h-5 w-5 text-brand-600"/>{g.day!==null&&<span className="rounded-lg bg-brand-100 px-3 py-1 text-sm font-bold text-navy-900">J+{g.day}</span>}<div className="min-w-0 flex-1"><p className="text-sm font-bold text-navy-900">{g.day!==null?'Suivi de progression':g.courseTitle}</p>{g.day!==null&&<p className="text-xs text-slate-500">{g.courseTitle}</p>}</div><span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs text-navy-700">{g.items.length} activité{g.items.length>1?'s':''}</span><ChevronDown className="h-4 w-4 text-navy-700 transition group-open:rotate-180"/></summary><div className="grid gap-3 xl:grid-cols-2">{g.items.map(item=><ActivityCard key={item.id} item={item}/>)}</div></details>)}
    {!filtered.length&&<div className="card py-10 text-center text-sm text-slate-500">Aucune activité correspondante. Créez d’abord une formation et ajoutez-y une leçon de type quiz ou exercice.</div>}
    <p className="text-xs text-slate-500">La création et la modification utilisent l’éditeur de formation existant : une seule source de données Supabase pour éviter les doublons.</p>
  </div>;
}
