import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Menu, X, Download, FileText, RotateCcw, Send,
  Trophy, XCircle, Award, Paperclip, Clock, PartyPopper,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, uploadMedia } from '../../lib/supabase';
import { fetchCourseTree, fetchLessonProgress, flattenLessons } from '../../lib/queries';
import { Badge, Markdown, Modal, PageLoader, ProgressBar, Spinner } from '../../components/ui';
import { cn, formatDateTime, LESSON_TYPES, toEmbedUrl, scoreColor } from '../../lib/utils';

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { profile, setActiveLesson } = useAuth();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [sidebar, setSidebar] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [marking, setMarking] = useState(false);

  // Charge le cours une fois
  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([fetchCourseTree(courseId), fetchLessonProgress(courseId, profile.id)]);
        setCourse(c);
        setProgress(p);
        await supabase
          .from('enrollments')
          .upsert({ user_id: profile.id, course_id: courseId }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
      } catch {
        toast.error('Formation inaccessible.');
        navigate('/app/catalogue');
      }
    })();
  }, [courseId, profile.id, navigate]);

  // Charge la leçon courante
  useEffect(() => {
    setLesson(null);
    setSidebar(false);
    supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()
      .then(({ data, error }) => {
        if (error) return toast.error('Leçon introuvable.');
        setLesson(data);
        window.scrollTo({ top: 0 });
      });
    setActiveLesson(lessonId);
    return () => setActiveLesson(null);
  }, [lessonId, setActiveLesson]);

  const lessons = useMemo(() => flattenLessons(course), [course]);
  const index = lessons.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  const doneCount = lessons.filter((l) => progress[l.id]?.completed).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const currentModule = course?.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
  const isDone = progress[lessonId]?.completed;

  const markComplete = useCallback(
    async (id = lessonId) => {
      if (progress[id]?.completed) return;
      setMarking(true);
      const { error } = await supabase.from('lesson_progress').upsert(
        { user_id: profile.id, lesson_id: id, course_id: courseId, completed: true, completed_at: new Date().toISOString(), last_viewed_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' }
      );
      setMarking(false);
      if (error) return toast.error(error.message);
      const updated = { ...progress, [id]: { ...(progress[id] || {}), completed: true } };
      setProgress(updated);
      const allDone = lessons.length > 0 && lessons.every((l) => updated[l.id]?.completed);
      if (allDone) setCelebrate(true);
      else toast.success('Leçon terminée ✔');
    },
    [lessonId, progress, profile.id, courseId, lessons]
  );

  const goNext = async () => {
    if (!isDone && lesson && ['text', 'video', 'document'].includes(lesson.type)) await markComplete();
    if (next) navigate(`/app/cours/${courseId}/lecon/${next.id}`);
  };

  if (!course) return <PageLoader label="Ouverture de la formation…" />;

  const Curriculum = (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Programme</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-navy-800">{doneCount}/{lessons.length} leçons</span>
          <span className="font-bold text-brand-600">{pct}%</span>
        </div>
        <ProgressBar value={pct} size="sm" className="mt-2" />
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto pb-6">
        {course.modules.map((m, mi) => (
          <div key={m.id}>
            <p className="sticky top-0 z-10 bg-slate-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-navy-600">
              {mi + 1}. {m.title}
            </p>
            {m.lessons.map((l) => {
              const T = LESSON_TYPES[l.type];
              const active = l.id === lessonId;
              const done = progress[l.id]?.completed;
              return (
                <Link
                  key={l.id}
                  to={`/app/cours/${courseId}/lecon/${l.id}`}
                  className={cn('flex items-start gap-3 border-l-4 px-4 py-3 text-sm transition', active ? 'border-brand-500 bg-brand-50' : 'border-transparent hover:bg-slate-50')}
                >
                  {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn('block', active ? 'font-semibold text-navy-900' : 'text-navy-700')}>{l.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400"><T.icon className="h-3 w-3" /> {T.label} · {l.duration_minutes} min</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Barre supérieure */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-navy-900 px-3 text-white sm:px-5">
        <Link to={`/app/cours/${courseId}`} className="rounded-lg p-2 hover:bg-navy-800" title="Retour à la formation">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <img src="/logo.png" alt="" className="hidden h-8 w-8 rounded-lg bg-white p-0.5 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{course.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-navy-700">
              <div className="h-full rounded-full bg-brand-400 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-navy-200">{pct}%</span>
          </div>
        </div>
        {pct >= 100 && (
          <Link to={`/app/certificat/${courseId}`} className="btn-gold btn-sm hidden sm:inline-flex"><Award className="h-4 w-4" /> Certificat</Link>
        )}
        <button onClick={() => setSidebar(true)} className="rounded-lg p-2 hover:bg-navy-800 lg:hidden"><Menu className="h-5 w-5" /></button>
      </header>

      <div className="flex flex-1">
        {/* Programme desktop */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-80 shrink-0 border-r border-slate-200 lg:block">{Curriculum}</aside>

        {/* Programme mobile */}
        {sidebar && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-navy-950/50" onClick={() => setSidebar(false)} />
            <div className="absolute inset-y-0 right-0 w-80 max-w-[85%] animate-fade-in shadow-lift">
              <button onClick={() => setSidebar(false)} className="absolute right-3 top-3 z-20 rounded-lg bg-white p-1.5 text-slate-500"><X className="h-4 w-4" /></button>
              {Curriculum}
            </div>
          </div>
        )}

        {/* Contenu */}
        <main className="min-w-0 flex-1">
          {!lesson ? (
            <PageLoader />
          ) : (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 animate-fade-in">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand" icon={LESSON_TYPES[lesson.type].icon}>{LESSON_TYPES[lesson.type].label}</Badge>
                  <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3.5 w-3.5" /> {lesson.duration_minutes} min</span>
                  {isDone && <Badge tone="green" icon={CheckCircle2}>Terminée</Badge>}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500">{currentModule?.title}</p>
                <h1 className="mt-1 text-2xl font-extrabold text-navy-900 sm:text-3xl">{lesson.title}</h1>
              </div>

              {lesson.type === 'video' && <VideoBlock lesson={lesson} />}
              {lesson.type === 'document' && <DocumentBlock lesson={lesson} />}
              {['text', 'video', 'document'].includes(lesson.type) && lesson.content && (
                <div className="card mt-6 p-6 sm:p-8">
                  <Markdown>{lesson.content}</Markdown>
                </div>
              )}
              {lesson.type === 'quiz' && <QuizBlock lesson={lesson} onPassed={() => setProgress((p) => ({ ...p, [lesson.id]: { ...(p[lesson.id] || {}), completed: true } }))} />}
              {lesson.type === 'exercise' && <ExerciseBlock lesson={lesson} onSubmitted={() => markComplete(lesson.id)} />}

              {/* Navigation */}
              <div className="mt-10 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
                {prev ? (
                  <Link to={`/app/cours/${courseId}/lecon/${prev.id}`} className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Précédent</Link>
                ) : <span />}
                <div className="flex flex-col gap-3 sm:flex-row">
                  {['text', 'video', 'document'].includes(lesson.type) && !isDone && (
                    <button onClick={() => markComplete()} disabled={marking} className="btn-secondary">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Marquer comme terminée
                    </button>
                  )}
                  {next ? (
                    <button onClick={goNext} className="btn-primary">Leçon suivante <ArrowRight className="h-4 w-4" /></button>
                  ) : (
                    <Link to={pct >= 100 ? `/app/certificat/${courseId}` : `/app/cours/${courseId}`} className={pct >= 100 ? 'btn-gold' : 'btn-primary'}>
                      {pct >= 100 ? <><Award className="h-4 w-4" /> Obtenir mon certificat</> : 'Terminer'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal open={celebrate} onClose={() => setCelebrate(false)} title="Félicitations ! 🎉" size="sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gold-100 text-gold-500">
            <PartyPopper className="h-10 w-10" />
          </div>
          <p className="text-navy-800">Vous avez terminé <strong>{course.title}</strong>.</p>
          <p className="mt-1 text-sm text-slate-500">Votre certificat de réussite est disponible.</p>
          <Link to={`/app/certificat/${courseId}`} className="btn-gold mt-6 w-full"><Award className="h-4 w-4" /> Voir mon certificat</Link>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- Vidéo ---------------- */
function VideoBlock({ lesson }) {
  const embed = toEmbedUrl(lesson.video_url);
  if (!embed) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center rounded-2xl bg-navy-900 text-center text-navy-200">
        <FileText className="mb-3 h-10 w-10 text-brand-400" />
        <p className="font-semibold text-white">Vidéo bientôt disponible</p>
        <p className="mt-1 text-sm">Votre formateur n’a pas encore ajouté la vidéo de cette leçon.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-lift">
      {embed.type === 'iframe' ? (
        <iframe src={embed.src} title={lesson.title} className="aspect-video w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <video src={embed.src} controls className="aspect-video w-full" />
      )}
    </div>
  );
}

/* ---------------- Document ---------------- */
function DocumentBlock({ lesson }) {
  if (!lesson.file_url) return null;
  const isPdf = /\.pdf($|\?)/i.test(lesson.file_url);
  return (
    <div className="space-y-4">
      {isPdf && <iframe src={lesson.file_url} title={lesson.title} className="h-[70vh] w-full rounded-2xl border border-slate-200 bg-white" />}
      <a href={lesson.file_url} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-5 hover:shadow-lift">
        <div className="rounded-xl bg-brand-50 p-3 text-brand-600"><Paperclip className="h-6 w-6" /></div>
        <div className="flex-1">
          <p className="font-bold text-navy-900">Support de cours</p>
          <p className="text-sm text-slate-500">Ouvrir ou télécharger le document</p>
        </div>
        <Download className="h-5 w-5 text-slate-400" />
      </a>
    </div>
  );
}

/* ---------------- Quiz ---------------- */
function QuizBlock({ lesson, onPassed }) {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: qs }, { data: att }] = await Promise.all([
        supabase.from('quiz_questions').select('*').eq('lesson_id', lesson.id).order('position'),
        supabase.from('quiz_attempts').select('score, passed').eq('lesson_id', lesson.id).eq('user_id', profile.id),
      ]);
      setQuestions(qs || []);
      setAttempts(att?.length || 0);
      setBest(att?.length ? Math.max(...att.map((a) => Number(a.score))) : null);
      setLoading(false);
    })();
  }, [lesson.id, profile.id]);

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) return toast.error('Répondez à toutes les questions.');
    setSubmitting(true);
    const { data, error } = await supabase.rpc('submit_quiz', { p_lesson_id: lesson.id, p_answers: answers });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setResult(data);
    setAttempts((a) => a + 1);
    setBest((b) => Math.max(b ?? 0, Number(data.score)));
    if (data.passed) onPassed?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
  };

  if (loading) return <div className="card p-10 text-center"><Spinner className="mx-auto" /></div>;
  if (!questions.length) return <div className="card p-8 text-center text-slate-500">Ce quiz ne contient pas encore de questions.</div>;

  const details = Object.fromEntries((result?.details || []).map((d) => [d.question_id, d]));
  const answered = Object.keys(answers).length;

  return (
    <div className="space-y-5">
      {lesson.content && <div className="card p-6"><Markdown>{lesson.content}</Markdown></div>}

      {result ? (
        <div className={cn('card overflow-hidden', result.passed ? 'ring-emerald-200' : 'ring-amber-200')}>
          <div className={cn('flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left', result.passed ? 'bg-emerald-50' : 'bg-amber-50')}>
            <div className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl', result.passed ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white')}>
              {result.passed ? <Trophy className="h-8 w-8" /> : <RotateCcw className="h-8 w-8" />}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-navy-900">{result.passed ? 'Quiz réussi, bravo !' : 'Presque ! Encore un effort.'}</p>
              <p className="text-sm text-slate-600">
                {result.correct} bonne{result.correct > 1 ? 's' : ''} réponse{result.correct > 1 ? 's' : ''} sur {result.total} · seuil de réussite {result.passing_score}%
              </p>
            </div>
            <p className={cn('font-display text-4xl font-extrabold', scoreColor(result.score))}>{Math.round(result.score)}%</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-sm ring-1 ring-slate-100">
          <span className="text-slate-500">{questions.length} questions · réussite à partir de {lesson.passing_score}%</span>
          {best !== null && <span className="font-semibold text-navy-800">Meilleur score : <span className={scoreColor(best)}>{Math.round(best)}%</span> ({attempts} tentative{attempts > 1 ? 's' : ''})</span>}
        </div>
      )}

      {questions.map((q, qi) => {
        const d = details[q.id];
        return (
          <div key={q.id} className="card p-6">
            <p className="font-semibold text-navy-900">
              <span className="mr-2 text-brand-500">{qi + 1}.</span>{q.question}
            </p>
            <div className="mt-4 grid gap-2.5">
              {(q.options || []).map((opt, oi) => {
                const selected = answers[q.id] === oi;
                const isCorrect = d && d.correct_index === oi;
                const isWrong = d && selected && !d.is_correct;
                return (
                  <button
                    key={oi}
                    disabled={!!result}
                    onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ring-1 ring-inset transition',
                      isCorrect ? 'bg-emerald-50 ring-emerald-300 text-emerald-900' :
                      isWrong ? 'bg-red-50 ring-red-300 text-red-900' :
                      selected ? 'bg-brand-50 ring-brand-400 text-navy-900' : 'ring-slate-200 hover:bg-slate-50 text-navy-800'
                    )}
                  >
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                      isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : isWrong ? 'border-red-500 bg-red-500 text-white' : selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 text-slate-400')}>
                      {isCorrect ? '✓' : isWrong ? '✕' : String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {d?.explanation && (
              <p className={cn('mt-4 flex gap-2 rounded-xl px-4 py-3 text-sm', d.is_correct ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700')}>
                {d.is_correct ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                {d.explanation}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between gap-4">
        {!result && <ProgressBar value={(answered / questions.length) * 100} size="sm" className="max-w-xs" />}
        {result ? (
          <button onClick={retry} className="btn-secondary ml-auto"><RotateCcw className="h-4 w-4" /> Recommencer le quiz</button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn-brand ml-auto">
            {submitting ? <Spinner className="text-white" /> : <><Send className="h-4 w-4" /> Valider mes réponses</>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Exercice ---------------- */
function ExerciseBlock({ lesson, onSubmitted }) {
  const { profile } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    supabase
      .from('exercise_submissions')
      .select('*')
      .eq('lesson_id', lesson.id)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubmission(data);
        setContent(data?.content || '');
        setFileUrl(data?.file_url || '');
        setEditing(!data);
      });
  }, [lesson.id, profile.id]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error('Fichier trop volumineux (50 Mo max).');
    setUploading(true);
    try {
      setFileUrl(await uploadMedia(file, `submissions/${profile.id}`));
      toast.success('Fichier ajouté');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!content.trim() && !fileUrl) return toast.error('Rédigez une réponse ou joignez un fichier.');
    setSaving(true);
    const { data, error } = await supabase
      .from('exercise_submissions')
      .upsert(
        { user_id: profile.id, lesson_id: lesson.id, course_id: lesson.course_id, content, file_url: fileUrl || null, submitted_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' }
      )
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setSubmission(data);
    setEditing(false);
    toast.success('Exercice envoyé à votre formateur');
    onSubmitted?.();
  };

  const graded = submission?.status === 'graded';

  return (
    <div className="space-y-5">
      {lesson.content && <div className="card p-6 sm:p-8"><Markdown>{lesson.content}</Markdown></div>}

      {graded && (
        <div className="card overflow-hidden ring-gold-300">
          <div className="flex items-center gap-4 bg-gradient-to-r from-navy-900 to-navy-700 p-5 text-white">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-gold-400">
              <span className="font-display text-2xl font-extrabold text-gold-400">{Number(submission.grade)}</span>
              <span className="text-[10px] text-navy-200">/ 20</span>
            </div>
            <div>
              <p className="font-bold">Exercice corrigé</p>
              <p className="text-sm text-navy-200">Le {formatDateTime(submission.graded_at)}</p>
            </div>
          </div>
          {submission.feedback && (
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Retour du formateur</p>
              <p className="mt-2 whitespace-pre-line text-sm text-navy-800">{submission.feedback}</p>
            </div>
          )}
        </div>
      )}

      <div className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold text-navy-900">Ma réponse</h3>
          {submission && (
            <Badge tone={graded ? 'gold' : submission.status === 'returned' ? 'amber' : 'brand'}>
              {graded ? 'Corrigé' : submission.status === 'returned' ? 'À reprendre' : `Envoyé le ${formatDateTime(submission.submitted_at)}`}
            </Badge>
          )}
        </div>

        {editing ? (
          <>
            <textarea className="input min-h-[200px] font-[inherit]" placeholder="Rédigez votre réponse ici…" value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="btn-secondary cursor-pointer">
                {uploading ? <Spinner /> : <Paperclip className="h-4 w-4" />}
                {fileUrl ? 'Remplacer le fichier' : 'Joindre un fichier'}
                <input type="file" className="hidden" onChange={upload} />
              </label>
              {fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer" className="truncate text-sm text-brand-600 underline">Fichier joint</a>}
              <div className="flex gap-2">
                {submission && <button onClick={() => setEditing(false)} className="btn-ghost">Annuler</button>}
                <button onClick={submit} disabled={saving || uploading} className="btn-brand">
                  {saving ? <Spinner className="text-white" /> : <><Send className="h-4 w-4" /> Envoyer</>}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm text-navy-800">{submission?.content || <em className="text-slate-400">Pas de texte</em>}</p>
            {submission?.file_url && (
              <a href={submission.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                <Paperclip className="h-4 w-4" /> Voir le fichier joint
              </a>
            )}
            {!graded && (
              <div className="mt-4 flex justify-end">
                <button onClick={() => setEditing(true)} className="btn-secondary">Modifier ma réponse</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
