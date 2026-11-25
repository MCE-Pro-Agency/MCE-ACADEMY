/**
 * MCE Academy — interface apprenant synchronisée avec les tables du formateur.
 * Ce fichier ne modifie ni ProfilPro ni le système de test de profil.
 * Les autorisations réelles restent appliquées par les politiques RLS Supabase.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Download, FileText, LockKeyhole, RefreshCcw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, uploadMedia } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { LEARNER_TABS } from '../../lib/learnerTabs';
import { Markdown } from '../../components/ui';

const formats = { text: 'Cours', video: 'Vidéo', document: 'Document', quiz: 'Quiz', exercise: 'Exercice' };
const isMedia = (l) => ['text','video','document'].includes(l.type);
const today = () => new Date().toISOString().slice(0, 10);
function moduleAccess(setting, previousCompleted, profileCompleted) {
  if (!setting) return { open: true };
  if (setting.mode === 'closed') return { open: false, reason: 'Module fermé par le formateur' };
  if (setting.mode === 'date' && setting.opens_at && setting.opens_at > today()) return { open: false, reason: `Ouverture prévue le ${setting.opens_at}` };
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
  const load = useCallback(async () => {
    if (!companyId || !profile?.id) return;
    setState(s => ({...s,loading:true,error:''}));
    const read = async (q) => {const { data, error } = await q; if (error) throw error;return data || [];};
    try {
      const co = await read(db.from('companies').select('learner_tabs').eq('id', companyId).single());
      if (isLearner && co?.learner_tabs?.[tabKey] !== true) {
        setState({loading:false,error:'',courses:[],modules:[],lessons:[],settings:[],progress:[],docs:[],announcements:[],tabs:co?.learner_tabs || {},profileDone:false});
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
      const [lessons, settings] = await Promise.all([
        mids.length ? read(db.from('lessons').select('*').in('module_id',mids).order('position')) : [],
        mids.length ? read(db.from('module_settings').select('*').in('module_id',mids)) : [],
      ]);
      setState({loading:false,error:'',courses,modules,lessons,settings,progress:prog,docs,announcements:anns,tabs:co?.learner_tabs || {},profileDone:Array.isArray(profiles?.runs) && profiles.runs.length > 0});
    } catch(e) {setState(s => ({...s,loading:false,error:e.message || 'Chargement impossible'}));}
  }, [companyId,profile?.id,tabKey,isLearner]);
  useEffect(() => { load(); }, [load]);
  const enriched = useMemo(() => {
    const {courses,modules,lessons,settings,progress,profileDone} = state;
    const sm = Object.fromEntries(settings.map(s => [s.module_id,s]));
    const done = new Set(progress.filter(p => p.completed).map(p => p.lesson_id));
    return courses.map(c => {
      let previousCompleted = true;
      const cms = modules.filter(m => m.course_id === c.id).map(m => {
        const items = lessons.filter(l => l.module_id === m.id);
        const access = moduleAccess(sm[m.id], previousCompleted,profileDone);
        previousCompleted = items.length > 0 && items.every(l => done.has(l.id));
        return {...m, items, access,completed:previousCompleted,doneCount:items.filter(l => done.has(l.id)).length};
      });
      return {...c,modules:cms};
    });
  }, [state]);
  const open = !isLearner || (state.tabs ?? company?.learner_tabs ?? {})[tabKey] === true;
  if (!tab) return <Message>Onglet inconnu.</Message>;
  const Icon = tab.icon;
  if (state.loading) return <div className="card p-8">Chargement de votre formation…</div>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Ma formation</p><h1 className="page-title flex items-center gap-2"><Icon size={25}/>{tab.label}</h1><p className="page-subtitle">{tab.desc}</p></div><button onClick={load} className="btn-secondary" title="Actualiser"><RefreshCcw size={16}/> Actualiser</button></div>
    {state.error ? <Issue error={state.error} retry={load}/> : !open ? <Message><LockKeyhole className="mb-2 text-slate-400"/>Cet onglet est verrouillé par votre formateur. Il reste visible mais son contenu n'est pas accessible.</Message> : <>
      {tabKey === 'annonces' && (state.announcements.length ? state.announcements.map(a => <article key={a.id} className="card p-5"><h2 className="font-bold">{a.title}</h2><p className="mt-1 text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p><p className="mt-3 whitespace-pre-wrap text-sm">{a.body}</p></article>) : <Message>Aucune annonce publiée pour votre entreprise.</Message>)}
      {tabKey === 'documents' && (state.docs.length ? state.docs.filter(d => !d.user_id || d.user_id === profile.id).map(d => <article key={d.id} className="card flex items-center justify-between gap-4 p-5"><div><h2 className="font-semibold">{d.title}</h2><p className="text-sm text-slate-500">{d.description || d.kind}</p></div><a href={d.file_url} className="btn-secondary" target="_blank" rel="noopener noreferrer"><Download size={16}/> Ouvrir</a></article>) : <Message>Aucun document mis à disposition.</Message>)}
      {['parcours','cours','quiz','exercices'].includes(tabKey) && (enriched.length === 0 ? <Message>Aucune formation publiée pour votre entreprise. Le formateur doit publier une formation dans « Mes formations ».</Message> : enriched.map(c => <section className="card p-5" key={c.id}>
        <h2 className="text-lg font-bold text-navy-900">{c.title}</h2>{c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}
        <div className="mt-4 space-y-3">{c.modules.map(m => {
          const items = tabKey === 'parcours' ? m.items : m.items.filter(l => tabKey === 'cours' ? isMedia(l) : tabKey === 'quiz' ? l.type === 'quiz' : l.type === 'exercise');
          if (tabKey !== 'parcours' && items.length === 0) return null;
          return <div key={m.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-navy-900">{m.title}</h3>{m.access.open ? <span className="text-xs font-medium text-emerald-700">{m.doneCount}/{m.items.length} terminées</span> : <LockKeyhole size={17} className="text-slate-400"/>}</div>
            {m.description && <p className="mt-1 text-xs text-slate-500">{m.description}</p>}
            {!m.access.open ? <p className="mt-3 text-sm text-slate-500">{m.access.reason}</p> : <div className="mt-3 space-y-2">{items.map(l => <div key={l.id} className="rounded-lg border border-slate-100 p-3">
              <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setSelected(x => x === l.id ? null : l.id)}><span className="flex items-center gap-2 text-sm font-medium"><FileText size={15}/>{l.title} <span className="text-xs font-normal text-slate-400">{formats[l.type]}</span></span>{state.progress.some(p => p.lesson_id === l.id && p.completed) ? <CheckCircle2 size={17} className="text-green-600"/> : <BookOpen size={16} className="text-slate-400"/>}</button>
              {selected === l.id && <LessonBody key={l.id} lesson={l} userId={profile.id} progress={state.progress.find(p => p.lesson_id === l.id)} onUpdate={load}/>}</div>)}
              {items.length === 0 && <p className="text-sm text-slate-500">Aucun contenu dans ce module.</p>}
            </div>}
          </div>;
        })}</div>
      </section>))}
    </>}
    <p className="text-xs text-slate-400">Contenus issus des formations du formateur. Les accès définitifs sont contrôlés par Supabase.</p>
  </div>;
}
