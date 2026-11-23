import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, FileQuestion, SlidersHorizontal, Plus, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { PageLoader } from '../../components/ui';

/** Catalogue pédagogique : réutilise les leçons de type quiz/exercise existantes. */
export default function Exercises() {
  const { activeCompanyId } = useAuth();
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
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
  const filtered = useMemo(() => items.filter(i => (kind === 'all' || i.type === kind) && `${i.title} ${i.courseTitle}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))), [items, kind, search]);
  if (loading) return <PageLoader />;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Bibliothèque pédagogique</p><h1 className="page-title">Exercices & évaluations</h1><p className="page-subtitle">Retrouvez les quiz et missions de vos formations, puis accédez à leur éditeur.</p></div><Link to="/formateur/cours" className="btn-primary"><Plus className="h-4 w-4"/> Créer dans une formation</Link></header>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="card p-5"><FileQuestion className="mb-2 text-brand-600"/><p className="text-2xl font-bold text-navy-900">{items.filter(i=>i.type==='quiz').length}</p><p className="text-sm text-slate-500">Quiz</p></div>
      <div className="card p-5"><BookOpen className="mb-2 text-brand-600"/><p className="text-2xl font-bold text-navy-900">{items.filter(i=>i.type==='exercise').length}</p><p className="text-sm text-slate-500">Exercices</p></div>
      <Link to="/formateur/corrections" className="card p-5 transition hover:ring-2 hover:ring-brand-200"><ClipboardCheck className="mb-2 text-brand-600"/><p className="text-2xl font-bold text-navy-900">{pending}</p><p className="text-sm text-slate-500">Copies à corriger <ArrowRight className="inline h-4 w-4"/></p></Link>
    </div>
    <div className="card p-5"><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><SlidersHorizontal className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-600"/><input className="input w-full pl-9" placeholder="Rechercher une activité ou une formation" value={search} onChange={e=>setSearch(e.target.value)}/></label><select className="input sm:w-44" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Tous les types</option><option value="quiz">Quiz</option><option value="exercise">Exercices</option></select></div>
    <div className="mt-4 divide-y divide-slate-100">{filtered.map(item=><Link key={item.id} to={`/formateur/cours/${item.course_id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50"><div className="min-w-0"><p className="font-semibold text-navy-900">{item.title}</p><p className="text-xs text-slate-500">{item.courseTitle} · {item.type==='quiz' ? `Quiz · seuil ${item.passing_score}%` : 'Exercice pratique'}</p></div><span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700">Modifier <ArrowRight className="h-4 w-4"/></span></Link>)}{!filtered.length&&<p className="py-8 text-center text-sm text-slate-500">Aucune activité correspondante. Créez d’abord une formation et ajoutez-y une leçon de type quiz ou exercice.</p>}</div></div>
    <p className="text-xs text-slate-500">La création et la modification utilisent l’éditeur de formation existant : une seule source de données Supabase pour éviter les doublons.</p>
  </div>;
}
