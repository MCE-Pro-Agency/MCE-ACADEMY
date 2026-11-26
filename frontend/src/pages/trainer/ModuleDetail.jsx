import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarClock, CheckCircle2, ClipboardCheck, Clock3,
  Download, FileText, GraduationCap, LockKeyhole, LockOpen, MessageSquare, PenLine,
  ShieldAlert, Sparkles, Target, TrendingUp, Trophy, UsersRound, Video, XCircle, Plus, Search, Pencil, Settings, Layers, Home, BarChart3, MoreHorizontal,
} from 'lucide-react';
import { moduleTitle, scheduleLabel } from '../../lib/moduleSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { syncStores } from '../../lib/stores';
import { LessonModal } from './CourseEditor';
import { LESSON_TYPES } from '../../lib/utils';
import { PageLoader, Modal } from '../../components/ui';

const TABS = [
  ['overview','Vue d’ensemble',Home],['allContent','Contenus',Layers],['learners','Apprenants',UsersRound],['results','Statistiques',BarChart3],
];
const pad=(num)=>Number.isFinite(num)?Math.round(num):0;
const resultDate=(v)=>v?new Date(v).toLocaleDateString('fr-FR'):'—';
const openOnDate=(s)=>Boolean(s && s.mode==='date' && s.opens_at && String(s.opens_at).slice(0,10)<=new Date().toISOString().slice(0,10));
const effectivelyOpen=(s)=>Boolean(s && (s.mode==='open'||s.mode==='sequential'||openOnDate(s)));
const isLesson=(l)=>!['quiz','exercise'].includes(l.type);

