import { isRich } from '../../lib/richContent';
/**
 * MCE Academy — interface apprenant synchronisée avec les tables du formateur.
 * Ce fichier ne modifie ni ProfilPro ni le système de test de profil.
 * Les autorisations réelles restent appliquées par les politiques RLS Supabase.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Download, FileText, LockKeyhole, RefreshCcw, Send, CalendarDays, ArrowRight, ChevronDown, ClipboardCheck, PenLine, PlayCircle, Megaphone, FolderOpen, Sparkles, Search, GraduationCap, Clock, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, uploadMedia } from '../../lib/db';
import { moduleTitle, scheduleLabel } from '../../lib/moduleSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { LEARNER_TABS } from '../../lib/learnerTabs';
import { Markdown } from '../../components/ui';
import { Link } from 'react-router-dom';
import './learner-premium.css';

const formats = { text: 'Cours', video: 'Vidéo', document: 'Document', quiz: 'Quiz', exercise: 'Exercice' };
const isMedia = (l) => ['text','video','document'].includes(l.type);
const today = () => new Date().toISOString().slice(0, 10);
function moduleAccess(setting, previousCompleted, profileCompleted) {
  if (!setting) return { open: false, reason: 'En attente d’ouverture' };
  if (setting.mode === 'closed') return { open: false, reason: 'Module fermé par le formateur' };
  if (setting.mode === 'date' && (!setting.opens_at || setting.opens_at > today())) return { open: false, reason: setting.opens_at ? `Ouverture prévue le ${setting.opens_at}` : 'Date d’ouverture non définie' };
  if (setting.mode === 'sequential' && !previousCompleted) return { open: false, reason: 'Terminez le module précédent' };
  if (setting.requires_profile && !profileCompleted) return { open: false, reason: 'Test de profil requis' };
  return { open: true };
}
function Message({ children }) { return <div className="card p-6 text-sm text-slate-600">{children}</div>; }
function Issue({ error, retry }) { return <div className="card p-6"><p className="text-red-600">{error}</p><button className="btn-secondary mt-3" onClick={retry}>Réessayer</button></div>; }
function LessonBody({ lesson, userId, progress, onUpdate }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState('');
  const [submission, setSubmission] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [best, setBest] = useState(null);
  useEffect(() => {
    let live = true;
    setError(''); setResult(null); setAnswers({}); setQuestions(null); setText(''); setAttachment(''); setSubmission(null);setBest(null);
    if (lesson.type === 'quiz') {
      Promise.all([
        db.from('quiz_questions').select('id,question,options,position').eq('lesson_id', lesson.id).order('position'),
        db.from('quiz_attempts').select('score').eq('lesson_id', lesson.id).eq('user_id', userId),
      ]).then(([q, a]) => { if (!live) return; if (q.error) setError(q.error.message); setQuestions(q.data || []); if (a.data?.length) setBest(Math.max(...a.data.map(x => Number(x.score)))); });
    }
    if (lesson.type === 'exercise') {
      db.from('exercise_submissions').select('*').eq('lesson_id', lesson.id).eq('user_id', userId).maybeSingle()
        .then(({data,error: e}) => { if (!live) return; if (e) setError(e.message); setSubmission(data);setText(data?.content || '');setAttachment(data?.file_url || ''); });
    }
    return () => {live = false;};
  }, [lesson.id, lesson.type, userId]);
  const mark = async () => {
    setSaving(true);
    const { error: e } = await db.from('lesson_progress').upsert({ user_id: userId, course_id: lesson.course_id, lesson_id: lesson.id, completed: true, completed_at: new Date().toISOString(), last_viewed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' });
    setSaving(false);
    if (e) return toast.error(e.message);
    toast.success('Leçon terminée');onUpdate();
  };
  const sendQuiz = async () => {
    if (!questions?.length || questions.some(q => answers[q.id] === undefined)) return toast.error('Répondez à toutes les questions.');
    setSaving(true);
    const { data, error: e } = await db.rpc('submit_quiz', { p_lesson_id: lesson.id, p_answers: answers });
    setSaving(false);
    if (e) return toast.error(e.message);
    setResult(data);setBest(v => Math.max(v ?? 0, Number(data.score)));
    toast.success('Quiz transmis : résultat enregistré');onUpdate();
  };
  const sendExercise = async () => {
    if (!text.trim() && !attachment) return toast.error('Saisissez votre réponse ou joignez un fichier.');
    setSaving(true);
    const { data, error: e } = await db.from('exercise_submissions').upsert({ user_id: userId, lesson_id: lesson.id, course_id: lesson.course_id, content: text, file_url: attachment || null, submitted_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' }).select().single();
    setSaving(false);
    if (e) return toast.error(e.message);
    setSubmission(data);toast.success('Exercice transmis au formateur');onUpdate();
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error('Fichier trop volumineux (maximum 50 Mo).');
    setSaving(true);
    try {setAttachment(await uploadMedia(file, `submissions/${userId}`)); toast.success('Fichier ajouté');}
    catch (e) {toast.error(e.message);} finally {setSaving(false);}
  };
  return <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    {error && <p className="text-red-600">{error}</p>}
    {lesson.content && <Markdown>{lesson.content}</Markdown>}
    {lesson.type === 'video' && lesson.video_url && <a className="btn-secondary" href={lesson.video_url} target="_blank" rel="noopener noreferrer">Voir la vidéo</a>}
    {(lesson.type === 'document' || lesson.type === 'video') && lesson.file_url && <a className="btn-secondary" href={lesson.file_url} target="_blank" rel="noopener noreferrer"><Download size={16}/> Ouvrir le support</a>}
    {isMedia(lesson) && <button className="btn-primary" disabled={saving || !!progress?.completed} onClick={mark}>{progress?.completed ? 'Leçon terminée' : 'Marquer la leçon comme terminée'}</button>}
    {lesson.type === 'quiz' && <div className="space-y-4">
      {best !== null && <p className="text-sm font-semibold text-slate-600">Meilleur score : {best} %</p>}
      {questions === null && !error && <p>Chargement des questions…</p>}
      {questions?.length === 0 && <p>Aucune question publiée pour ce quiz.</p>}
      {!result && questions?.map((q, i) => <fieldset key={q.id} className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 font-semibold">{i + 1}. {q.question}</legend>
        {(Array.isArray(q.options) ? q.options : []).map((option, j) => <label key={j} className="flex cursor-pointer items-start gap-3 py-2 text-sm"><input type="radio" name={`quiz-${q.id}`} checked={answers[q.id] === j} onChange={() => setAnswers(v => ({ ...v, [q.id]: j }))}/><span>{String(option)}</span></label>)}
      </fieldset>)}
      {!result && !!questions?.length && <button disabled={saving} className="btn-primary" onClick={sendQuiz}><Send size={16}/> Valider mes réponses</button>}
      {result && <div className="rounded-lg bg-slate-50 p-4"><p className="font-bold">Score : {result.score} % — {result.passed ? 'Réussi' : 'Non réussi'}</p><p className="text-sm">{result.correct} / {result.total} réponses correctes</p><button className="btn-secondary mt-3" onClick={() => {setResult(null);setAnswers({});}}>Recommencer</button></div>}
    </div>}
    {lesson.type === 'exercise' && <div className="space-y-3">
      {submission?.status === 'graded' && <div className="rounded-lg bg-emerald-50 p-3 text-sm"><b>Note : {submission.grade}/20</b>{submission.feedback && <p>Retour du formateur : {submission.feedback}</p>}</div>}
      {submission && submission.status !== 'graded' && <p className="text-sm text-emerald-700">Travail déjà transmis. Vous pouvez le mettre à jour.</p>}
      <label className="block text-sm font-semibold">Ma réponse<textarea className="input mt-2 min-h-32 w-full" value={text} onChange={e => setText(e.target.value)} placeholder="Rédigez votre réponse ici…" /></label>
      <label className="block text-sm">Joindre un fichier (facultatif)<input className="mt-1 block w-full" type="file" onChange={upload}/></label>
      {attachment && <a href={attachment} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 underline">Voir mon fichier joint</a>}
      <button className="btn-primary" disabled={saving || submission?.status === 'graded'} onClick={sendExercise}><Send size={16}/> {submission ? 'Mettre à jour ma réponse' : 'Envoyer au formateur'}</button>
    </div>}
  </div>;
}

export default function LearnerTab({ tabKey }) {
  const { profile, company, isLearner } = useAuth();
  const tab = LEARNER_TABS.find(x => x.key === tabKey);
  const companyId = profile?.company_id;
  const [state, setState] = useState({ loading: true, error: '', courses: [], modules: [], lessons: [], settings: [], progress: [], docs: [], announcements: [], tabs: null, profileDone: false });
  const [selected, setSelected] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  useEffect(() => { setSelected(null); setExpandedModule(null); setSearch(''); setFilter('all'); }, [tabKey]);
  const load = useCallback(async () => {
    if (!companyId || !profile?.id) {setState(s=>({...s,loading:false,loadedTab:tabKey,error:'Aucune entreprise associée à votre compte.'})); return;}
    setState(s => ({...s,error:''}));
    const read = async (q) => {const { data, error } = await q; if (error) throw error;return data || [];};
    try {
      const co = await read(db.from('companies').select('learner_tabs').eq('id', companyId).single());
      if (isLearner && tabKey !== 'parcours' && co?.learner_tabs?.[tabKey] !== true) {
        setState({loading:false,loadedTab:tabKey,error:'',courses:[],modules:[],lessons:[],settings:[],progress:[],docs:[],announcements:[],tabs:co?.learner_tabs || {},profileDone:false});
        return;
      }
      const [courses, prog, docs, anns, profiles] = await Promise.all([
        read(db.from('courses').select('id,title,description,is_published,company_id').eq('company_id', companyId).eq('is_published', true).order('created_at')),
        read(db.from('lesson_progress').select('lesson_id,completed').eq('user_id', profile.id)),
        tabKey === 'documents' ? read(db.from('documents').select('*').eq('company_id',companyId).eq('is_available',true).order('created_at', {ascending:false})) : Promise.resolve([]),
        tabKey === 'annonces' ? read(db.from('announcements').select('id,title,body,created_at').eq('company_id', companyId).order('created_at', {ascending:false})) : Promise.resolve([]),
        read(db.from('profile_assessments').select('runs').eq('user_id', profile.id).maybeSingle()).catch(() => null),
      ]);
      const ids = courses.map(c => c.id);
      const modules = ids.length ? await read(db.from('modules').select('*').in('course_id', ids).order('position')) : [];
      const mids = modules.map(m => m.id);
      const [lessons, settings, moduleStats] = await Promise.all([
        mids.length ? read(db.from('lessons').select('*').in('module_id',mids).order('position')) : [],
        mids.length ? read(db.from('module_settings').select('*').in('module_id',mids)) : [],
        Promise.all(ids.map(id => read(db.rpc('module_progress', {p_course:id,p_user:profile.id})).catch(() => []))).then(rows => rows.flat()),
      ]);
      setState({loading:false,loadedTab:tabKey,error:'',courses,modules,lessons,settings,moduleStats,progress:prog,docs,announcements:anns,tabs:co?.learner_tabs || {},profileDone:Array.isArray(profiles?.runs) && profiles.runs.length > 0});
    } catch(e) {setState(s => ({...s,loading:false,loadedTab:tabKey,error:e.message || 'Chargement impossible'}));}
  }, [companyId,profile?.id,tabKey,isLearner]);
  useEffect(() => { load(); }, [load]);
  const enriched = useMemo(() => {
    const {courses,modules,lessons,settings,progress,profileDone} = state;
    const sm = Object.fromEntries(settings.map(s => [s.module_id,s]));
    const done = new Set(progress.filter(p => p.completed).map(p => p.lesson_id));
    const stats = Object.fromEntries((state.moduleStats || []).map(r => [r.module_id,r]));
    return courses.map(c => {
      let previousCompleted = true;
      const cms = modules.filter(m => m.course_id === c.id).map(m => {
        const items = lessons.filter(l => l.module_id === m.id);
        const access = moduleAccess(sm[m.id], previousCompleted,profileDone);
        const st = stats[m.id];
        const total = st ? Number(st.total_lessons) : null;
        const doneCount = st ? Number(st.completed_lessons) : items.filter(l => done.has(l.id)).length;
        previousCompleted = total !== null && total > 0 && doneCount >= total;
        return {...m, items, access,completed:previousCompleted,doneCount,total};
      });
      return {...c,modules:cms};
    });
  }, [state]);
  const open = !isLearner || (state.tabs ?? company?.learner_tabs ?? {})[tabKey] === true;
  const schedule = tabKey === 'parcours';
  const all = enriched.flatMap(c => c.modules.map(m => ({...m, courseTitle:c.title})));
  const status = m => m.completed ? 'done' : !m.access.open || (schedule && !open) ? 'locked' : m.doneCount > 0 ? 'doing' : 'ready';
  const statusText = {done:'Terminé',locked:'Verrouillé',doing:'En cours',ready:'Disponible'};
  const match = value => String(value || '').toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr'));
  const ordered = [...all].sort((a,b) => (a.scheduled_date || '9999').localeCompare(b.scheduled_date || '9999') || a.position-b.position);
  const visible = ordered.filter(m => (match(m.title)||match(m.courseTitle)) && (filter==='all'||status(m)===filter));
  const dated = [...new Set(visible.map(m => m.scheduled_date || ''))];
  const total = all.reduce((n,m)=>n+(m.total||0),0);
  const completed = all.reduce((n,m)=>n+(m.total===null?0:m.doneCount),0);
  const known = all.every(m=>m.total!==null);
  const pct = known && total ? Math.round(100*completed/total) : null;
  const labels = {parcours:['Mes formations','Votre programme, jour après jour.'],cours:['Mes cours','Explorez vos leçons et supports de formation.'],quiz:['Mes quiz','Évaluez vos acquis et retrouvez vos résultats.'],exercices:['Mes exercices','Passez à la pratique et retrouvez les retours de votre formateur.'],documents:['Mes documents','Retrouvez vos ressources et supports pédagogiques.'],annonces:['Annonces','Restez informé des messages de votre formateur.']};
  if (!tab) return <Message>Onglet inconnu.</Message>;
  const Icon = tab.icon;
  if (state.loading || state.loadedTab !== tabKey) return <div className="lp-loading"><RefreshCcw className="animate-spin" size={22}/> Chargement de votre espace…</div>;
  const lessonIcon = {text:BookOpen,video:PlayCircle,document:FileText,quiz:ClipboardCheck,exercise:PenLine};
  const renderLesson = l => { const LIcon=lessonIcon[l.type]||FileText; const done=state.progress.some(p=>p.lesson_id===l.id&&p.completed); return <div className="lp-lesson" key={l.id}><button type="button" className="lp-lesson-head" aria-expanded={selected===l.id} onClick={()=>setSelected(x=>x===l.id?null:l.id)}><span className={'lp-icon lp-type-'+l.type}><LIcon size={20}/></span><span className="lp-grow"><small>{formats[l.type]}</small><strong>{l.title}</strong></span>{done?<CheckCircle2 size={20} className="text-emerald-600"/>:<ChevronDown size={18} className={selected===l.id?'rotate-180':''}/>}</button>{selected===l.id&&<LessonBody key={l.id} lesson={l} userId={profile.id} progress={state.progress.find(p=>p.lesson_id===l.id)} onUpdate={load}/>}</div>; };
  return <div className="lp-shell">
    <header className={'lp-hero lp-hero-'+tabKey}><div className="lp-hero-copy"><span className="lp-kicker"><Sparkles size={14}/> MCE ACADEMY · ESPACE APPRENANT</span><h1>{labels[tabKey][0]}</h1><p>{labels[tabKey][1]}</p><button type="button" onClick={load} className="lp-refresh"><RefreshCcw size={15}/> Actualiser</button></div><div className="lp-hero-art" aria-hidden="true"><Icon size={82} strokeWidth={1.25}/><span className="lp-orbit"/><span className="lp-orbit lp-orbit-two"/></div>{schedule&&<div className="lp-hero-progress"><div><span>Votre progression</span><strong>{pct===null?'—':pct+' %'}</strong></div><div className="lp-track"><span style={{width:`${pct||0}%`}}/></div><small>{all.filter(m=>m.completed).length} module(s) terminé(s) sur {all.length}</small></div>}</header>
    {state.error ? <Issue error={state.error} retry={load}/> : !open&&!schedule ? <div className="lp-empty"><LockKeyhole size={32}/><h2>Votre espace sera bientôt disponible</h2><p>Votre formateur n’a pas encore ouvert cet onglet.</p></div> : <>
    {schedule&&<><div className="lp-guide"><span className="lp-icon"><Compass size={23}/></span><div><strong>Votre parcours en trois étapes</strong><p>Découvrez les leçons, réalisez les missions et validez vos acquis avec les quiz. Votre formateur ouvre les modules au fil de la formation.</p></div></div><div className="lp-section-title"><div><small>VOTRE PROGRAMME</small><h2>Les séances de formation</h2></div><span>{all.length} modules</span></div><div className="lp-tools"><label className="lp-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un module" aria-label="Rechercher un module"/></label><div className="lp-filters">{[['all','Tout'],['ready','Disponibles'],['doing','En cours'],['locked','Verrouillés'],['done','Terminés']].map(([k,v])=><button key={k} className={filter===k?'active':''} onClick={()=>setFilter(k)}>{v}</button>)}</div></div>
    {!visible.length&&<Message>Aucun module correspondant.</Message>}{dated.map(date=><section className="lp-day" key={date||'none'}><div className="lp-day-label"><CalendarDays size={17}/><strong>{date?new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'À programmer'}</strong></div><div className="lp-day-list">{visible.filter(m=>(m.scheduled_date||'')===date).map(m=>{const st=status(m); const locked=!m.access.open||!open;return <article key={m.id} className={'lp-session lp-status-'+st}><span className="lp-session-number">{String(ordered.findIndex(x=>x.id===m.id)+1).padStart(2,'0')}</span><div className="lp-grow"><small>{m.courseTitle}</small><h3>{moduleTitle(m.title)}</h3><span className="lp-pill">{st==='locked'?<LockKeyhole size={13}/>:st==='done'?<CheckCircle2 size={13}/>:<Clock size={13}/>} {statusText[st]}{locked&&st==='done'?' · accès fermé':''}</span>{m.total!==null&&m.total>0&&<div className="lp-mini-progress"><div className="lp-track"><span style={{width:`${Math.min(100,100*m.doneCount/m.total)}%`}}/></div><small>{m.doneCount}/{m.total}</small></div>}{locked&&<p className="lp-note">{!open?'Parcours en attente d’ouverture':m.access.reason}</p>}</div>{!locked?<button type="button" className="lp-session-action" onClick={()=>setExpandedModule(x=>x===m.id?null:m.id)} aria-expanded={expandedModule===m.id}>{expandedModule===m.id?'Fermer':'Voir'} <ChevronDown size={16}/></button>:<LockKeyhole className="lp-lock" size={21}/>} {!locked&&expandedModule===m.id&&<div className="lp-session-details">{m.items.length?m.items.map(renderLesson):<p className="lp-note">Les contenus seront disponibles selon les accès de votre formateur.</p>}<div className="lp-links">{[['cours','Leçons'],['exercices','Missions'],['quiz','Quiz']].filter(([k])=>!isLearner||state.tabs?.[k]).map(([k,t])=><Link key={k} to={'/app/'+k}>{t}<ArrowRight size={14}/></Link>)}</div></div>}</article>;})}</div></section>)}</>}
    {tabKey==='annonces'&&<div className="lp-resource-grid">{state.announcements.length?state.announcements.map(a=><article key={a.id} className="lp-resource lp-announcement"><span className="lp-icon lp-type-quiz"><Megaphone size={23}/></span><small>{new Date(a.created_at).toLocaleDateString('fr-FR',{dateStyle:'long'})}</small><h2>{a.title}</h2><div>{isRich(a.body)?<Markdown>{a.body}</Markdown>:<p className="whitespace-pre-wrap">{a.body}</p>}</div></article>):<Message>Aucune annonce publiée.</Message>}</div>}
    {tabKey==='documents'&&<div className="lp-resource-grid">{state.docs.filter(d=>!d.user_id||d.user_id===profile.id).length?state.docs.filter(d=>!d.user_id||d.user_id===profile.id).map(d=><article key={d.id} className="lp-resource"><span className="lp-icon"><FolderOpen size={25}/></span><small>{d.kind}</small><h2>{d.title}</h2>{d.description&&<p>{d.description}</p>}<a href={d.file_url} target="_blank" rel="noopener noreferrer" className="lp-download"><Download size={16}/> Ouvrir le document</a></article>):<Message>Aucun document mis à disposition.</Message>}</div>}
    {['cours','quiz','exercices'].includes(tabKey)&&<><div className="lp-tools"><label className="lp-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un contenu" aria-label="Rechercher un contenu"/></label></div>{!ordered.length?<Message>Aucune formation publiée.</Message>:!ordered.some(m=>!m.access.open&&match(m.title)||m.items.some(l=>(tabKey==='cours'?isMedia(l):tabKey==='quiz'?l.type==='quiz':l.type==='exercise')&&(match(l.title)||match(m.title))))&&<Message>Aucun contenu correspondant pour le moment.</Message>}<div className="lp-content-grid">{ordered.map(m=>{const items=m.items.filter(l=>(tabKey==='cours'?isMedia(l):tabKey==='quiz'?l.type==='quiz':l.type==='exercise')&&(match(l.title)||match(m.title)));if(!items.length&&m.access.open)return null;if(!match(m.title)&&!items.length)return null;return <section key={m.id} className="lp-module"><header><span className="lp-icon"><GraduationCap size={22}/></span><div className="lp-grow"><small>{scheduleLabel(m.scheduled_date)}</small><h2>{moduleTitle(m.title)}</h2></div>{!m.access.open&&<LockKeyhole size={19}/>}</header>{m.access.open?items.map(renderLesson):<p className="lp-note">{m.access.reason}</p>}</section>;})}</div></>}
    </>}
  </div>;
}
