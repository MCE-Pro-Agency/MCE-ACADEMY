import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart3, Download, Brain, Users, ClipboardCheck } from 'lucide-react';
import { db } from '../../lib/db';
import { profilStore, lastRun, useLocalStoreVersion } from '../../lib/stores';
import { useAuth } from '../../contexts/AuthContext';
import TestTiming, { testTiming } from './TestTiming';
import { PageLoader } from '../../components/ui';

function csvCell(value) { return `"${String(value ?? '').replaceAll('"','""')}"`; }
export default function Reports() {
  useLocalStoreVersion({ refresh: true });
  const { activeCompanyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  useEffect(() => {
    if (!activeCompanyId) { setLoading(false); return; }
    let live=true;
    setLoading(true);
    Promise.all([
      db.from('profiles').select('id, full_name, email').eq('company_id',activeCompanyId).eq('role','learner').order('full_name'),
      db.from('courses').select('id, title').eq('company_id',activeCompanyId),
    ]).then(async ([l,c])=>{
      if (!live) return;
      if (l.error || c.error) toast.error(l.error?.message || c.error?.message);
      const list=l.data||[]; const cs=c.data||[];
      setLearners(list); setCourses(cs);
      if (!cs.length) { setEnrollments([]);setAttempts([]);setSubmissions([]);setLoading(false);return; }
      const ids=cs.map(x=>x.id);
      const [e,a,s]=await Promise.all([
        db.from('enrollments').select('user_id,course_id,completed_at').in('course_id',ids),
        db.from('quiz_attempts').select('user_id,course_id,score,passed').in('course_id',ids),
        db.from('exercise_submissions').select('user_id,course_id,grade,status').in('course_id',ids),
      ]);
      if (!live) return;
      if (e.error||a.error||s.error) toast.error(e.error?.message||a.error?.message||s.error?.message);
      setEnrollments(e.data||[]);setAttempts(a.data||[]);setSubmissions(s.data||[]);setLoading(false);
    });
    return ()=>{live=false};
  },[activeCompanyId]);
  const rows=useMemo(()=>learners.map(l=>{
    const en=enrollments.filter(e=>e.user_id===l.id);
    const qu=attempts.filter(a=>a.user_id===l.id);
    const ex=submissions.filter(s=>s.user_id===l.id);
    return {...l, assigned:en.length, completed:en.filter(e=>e.completed_at).length, quizCount:qu.length, averageQuiz:qu.length ? Math.round(qu.reduce((s,a)=>s+Number(a.score||0),0)/qu.length) : null, exercises:ex.length, corrected:ex.filter(s=>s.status==='graded').length};
  }),[learners,enrollments,attempts,submissions]);
  const exportCsv=()=>{
    const headers=['Nom','Email','Formations attribuées','Formations terminées','Quiz passés','Moyenne quiz (%)','Exercices remis','Exercices corrigés','Durée test (minutes)','Statut durée test'];
    const data=rows.map(r=>[r.full_name,r.email,r.assigned,r.completed,r.quizCount,r.averageQuiz??'',r.exercises,r.corrected, lastRun(profilStore.get(r.id))?.minutes ?? '', testTiming(lastRun(profilStore.get(r.id))).label]);
    const csv='\ufeff'+[headers,...data].map(row=>row.map(csvCell).join(';')).join('\r\n');
    const link=document.createElement('a');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.href=url;link.download='mce-academy-bilan-apprenants.csv';link.click();URL.revokeObjectURL(url);
  };
  if (loading) return <PageLoader/>;
  return <div className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Résultats mesurés</p><h1 className="page-title">Résultats & rapports</h1><p className="page-subtitle">Synthèse des inscriptions, quiz et exercices enregistrés dans Supabase.</p></div><button onClick={exportCsv} className="btn-secondary" disabled={!rows.length}><Download className="h-4 w-4"/> Exporter CSV</button></header>
    <div className="grid gap-4 sm:grid-cols-3"><div className="card p-5"><Users className="mb-2 text-brand-600"/><p className="text-2xl font-bold text-navy-900">{learners.length}</p><p className="text-sm text-slate-500">Apprenants</p></div><div className="card p-5"><BarChart3 className="mb-2 text-brand-600"/><p className="text-2xl font-bold text-navy-900">{courses.length}</p><p className="text-sm text-slate-500">Formations</p></div><div className="card p-5"><ClipboardCheck className="mb-2 text-brand-600"/><p className="text-2xl font-bold text-navy-900">{submissions.filter(s=>s.status==='submitted').length}</p><p className="text-sm text-slate-500">Exercices à corriger</p></div></div>
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5"><h2 className="font-bold text-navy-900">Synthèse par apprenant</h2><Link className="text-sm font-semibold text-brand-700" to="/formateur/profils"><Brain className="mr-1 inline h-4 w-4"/> Voir les tests de profil</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Apprenant</th><th className="px-4 py-3">Formations</th><th className="px-4 py-3">Terminées</th><th className="px-4 py-3">Quiz</th><th className="px-4 py-3">Moy. quiz</th><th className="px-4 py-3">Profil professionnel</th><th className="px-4 py-3">Durée du test</th><th className="px-4 py-3">Exercices corrigés</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(r=><tr key={r.id}><td className="px-5 py-3"><Link className="font-semibold text-navy-900 hover:text-brand-600" to={`/formateur/apprenants/${r.id}?onglet=profil`}>{r.full_name}</Link><div className="text-xs text-slate-400">{r.email}</div></td><td className="px-4 py-3">{r.assigned}</td><td className="px-4 py-3">{r.completed}</td><td className="px-4 py-3">{r.quizCount}</td><td className="px-4 py-3">{r.averageQuiz===null?'—':`${r.averageQuiz}%`}</td><td className="px-4 py-3">{(() => { const run = lastRun(profilStore.get(r.id)); return run ? <Link to={`/formateur/apprenants/${r.id}?onglet=profil`} className="font-semibold text-brand-700 hover:underline">{run.result?.global_score ?? 'Voir'} /100 · Rapport complet</Link> : <span className="text-slate-400">Test non terminé</span>; })()}</td><td className="px-4 py-3">{<TestTiming run={lastRun(profilStore.get(r.id))} compact />}</td><td className="px-4 py-3">{r.corrected}/{r.exercises}</td></tr>)}{!rows.length&&<tr><td className="px-5 py-8 text-center text-slate-500" colSpan="8">Aucun apprenant dans cette entreprise.</td></tr>}</tbody></table></div></section><p className="text-xs text-slate-500">Pour le grand test, « dans le temps indicatif » signifie 25 minutes ou moins. Un dépassement n'est pas un retard de remise, et ne diminue pas le score pédagogique.</p><p className="text-xs text-slate-500">Les e-books individuels et la comparaison vidéo avant/après ne sont pas générés automatiquement : ils nécessitent encore leur propre dispositif pédagogique et un stockage confidentiel.</p></div>;
}