function Metric({icon:Icon,label,value,tone='bg-sky-100 text-sky-700'}) {
  return <div className="flex min-w-0 items-center gap-2 px-2 py-2 sm:px-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={19}/></span><div className="min-w-0"><p className="text-lg font-extrabold leading-none text-navy-900 tabular-nums">{value}</p><p className="mt-1 text-[11px] leading-tight text-slate-600">{label}</p></div></div>;
}
function InfoEmpty({title,desc}){return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center"><p className="font-bold text-[#102941]">{title}</p><p className="mt-1 text-sm text-slate-500">{desc}</p></div>}
function Section({title,description,action,children}) {return <section className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold text-[#102941]">{title}</h2>{description&&<p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>{children}</section>}

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
  const [filter,setFilter]=useState('all');
  const [search,setSearch]=useState('');
  const [sessionDate,setSessionDate]=useState('');
  const [savingSession,setSavingSession]=useState(false);
  const [tab,setTab]=useState('allContent');
  const [dialog,setDialog]=useState(null);
  const [editor,setEditor]=useState(null);
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
    setModule(mod);setSessionDate(mod?.scheduled_date||'');
    setMembers((en.data||[]).filter(x=>x.user));
    if(ss.error){setSettingsError('Table des déblocages indisponible. Vérifiez la migration SQL 003 avant toute ouverture.');setSettings(null)}
    else{setSettingsError('');setSettings(ss.data||{module_id:moduleId,mode:'closed',opens_at:null,requires_profile:false});setPlannedDate(ss.data?.opens_at?String(ss.data.opens_at).slice(0,10):'')}
    if(mod?.lessons?.length){
      const ids=mod.lessons.map(x=>x.id);
      const [pr,qr,sr]=await Promise.all([
        db.from('lesson_progress').select('user_id,lesson_id,completed,completed_at').in('lesson_id',ids),
        db.from('quiz_attempts').select('user_id,lesson_id,score,passed,created_at').in('lesson_id',ids).order('created_at',{ascending:true}),
        db.from('exercise_submissions').select('user_id,lesson_id,status,grade,feedback,submitted_at').in('lesson_id',ids),
      ]);
      setProgress(pr.data||[]);setQuizRuns(qr.data||[]);setSubmissions(sr.data||[]);
      errs.push(...[pr,qr,sr].filter(x=>x.error).map(x=>x.error.message));
    }else{setProgress([]);setQuizRuns([]);setSubmissions([])}
    setErrors(errs);setLoading(false);
  },[courseId,moduleId,activeCompanyId]);
  useEffect(()=>{refresh()},[refresh,refreshCount]);

  

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
    else {toast.success('Réglage enregistré dans Supabase');setConfirmMode(null);setDialog(null);await syncStores().catch(()=>{});setRefreshCount(v=>v+1)}
    setSaving(false);
  };
  const saveSession=async()=>{setSavingSession(true);try{const {data,error}=await db.from('modules').update({scheduled_date:sessionDate||null}).eq('id',moduleId).eq('course_id',courseId).select('id,scheduled_date').single();if(error)throw error;setModule(old=>({...old,scheduled_date:data.scheduled_date}));toast.success('Date de séance enregistrée');setDialog(null);}catch(e){toast.error(e.message);}finally{setSavingSession(false);}};
  if(loading)return <PageLoader/>;
  if(!course||!module)return <div className="space-y-4"><Link to="/formateur/cours" className="text-sm font-semibold text-sky-700">← Mes formations</Link><InfoEmpty title="Module indisponible" desc="Ce module n’a pas été trouvé dans la formation de votre entreprise."/></div>;
  const isOpen=effectivelyOpen(settings);
  const types=[['all','Tous'],['text','Leçons'],['exercise','Exercices'],['quiz','Quiz'],['video','Vidéos'],['document','Documents']];
  const rows=module.lessons.filter(l=>(filter==='all'||l.type===filter)&&l.title.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')));
  const nextPosition=Math.max(-1,...module.lessons.map(l=>Number(l.position)||0))+1;
  const accessLabel=settingsError?'Accès indisponible':settings?.mode==='sequential'?'Accès séquentiel':isOpen?'Module ouvert':settings?.mode==='date'?'Ouverture programmée':'Module fermé';
  const primary='inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#15558a] to-[#10365e] px-3 text-sm font-bold text-white shadow-sm hover:brightness-110 focus-visible:ring-2 focus-visible:ring-sky-500 sm:px-4';
  const secondary='inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-800 shadow-sm hover:bg-sky-50';
  return <div className="relative isolate min-w-0 space-y-4 pb-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-6 -z-10 h-80 rounded-3xl" style={{background:'radial-gradient(ellipse at 100% 0%, #c4e2fa 0%, transparent 65%), linear-gradient(145deg,#f8fbff,#edf4fc 55%,transparent)'}}/>
    <Link to={`/formateur/cours/${courseId}`} className="inline-flex items-center gap-2 text-sm font-bold text-navy-800 hover:text-brand-700"><ArrowLeft size={17}/> Retour aux modules</Link>
    <header className="min-w-0 px-1 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-[#15558a]">{course.title}</p><span className={`rounded-full px-3 py-1 text-xs font-bold ${course.is_published?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}`}>{course.is_published?'✓ Formation publiée':'Formation en brouillon'}</span></div>
      <h1 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">{moduleTitle(module.title)}</h1>
      {module.description&&<p className="mt-2 break-words text-sm leading-relaxed text-slate-600 sm:text-base">{module.description}</p>}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600"><span className="inline-flex items-center gap-1"><CalendarClock size={15}/>{scheduleLabel(module.scheduled_date)}</span><span className={`inline-flex items-center gap-1 ${isOpen?'text-emerald-700':''}`}>{isOpen?<LockOpen size={15}/>:<LockKeyhole size={15}/>} {accessLabel}</span></div>
    </header>
    {errors.length>0&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Données incomplètes : {errors.join(' · ')}</p>}
    <div className="grid min-w-0 gap-3 2xl:grid-cols-2">
      <div className="grid grid-cols-2 divide-slate-100 rounded-2xl border border-sky-100 bg-white/90 p-1 shadow-sm sm:grid-cols-4 sm:divide-x"><Metric icon={Layers} value={module.lessons.length} label="Éléments"/><Metric icon={BookOpen} value={module.lessons.filter(isLesson).length} label="Leçons & supports"/><Metric icon={Target} value={exercises.length} label="Missions" tone="bg-violet-100 text-violet-700"/><Metric icon={Trophy} value={module.lessons.filter(l=>l.type==='quiz').length} label="Quiz" tone="bg-emerald-100 text-emerald-700"/></div>
      <div className="grid grid-cols-2 divide-slate-100 rounded-2xl border border-sky-100 bg-white/90 p-1 shadow-sm sm:grid-cols-4 sm:divide-x"><Metric icon={UsersRound} value={members.length} label="Apprenants"/><Metric icon={TrendingUp} value={avg==null?'—':`${pad(avg)} %`} label="Progression moyenne"/><Metric icon={BarChart3} value={quizAvg==null?'—':`${pad(quizAvg)} %`} label="Meilleur score moyen"/><Link to="/formateur/corrections" className="min-w-0 hover:bg-sky-50"><Metric icon={PenLine} value={pending} label="À corriger"/></Link></div>
    </div>
    <div className="flex flex-wrap items-center gap-2"><button className={primary} onClick={()=>setEditor({type:'text'})}><BookOpen size={16}/> + Leçon</button><button className={primary} onClick={()=>setEditor({type:'quiz'})}><Trophy size={16}/> + Quiz</button><button className={primary} onClick={()=>setEditor({type:'exercise'})}><ClipboardCheck size={16}/> + Exercice</button><button className={secondary} onClick={()=>{setSessionDate(module.scheduled_date||'');setDialog('date')}}><CalendarClock size={16}/> Planifier</button><button className={secondary} onClick={()=>{setConfirmMode(null);setDialog('access')}}><LockKeyhole size={16}/> Accès</button><button className={secondary} onClick={()=>setDialog('create')} aria-label="Autres types de contenus" title="Autres contenus"><Plus size={16}/><span className="hidden sm:inline">Autres</span></button></div>
    <div role="tablist" aria-label="Sections du module" className="flex gap-1 overflow-x-auto border-b border-slate-200">{TABS.map(([id,label,Icon])=><button key={id} role="tab" aria-selected={tab===id} className={`flex min-h-11 shrink-0 items-center gap-2 border-b-[3px] px-3 py-2.5 text-sm font-bold sm:px-5 ${tab===id?'border-brand-500 text-[#15558a]':'border-transparent text-slate-500 hover:text-navy-900'}`} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</div>
    {tab==='overview'&&<Section title="Objectif pédagogique" description="Organisation de la séance"><p className="text-sm text-slate-700">{module.description||'Aucun objectif renseigné.'}</p><div className="mt-4 flex flex-wrap gap-2"><button className={primary} onClick={()=>setTab('allContent')}>Voir les {module.lessons.length} contenus <ArrowRight size={16}/></button><Link className={secondary} to={`/formateur/cours/${courseId}`}><Settings size={16}/> Modifier le programme</Link></div><p className="mt-4 text-sm text-slate-600">{byUser.filter(x=>module.lessons.length>0&&x.done===module.lessons.length).length} apprenant(s) ont terminé tous les éléments.</p></Section>}
    {tab==='allContent'&&<section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-sm sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-extrabold text-navy-950"><Layers className="text-brand-500" size={23}/> Contenus du module</h2><p className="mt-1 text-xs text-slate-500">Gérez, organisez et modifiez les éléments de votre module.</p></div><div className="relative w-full sm:w-64"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input className="input min-h-11 pl-9" aria-label="Rechercher un contenu" placeholder="Rechercher un contenu…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="my-3 flex gap-1.5 overflow-x-auto pb-1">{types.map(([key,label])=><button type="button" key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)} className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-bold ${filter===key?'bg-[#10365e] text-white shadow-sm':'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-sky-50'}`}>{label} ({module.lessons.filter(l=>key==='all'||l.type===key).length})</button>)}</div><div className="space-y-1.5">{rows.map(l=>{const T=LESSON_TYPES[l.type]||LESSON_TYPES.text;const tone=l.type==='exercise'?'bg-violet-100 text-violet-700':l.type==='quiz'?'bg-emerald-100 text-emerald-800':'bg-sky-100 text-[#15558a]';return <div key={l.id} className="group flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/60 px-2 py-1.5 transition hover:border-sky-300 hover:shadow-sm sm:gap-3 sm:px-3"><span className="hidden w-5 shrink-0 text-center text-xs font-bold text-slate-400 sm:block">{String(module.lessons.indexOf(l)+1).padStart(2,'0')}</span><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}><T.icon size={19}/></span><button type="button" className="min-w-0 flex-1 py-1 text-left" onClick={()=>setEditor({lesson:l})}><p className="break-words text-sm font-bold text-navy-950 group-hover:text-brand-700">{l.title}</p><p className="mt-0.5 text-xs text-slate-500">{T.label} · {l.duration_minutes||0} min{l.type==='quiz'?` · ${quizRuns.filter(q=>q.lesson_id===l.id).length} tentative(s)`:l.type==='exercise'?` · ${submissions.filter(q=>q.lesson_id===l.id).length} rendu(s)`:''}</p></button><span className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-bold xl:inline ${tone}`}>{l.type==='exercise'?'Mission pratique':T.label}</span>{l.file_url&&<a href={l.file_url} target="_blank" rel="noopener noreferrer" className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg text-navy-700 hover:bg-sky-100" aria-label="Ouvrir le support"><Download size={17}/></a>}<button type="button" onClick={()=>setEditor({lesson:l})} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-navy-800 hover:bg-sky-100" aria-label={`Modifier ${l.title}`} title="Modifier"><Pencil size={17}/></button><button type="button" onClick={()=>setEditor({lesson:l})} className="hidden h-11 w-9 shrink-0 items-center justify-center rounded-lg text-navy-800 hover:bg-sky-100 sm:flex" aria-label={`Paramètres de ${l.title}`} title="Ouvrir le contenu et ses paramètres"><MoreHorizontal size={18}/></button></div>})}{!rows.length&&<InfoEmpty title="Aucun contenu" desc="Modifiez la recherche ou créez un contenu."/>}</div></section>}
    {tab==='learners'&&<Section title="Suivi des apprenants" description="Progression et résultats de ce module uniquement">{members.length?<div className="max-w-full overflow-x-auto"><table className="min-w-[650px] w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wider text-slate-500"><th className="py-3">Apprenant</th><th>Éléments terminés</th><th>Meilleur quiz</th><th>Missions rendues</th><th>Fiche</th></tr></thead><tbody>{byUser.map(row=><tr key={row.user_id} className="border-b border-slate-100"><td className="py-4 font-bold text-[#102941]">{row.user?.full_name||'Apprenant'}</td><td>{row.done}/{module.lessons.length} ({pad(row.pct)}%)</td><td>{row.best==null?'—':`${pad(row.best)} %`}</td><td>{row.submitted.length}/{exercises.length}</td><td><Link className="font-bold text-sky-700" to={`/formateur/apprenants/${row.user_id}`}>Voir la fiche <ArrowRight className="inline h-3.5 w-3.5"/></Link></td></tr>)}</tbody></table></div>:<InfoEmpty title="Aucun apprenant inscrit" desc="Les comptes existants ne sont jamais inscrits automatiquement par cette page."/>}</Section>}
    {tab==='results'&&<div className="grid gap-4 xl:grid-cols-2"><Section title="Meilleurs résultats" description="Meilleur score de quiz par apprenant, classement privé de la formatrice">{ranked.length?ranked.map((x,i)=><div key={x.user_id} className="flex items-center gap-3 border-b border-slate-100 py-3"><span className="w-8 text-xl font-extrabold text-amber-600">{i+1}</span><span className="flex-1 text-sm font-bold text-[#102941]">{x.user?.full_name}</span><span className="text-sm font-extrabold text-sky-700">{pad(x.best)} %</span></div>):<InfoEmpty title="Aucun résultat" desc="Le classement apparaîtra après les premiers quiz."/>}</Section><Section title="Progressions observables" description="Écart entre la première tentative et le meilleur score, lorsqu’il existe plusieurs tentatives">{improved.length?improved.map((x,i)=><div key={x.user_id} className="flex items-center gap-3 border-b border-slate-100 py-3"><span className="w-8 text-xl font-extrabold text-emerald-600">{i+1}</span><span className="flex-1 text-sm font-bold text-[#102941]">{x.user?.full_name}</span><span className="text-sm font-extrabold text-emerald-700">{x.delta>=0?'+':''}{pad(x.delta)} pts</span></div>):<InfoEmpty title="Pas encore de comparaison" desc="Au moins deux tentatives sont nécessaires pour mesurer une évolution."/>}</Section><Section title="Points de vigilance" description="Actions pédagogiques utiles"><div className="space-y-3"><p className="text-sm text-slate-700"><strong>{pending}</strong> exercice(s) en attente de correction.</p><p className="text-sm text-slate-700"><strong>{byUser.filter(x=>x.done===0).length}</strong> apprenant(s) sans leçon terminée dans ce module.</p><p className="text-xs text-slate-500">Les résultats ne doivent pas être interprétés comme une évaluation globale de la personne.</p></div></Section><Section title="Synthèse du module" description="Indicateurs réels, sans données simulées"><div className="space-y-3 text-sm text-slate-700"><p>Progression moyenne : <strong>{avg==null?'—':`${pad(avg)} %`}</strong></p><p>Meilleur score moyen : <strong>{quizAvg==null?'—':`${pad(quizAvg)} %`}</strong></p><p>Participants inscrits : <strong>{members.length}</strong></p><p>Rendus à corriger : <strong>{pending}</strong></p></div></Section></div>}

    <Modal open={dialog==='create'} onClose={()=>setDialog(null)} title="Créer un contenu" description="Choisissez le type de contenu à ajouter à ce module."><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{Object.entries(LESSON_TYPES).map(([type,T])=><button key={type} type="button" onClick={()=>{setDialog(null);setEditor({type})}} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:bg-brand-50"><span className={`rounded-lg p-2 ${T.color}`}><T.icon size={20}/></span><span className="font-semibold text-navy-900">{T.label}</span><Plus size={16} className="ml-auto text-brand-600"/></button>)}</div></Modal>
    <Modal open={dialog==='date'} onClose={()=>!savingSession&&setDialog(null)} title="Planifier la séance">    <Section title="Date de formation" description="Indépendante de l’ouverture des contenus."><div className="flex flex-wrap items-center gap-3"><input aria-label="Date de formation" type="date" className="input w-auto" value={sessionDate} onChange={e=>setSessionDate(e.target.value)}/><button className="btn-primary" disabled={savingSession} onClick={saveSession}>{savingSession?'Enregistrement…':'Enregistrer la date'}</button><button className="btn-secondary" disabled={savingSession} onClick={()=>setSessionDate('')}>Effacer</button></div></Section>
</Modal>
    <Modal open={dialog==='access'} onClose={()=>!saving&&setDialog(null)} title="Gestion des accès">    <Section title="Pilotage des accès" description="Ouvrir, fermer ou planifier ce module pour les apprenants.">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">{isOpen?<LockOpen className="h-6 w-6 text-emerald-600"/>:<LockKeyhole className="h-6 w-6 text-amber-700"/>}<div><p className="font-bold text-[#102941]">{settingsError?'Déblocage non configuré':isOpen?'Module ouvert':settings?.mode==='date'?'Ouverture programmée':'Module fermé'}</p><p className="text-xs text-slate-500">{settings?.mode==='date'?`Date : ${resultDate(settings.opens_at)}`:'L’accès du cours reste également soumis à sa publication et à l’inscription.'}</p></div></div>
        <button disabled={!!settingsError} onClick={()=>setConfirmMode(isOpen?'closed':'open')} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">{isOpen?<LockKeyhole className="h-4 w-4"/>:<LockOpen className="h-4 w-4"/>}{isOpen?'Fermer le module':'Débloquer le module'}</button>
      </div>
      {settingsError&&<p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><ShieldAlert className="mr-2 inline h-4 w-4"/>{settingsError} Aucun changement d’accès n’est effectué.</p>}
      {!settingsError&&<div className="mt-4 flex flex-wrap items-center gap-2"><span className="mr-2 text-sm font-semibold text-slate-600">Planifier une date</span><input type="date" className="input w-full min-w-0 max-w-full text-sm sm:w-auto" value={plannedDate} onChange={e=>setPlannedDate(e.target.value)}/><button className="btn-secondary" onClick={()=>setConfirmMode('date')} disabled={!plannedDate}><CalendarClock className="h-4 w-4"/>Programmer</button></div>}
      {confirmMode&&<div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4"><p className="font-bold text-[#102941]">Confirmer {confirmMode==='closed'?'la fermeture':confirmMode==='date'?`la programmation au ${resultDate(plannedDate)}`:'l’ouverture'} ?</p><p className="mt-1 text-sm text-slate-600">Cette action mettra à jour Supabase pour ce module uniquement.</p><div className="mt-3 flex gap-2"><button className="btn-primary" disabled={saving} onClick={saveUnlock}>{saving?'Enregistrement...':'Confirmer'}</button><button className="btn-secondary" onClick={()=>setConfirmMode(null)}>Annuler</button></div></div>}
    </Section>
</Modal>
    {editor&&<LessonModal key={editor.lesson?.id||editor.type} moduleId={moduleId} courseId={courseId} lesson={editor.lesson} initialType={editor.type} position={nextPosition} onClose={()=>setEditor(null)} onSaved={()=>{setEditor(null);setTab('allContent');setFilter('all');setSearch('');setRefreshCount(v=>v+1)}}/>}
  </div>;
}
