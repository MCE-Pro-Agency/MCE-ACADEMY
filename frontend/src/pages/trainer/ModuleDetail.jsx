import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarClock, CheckCircle2, ClipboardCheck, Clock3,
  Download, FileText, GraduationCap, LockKeyhole, LockOpen, MessageSquare, PenLine,
  ShieldAlert, Sparkles, Target, TrendingUp, Trophy, UsersRound, Video, XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { syncStores } from '../../lib/stores';
import { PageLoader } from '../../components/ui';

const TABS = [
  ['overview','Vue d’ensemble'],['content','Leçons & supports'],['activities','Exercices & quiz'],
  ['learners','Apprenants'],['results','Statistiques'],
];
const pad=(num)=>Number.isFinite(num)?Math.round(num):0;
const resultDate=(v)=>v?new Date(v).toLocaleDateString('fr-FR'):'—';
const openOnDate=(s)=>Boolean(s && s.mode==='date' && s.opens_at && String(s.opens_at).slice(0,10)<=new Date().toISOString().slice(0,10));
const effectivelyOpen=(s)=>Boolean(s && (s.mode==='open'||s.mode==='sequential'||openOnDate(s)));
const isLesson=(l)=>!['quiz','exercise'].includes(l.type);

function Metric({ icon:Icon,label,value,foot }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500"><span>{label}</span><Icon className="h-4 w-4 text-sky-600" /></div><div className="mt-2 text-2xl font-extrabold tracking-tight text-[#102941]">{value}</div>{foot&&<p className="mt-1 text-xs text-slate-500">{foot}</p>}</div>;
}
function InfoEmpty({title,desc}){return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center"><p className="font-bold text-[#102941]">{title}</p><p className="mt-1 text-sm text-slate-500">{desc}</p></div>}
function Section({title,description,action,children}) {return <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-[#102941]">{title}</h2>{description&&<p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>{children}</section>}

export default function TrainerModuleDetail(){
  const {courseId,moduleId}=useParams();
  const {activeCompanyId}=useAuth();
  const [loading,setLoading]=useState(true);
  const [course,setCourse]=useState(null);
  const [module,setModule]=useState(null);
  const [members,setMembers]=useState([]);
  const [progress,setProgress]=useState([]);
  const [quizRuns,setQuizRuns]=useState([]);
  const [submissions,setSubmissions]=useState([]);
  const [tab,setTab]=useState('overview');
  const [errors,setErrors]=useState([]);
  const [settings,setSettings]=useState(null);
  const [settingsError,setSettingsError]=useState('');
  const [saving,setSaving]=useState(false);
  const [confirmMode,setConfirmMode]=useState(null);
  const [plannedDate,setPlannedDate]=useState('');
  const [refreshCount,setRefreshCount]=useState(0);

  const refresh=useCallback(async()=>{
    if(!activeCompanyId)return;
    setLoading(true);setErrors([]);
    const [cr,mo,en,ss]=await Promise.all([
      db.from('courses').select('id,title,subtitle,description,is_published,company_id').eq('id',courseId).eq('company_id',activeCompanyId).maybeSingle(),
      db.from('modules').select('*,lessons(*)').eq('id',moduleId).eq('course_id',courseId).maybeSingle(),
      db.from('enrollments').select('user_id,completed_at,user:profiles(id,full_name,job_title,avatar_url)').eq('course_id',courseId),
      db.from('module_settings').select('*').eq('module_id',moduleId).maybeSingle(),
    ]);
    const errs=[cr,mo,en].filter(x=>x.error).map(x=>x.error.message);
    setCourse(cr.data||null);
    const mod=mo.data?{...mo.data,lessons:(mo.data.lessons||[]).sort((a,b)=>a.position-b.position)}:null;
    setModule(mod);
    setMembers((en.data||[]).filter(x=>x.user));
    if(ss.error){setSettingsError('Table des déblocages indisponible. Vérifiez la migration SQL 003 avant toute ouverture.');setSettings(null)}
    else{setSettingsError('');setSettings(ss.data||{module_id:moduleId,mode:'closed',opens_at:null,requires_profile:false});setPlannedDate(ss.data?.opens_at?String(ss.data.opens_at).slice(0,10):'')}
    if(mod?.lessons?.length){
      const ids=mod.lessons.map(x=>x.id);
      const [pr,qr,sr]=await Promise.all([
        db.from('lesson_progress').select('user_id,lesson_id,completed,completed_at').in('lesson_id',ids),
        db.from('quiz_attempts').select('user_id,lesson_id,score,passed,created_at').in('lesson_id',ids),
        db.from('exercise_submissions').select('user_id,lesson_id,status,grade,feedback,submitted_at').in('lesson_id',ids),
      ]);
      setProgress(pr.data||[]);setQuizRuns(qr.data||[]);setSubmissions(sr.data||[]);
      errs.push(...[pr,qr,sr].filter(x=>x.error).map(x=>x.error.message));
    }else{setProgress([]);setQuizRuns([]);setSubmissions([])}
    setErrors(errs);setLoading(false);
  },[courseId,moduleId,activeCompanyId]);
  useEffect(()=>{refresh()},[refresh,refreshCount]);

  const lessons=useMemo(()=>(module?.lessons||[]).filter(isLesson),[module]);
  const quizzes=useMemo(()=>(module?.lessons||[]).filter(l=>l.type==='quiz'),[module]);
  const exercises=useMemo(()=>(module?.lessons||[]).filter(l=>l.type==='exercise'),[module]);
  const progressIds=useMemo(()=>new Set(progress.filter(p=>p.completed).map(p=>`${p.user_id}:${p.lesson_id}`)),[progress]);
  const byUser=useMemo(()=>members.map(row=>{
    const id=row.user_id;
    const quiz=quizRuns.filter(x=>x.user_id===id);
    const submitted=submissions.filter(x=>x.user_id===id);
    const done=(module?.lessons||[]).filter(x=>progressIds.has(`${id}:${x.id}`)).length;
    const pct=module?.lessons?.length?100*done/module.lessons.length:0;
    const scores=quiz.map(x=>Number(x.score)).filter(Number.isFinite);
    const best=scores.length?Math.max(...scores):null;
    const early=scores.length>=2?scores[0]:null;
    const delta=early!=null?best-early:null;
    return {...row,quiz,submitted,done,pct,best,delta};
  }),[members,module,progressIds,quizRuns,submissions]);
  const scored=byUser.filter(x=>x.best!=null);
  const avg=byUser.length?byUser.reduce((s,x)=>s+x.pct,0)/byUser.length:null;
  const quizAvg=scored.length?scored.reduce((s,x)=>s+x.best,0)/scored.length:null;
  const pending=submissions.filter(x=>x.grade==null).length;
  const ranked=[...byUser].filter(x=>x.best!=null).sort((a,b)=>b.best-a.best).slice(0,3);
  const improved=[...byUser].filter(x=>x.delta!=null).sort((a,b)=>b.delta-a.delta).slice(0,3);

  const saveUnlock=async()=>{
    if(settingsError||!settings){toast.error('Déblocage indisponible : vérifiez la table module_settings.');return}
    if(confirmMode==='date'&&!plannedDate){toast.error('Choisissez une date.');return}
    setSaving(true);
    const next={module_id:moduleId,mode:confirmMode,opens_at:confirmMode==='date'?plannedDate:null,requires_profile:!!settings.requires_profile};
    const {error:e}=await db.from('module_settings').upsert(next,{onConflict:'module_id'}).select('*').single();
    if(e){toast.error('Déblocage non enregistré : '+e.message);if(e.code==='42P01'||e.code==='PGRST205')setSettingsError('La table module_settings est absente. Migration SQL 003 à vérifier.');}
    else {toast.success('Réglage enregistré dans Supabase');setConfirmMode(null);await syncStores().catch(()=>{});setRefreshCount(v=>v+1)}
    setSaving(false);
  };
  if(loading)return <PageLoader/>;
  if(!course||!module)return <div className="space-y-4"><Link to="/formateur/cours" className="text-sm font-semibold text-sky-700">← Mes formations</Link><InfoEmpty title="Module indisponible" desc="Ce module n’a pas été trouvé dans la formation de votre entreprise."/></div>;
  const isOpen=effectivelyOpen(settings);
  return <div className="space-y-6 pb-12">
    <Link to="/formateur/cours" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-700"><ArrowLeft className="h-4 w-4"/>Retour aux modules</Link>
    <header className="overflow-hidden rounded-[28px] bg-[#102941] p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-sky-300">{course.title} · Fiche du module</p><h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{module.title}</h1><p className="mt-3 text-sm leading-relaxed text-slate-300">{module.description || 'Apprentissages, missions pratiques, quiz et suivi individuel regroupés sur une seule page.'}</p></div><div className="flex flex-col items-start gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${course.is_published?'bg-emerald-200 text-emerald-900':'bg-amber-200 text-amber-900'}`}>Formation {course.is_published?'publiée':'en brouillon'}</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{module.lessons.length} éléments</span></div></div>
      <div className="mt-6 flex flex-wrap gap-2">{[['Leçons',lessons.length],['Missions',exercises.length],['Quiz',quizzes.length]].map(([label,count])=><span key={label} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold">{count} {label.toLowerCase()}</span>)}</div>
    </header>
    {errors.length>0&&<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Certaines statistiques n’ont pas été chargées : {errors.join(' · ')}</div>}
    <Section title="Pilotage des accès" description="Ouvrir, fermer ou planifier ce module pour les apprenants.">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">{isOpen?<LockOpen className="h-6 w-6 text-emerald-600"/>:<LockKeyhole className="h-6 w-6 text-amber-700"/>}<div><p className="font-bold text-[#102941]">{settingsError?'Déblocage non configuré':isOpen?'Module ouvert':settings?.mode==='date'?'Ouverture programmée':'Module fermé'}</p><p className="text-xs text-slate-500">{settings?.mode==='date'?`Date : ${resultDate(settings.opens_at)}`:'L’accès du cours reste également soumis à sa publication et à l’inscription.'}</p></div></div>
        <button disabled={!!settingsError} onClick={()=>setConfirmMode(isOpen?'closed':'open')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{isOpen?<LockKeyhole className="h-4 w-4"/>:<LockOpen className="h-4 w-4"/>}{isOpen?'Fermer le module':'Débloquer le module'}</button>
      </div>
      {settingsError&&<p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><ShieldAlert className="mr-2 inline h-4 w-4"/>{settingsError} Aucun changement d’accès n’est effectué.</p>}
      {!settingsError&&<div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-2 text-sm font-semibold text-slate-600">Planifier une date</span><input type="date" className="input w-auto text-sm" value={plannedDate} onChange={e=>setPlannedDate(e.target.value)}/><button className="btn-secondary" onClick={()=>setConfirmMode('date')} disabled={!plannedDate}><CalendarClock className="h-4 w-4"/>Programmer</button></div>}
      {confirmMode&&<div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4"><p className="font-bold text-[#102941]">Confirmer {confirmMode==='closed'?'la fermeture':confirmMode==='date'?`la programmation au ${resultDate(plannedDate)}`:'l’ouverture'} ?</p><p className="mt-1 text-sm text-slate-600">Cette action mettra à jour Supabase pour ce module uniquement.</p><div className="mt-3 flex gap-2"><button className="btn-primary" disabled={saving} onClick={saveUnlock}>{saving?'Enregistrement...':'Confirmer'}</button><button className="btn-secondary" onClick={()=>setConfirmMode(null)}>Annuler</button></div></div>}
    </Section>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric icon={UsersRound} label="Apprenants inscrits" value={members.length}/><Metric icon={TrendingUp} label="Progression moyenne" value={avg==null?'—':`${pad(avg)} %`}/><Metric icon={ClipboardCheck} label="Meilleur score moyen aux quiz" value={quizAvg==null?'—':`${pad(quizAvg)} %`}/><Metric icon={PenLine} label="Corrections en attente" value={pending}/></div>
    <div role="tablist" aria-label="Sections du module" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">{TABS.map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${tab===id?'bg-[#102941] text-white shadow':'text-slate-600 hover:bg-slate-100'}`} onClick={()=>setTab(id)}>{label}</button>)}</div>
    {tab==='overview'&&<div className="grid gap-4 xl:grid-cols-2"><Section title="Objectif pédagogique" description="Ce que l’apprenant doit maîtriser à l’issue de la séance"><p className="text-sm leading-7 text-slate-700">{module.description||'Les objectifs précis sont à compléter dans l’éditeur pédagogique du module.'}</p><Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700" to={`/formateur/cours/${courseId}`}>Compléter le contenu <ArrowRight className="h-4 w-4"/></Link></Section><Section title="Plan de séance" description="Le parcours réellement importé"><div className="space-y-3">{module.lessons.slice(0,7).map((l,i)=><div key={l.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-sky-700">{i+1}</span><div><p className="text-sm font-semibold text-[#102941]">{l.title}</p><p className="text-xs text-slate-500">{l.type==='quiz'?'Quiz':l.type==='exercise'?'Mission pratique':'Leçon ou support'}</p></div></div>)}{module.lessons.length>7&&<p className="text-xs text-slate-500">Et {module.lessons.length-7} autre(s) élément(s), dans « Leçons & supports » ou « Exercices & quiz ».</p>}</div></Section><Section title="Actions prioritaires" description="Pour piloter la séance"><div className="space-y-3">{[{text:'Vérifier les leçons et les supports',to:'content'},{text:'Préparer les mises en situation et quiz',to:'activities'},{text:'Repérer les rendus en attente',to:'learners'},{text:'Analyser les progressions',to:'results'}].map(x=><button key={x.to} onClick={()=>setTab(x.to)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 p-3 text-left text-sm font-semibold text-slate-700 hover:bg-sky-50">{x.text}<ArrowRight className="h-4 w-4 text-sky-600"/></button>)}</div></Section><Section title="Suivi pédagogique" description="Lecture rapide du module"><p className="text-sm text-slate-600">{members.length===0?'Aucun apprenant inscrit pour le moment. Vous pourrez analyser leur progression après inscription.':`${members.filter(x=>x.pct>=100).length} apprenant(s) ont terminé tous les éléments de ce module.`}</p><p className="mt-3 text-sm text-slate-600">Les résultats sont calculés à partir des données enregistrées, sans inventer de notes ni de classements.</p></Section></div>}
    {tab==='content'&&<Section title="Leçons et ressources" description="Les supports pédagogiques importés dans ce module" action={<Link to={`/formateur/cours/${courseId}`} className="btn-secondary text-sm"><PenLine className="h-4 w-4"/> Modifier dans l’éditeur</Link>}>{lessons.length?<div className="divide-y divide-slate-100">{lessons.map((l,i)=><div key={l.id} className="flex items-center gap-4 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">{l.type==='video'?<Video className="h-5 w-5"/>:<BookOpen className="h-5 w-5"/>}</span><div className="min-w-0 flex-1"><p className="font-bold text-[#102941]">{l.title}</p><p className="mt-1 text-xs text-slate-500">{l.type==='video'?'Vidéo':l.type==='document'?'Document':'Leçon'} · {l.duration_minutes||0} min</p></div>{l.file_url&&<a href={l.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs"><Download className="h-4 w-4"/>Support</a>}</div>)}</div>:<InfoEmpty title="Aucune leçon dans ce module" desc="Ajoutez vos ressources depuis l’éditeur du programme."/>}</Section>}
    {tab==='activities'&&<div className="grid gap-4 xl:grid-cols-2"><Section title="Missions et mises en situation" description="Exercices pratiques du module">{exercises.length?<div className="space-y-3">{exercises.map(l=><div key={l.id} className="rounded-xl border border-slate-100 p-4"><p className="font-bold text-[#102941]">{l.title}</p><p className="mt-1 text-xs text-slate-500">{submissions.filter(s=>s.lesson_id===l.id).length} rendu(s) · {submissions.filter(s=>s.lesson_id===l.id&&s.grade==null).length} à corriger</p></div>)}</div>:<InfoEmpty title="Aucune mission" desc="Ajoutez une mise en situation depuis l’éditeur."/>}<Link to="/formateur/corrections" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700">Accéder aux corrections <ArrowRight className="h-4 w-4"/></Link></Section><Section title="Quiz de compréhension" description="Scores basés sur les tentatives enregistrées">{quizzes.length?<div className="space-y-3">{quizzes.map(l=>{const scores=quizRuns.filter(s=>s.lesson_id===l.id);return <div key={l.id} className="rounded-xl border border-slate-100 p-4"><p className="font-bold text-[#102941]">{l.title}</p><p className="mt-1 text-xs text-slate-500">{scores.length} tentative(s) · Seuil : {l.passing_score??70}%</p></div>})}</div>:<InfoEmpty title="Aucun quiz" desc="Ajoutez un quiz depuis l’éditeur."/>}</Section></div>}
    {tab==='learners'&&<Section title="Suivi des apprenants" description="Progression et résultats de ce module uniquement">{members.length?<div className="overflow-x-auto"><table className="min-w-[650px] w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wider text-slate-500"><th className="py-3">Apprenant</th><th>Éléments terminés</th><th>Meilleur quiz</th><th>Missions rendues</th><th>Fiche</th></tr></thead><tbody>{byUser.map(row=><tr key={row.user_id} className="border-b border-slate-100"><td className="py-4 font-bold text-[#102941]">{row.user?.full_name||'Apprenant'}</td><td>{row.done}/{module.lessons.length} ({pad(row.pct)}%)</td><td>{row.best==null?'—':`${pad(row.best)} %`}</td><td>{row.submitted.length}/{exercises.length}</td><td><Link className="font-bold text-sky-700" to={`/formateur/apprenants/${row.user_id}`}>Voir la fiche <ArrowRight className="inline h-3.5 w-3.5"/></Link></td></tr>)}</tbody></table></div>:<InfoEmpty title="Aucun apprenant inscrit" desc="Les comptes existants ne sont jamais inscrits automatiquement par cette page."/>}</Section>}
    {tab==='results'&&<div className="grid gap-4 xl:grid-cols-2"><Section title="Meilleurs résultats" description="Meilleur score de quiz par apprenant, classement privé de la formatrice">{ranked.length?ranked.map((x,i)=><div key={x.user_id} className="flex items-center gap-3 border-b border-slate-100 py-3"><span className="w-8 text-xl font-extrabold text-amber-600">{i+1}</span><span className="flex-1 text-sm font-bold text-[#102941]">{x.user?.full_name}</span><span className="text-sm font-extrabold text-sky-700">{pad(x.best)} %</span></div>):<InfoEmpty title="Aucun résultat" desc="Le classement apparaîtra après les premiers quiz."/>}</Section><Section title="Progressions observables" description="Écart entre la première tentative et le meilleur score, lorsqu’il existe plusieurs tentatives">{improved.length?improved.map((x,i)=><div key={x.user_id} className="flex items-center gap-3 border-b border-slate-100 py-3"><span className="w-8 text-xl font-extrabold text-emerald-600">{i+1}</span><span className="flex-1 text-sm font-bold text-[#102941]">{x.user?.full_name}</span><span className="text-sm font-extrabold text-emerald-700">{x.delta>=0?'+':''}{pad(x.delta)} pts</span></div>):<InfoEmpty title="Pas encore de comparaison" desc="Au moins deux tentatives sont nécessaires pour mesurer une évolution."/>}</Section><Section title="Points de vigilance" description="Actions pédagogiques utiles"><div className="space-y-3"><p className="text-sm text-slate-700"><strong>{pending}</strong> exercice(s) en attente de correction.</p><p className="text-sm text-slate-700"><strong>{members.filter(x=>x.done===0).length}</strong> apprenant(s) sans leçon terminée dans ce module.</p><p className="text-xs text-slate-500">Les résultats ne doivent pas être interprétés comme une évaluation globale de la personne.</p></div></Section><Section title="Synthèse du module" description="Indicateurs réels, sans données simulées"><div className="space-y-3 text-sm text-slate-700"><p>Progression moyenne : <strong>{avg==null?'—':`${pad(avg)} %`}</strong></p><p>Meilleur score moyen : <strong>{quizAvg==null?'—':`${pad(quizAvg)} %`}</strong></p><p>Participants inscrits : <strong>{members.length}</strong></p><p>Rendus à corriger : <strong>{pending}</strong></p></div></Section></div>}
    <div className="rounded-2xl bg-sky-50 px-5 py-4 text-xs leading-relaxed text-sky-950"><ShieldAlert className="mr-2 inline h-4 w-4"/>Les données sont réservées à l’espace Formateur. La publication du cours, l’inscription et le déblocage sont trois contrôles distincts. Les documents personnels doivent rester dans un stockage privé.</div>
  </div>;
}
