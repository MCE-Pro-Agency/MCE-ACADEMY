import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, Clock, Layers, PlayCircle, Award, Lock, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { fetchCourseTree, fetchLessonProgress, flattenLessons } from '../../lib/queries';
import { Badge, Markdown, PageLoader, ProgressBar, ProgressRing } from '../../components/ui';
import { CourseCover } from '../../components/CourseCard';
import { cn, formatMinutes, LESSON_TYPES, LEVEL_LABELS } from '../../lib/utils';
import { moduleLockState, profilStore, profilDone, useLocalStoreVersion } from '../../lib/stores';
import ModuleJourney from '../../components/ModuleJourney';
import ModuleDownloads from '../../components/ModuleDownloads';
import { moduleMeta } from '../../data/programme';

export default function CourseDetail() {
  const { courseId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { profile, isLearner } = useAuth();
  useLocalStoreVersion();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState({});
  const [enrolled, setEnrolled] = useState(false);
  const [openModules, setOpenModules] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, p, e] = await Promise.all([
          fetchCourseTree(courseId),
          fetchLessonProgress(courseId, profile.id),
          db.from('enrollments').select('id').eq('course_id', courseId).eq('user_id', profile.id).maybeSingle(),
        ]);
        setCourse(c);
        setProgress(p);
        setEnrolled(Boolean(e.data));
        setOpenModules(Object.fromEntries(c.modules.map((m, i) => [m.id, i === 0 || m.lessons.some((l) => !p[l.id]?.completed)])));
      } catch {
        setError('Cette formation est introuvable ou ne vous est pas accessible.');
      }
    })();
  }, [courseId, profile.id]);

  const lessons = useMemo(() => flattenLessons(course), [course]);
  // Déblocage des modules (les formateurs / admins en aperçu ne sont pas bloqués)
  const hasProfil = profilDone(profilStore.get(profile.id));
  const locks = course ? course.modules.map((_, i) => moduleLockState(course, i, progress, hasProfil)) : [];
  const isLocked = (mi) => isLearner && locks[mi]?.locked;
  const openLessons = course ? course.modules.flatMap((m, mi) => (isLocked(mi) ? [] : m.lessons)) : [];
  const doneCount = lessons.filter((l) => progress[l.id]?.completed).length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  const nextLesson = openLessons.find((l) => !progress[l.id]?.completed) || openLessons[0];

  useEffect(() => {
    if (params.get('reprendre') && nextLesson) navigate(`/app/cours/${courseId}/lecon/${nextLesson.id}`, { replace: true });
  }, [params, nextLesson, courseId, navigate]);

  const start = async () => {
    if (!enrolled) {
      const { error: err } = await db
        .from('enrollments')
        .upsert({ user_id: profile.id, course_id: courseId }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
      if (err) return toast.error(err.message);
      setEnrolled(true);
    }
    if (nextLesson) navigate(`/app/cours/${courseId}/lecon/${nextLesson.id}`);
    else toast(lessons.length ? 'Les modules ne sont pas encore ouverts.' : 'Cette formation ne contient pas encore de leçon.');
  };

  if (error) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-600">{error}</p>
        <Link to="/app/catalogue" className="btn-primary mt-4">Retour aux formations</Link>
      </div>
    );
  }
  if (!course) return <PageLoader />;

  const totalMinutes = course.estimated_minutes || lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0);

  return (
    <div className="space-y-8">
      <Link to="/app/catalogue" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" /> Mes formations
      </Link>

      {/* En-tête */}
      <section className="overflow-hidden rounded-3xl bg-navy-900">
        <div className="grid lg:grid-cols-5">
          <div className="p-6 sm:p-10 lg:col-span-3">
            <div className="flex flex-wrap gap-2">
              {course.category && <Badge tone="brand">{course.category}</Badge>}
              <Badge className="bg-white/10 text-white">{LEVEL_LABELS[course.level]}</Badge>
              {!course.is_published && <Badge tone="amber">Brouillon (aperçu)</Badge>}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">{course.title}</h1>
            {course.subtitle && <p className="mt-3 text-lg text-navy-200">{course.subtitle}</p>}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-200">
              <span className="flex items-center gap-1.5"><Layers className="h-4 w-4 text-brand-400" /> {course.modules.length} modules</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-brand-400" /> {lessons.length} leçons</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-400" /> {formatMinutes(totalMinutes)}</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={start} className="btn-brand px-6 py-3 text-base">
                <PlayCircle className="h-5 w-5" />
                {pct >= 100 ? 'Revoir la formation' : doneCount > 0 ? 'Continuer' : 'Commencer la formation'}
              </button>
              {pct >= 100 && (
                <Link to={`/app/certificat/${course.id}`} className="btn-gold px-5 py-3 text-base">
                  <Award className="h-5 w-5" /> Mon certificat
                </Link>
              )}
            </div>
          </div>
          <div className="relative hidden lg:col-span-2 lg:block">
            <CourseCover course={course} className="h-full min-h-[260px]" />
            {enrolled && (
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-lift backdrop-blur">
                <ProgressRing value={pct} size={58} stroke={6} />
                <div>
                  <p className="text-sm font-bold text-navy-900">Votre progression</p>
                  <p className="text-xs text-slate-500">{doneCount} / {lessons.length} leçons terminées</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {enrolled && (
          <div className="px-6 pb-6 sm:px-10 lg:hidden">
            <ProgressBar value={pct} showLabel className="[&_span]:text-white" />
          </div>
        )}
      </section>

      {course.modules.length > 1 && (
        <section className="card p-6">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Mon parcours</p>
              <h2 className="text-xl font-bold text-navy-900">Déblocage des modules</h2>
            </div>
            <p className="text-sm text-slate-500">{locks.filter((l) => !l.locked).length}/{course.modules.length} modules ouverts · {locks.filter((l) => l.done).length} terminé(s)</p>
          </div>
          <ModuleJourney
            items={course.modules.map((m, i) => ({ title: m.title, pct: locks[i].pct, reason: locks[i].reason, state: locks[i].done ? 'done' : isLocked(i) ? 'locked' : 'open' }))}
            onSelect={(i) => setOpenModules({ ...openModules, [course.modules[i].id]: true })}
          />
          {!hasProfil && locks.some((l) => l.kind === 'profil') && (
            <Link to="/app/mon-profil" className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-navy-800 ring-1 ring-brand-100 hover:bg-brand-100">
              🧭 Certains modules s’ouvrent après votre test de profil professionnel.
              <span className="btn-brand btn-sm">Passer le test</span>
            </Link>
          )}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Programme */}
        <section className="space-y-3 lg:col-span-2">
          <h2 className="text-xl font-bold text-navy-900">Programme de la formation</h2>
          {course.modules.map((m, mi) => {
            const done = m.lessons.filter((l) => progress[l.id]?.completed).length;
            const open = openModules[m.id];
            const locked = isLocked(mi);
            return (
              <div key={m.id} className={cn('card overflow-hidden', locked && 'opacity-75')}>
                <button onClick={() => setOpenModules({ ...openModules, [m.id]: !open })} className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-50">
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold', done === m.lessons.length && m.lessons.length ? 'bg-emerald-500 text-white' : 'bg-navy-50 text-navy-700')}>
                    {done === m.lessons.length && m.lessons.length ? <CheckCircle2 className="h-5 w-5" /> : locked ? <Lock className="h-4 w-4" /> : mi + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-900"><span className="mr-1.5">{moduleMeta(m).icon}</span>{m.title}</p>
                    {locks[mi]?.locked && <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-700"><Lock className="h-3 w-3" /> {locks[mi].reason}{!isLearner && ' (aperçu formateur : accessible)'}</p>}
                    <p className="text-xs text-slate-500">{done}/{m.lessons.length} leçons{m.description ? ` · ${m.description}` : ''}</p>
                    <ProgressBar value={m.lessons.length ? (done / m.lessons.length) * 100 : 0} size="xs" className="mt-2 max-w-xs" />
                  </div>
                  <ChevronDown className={cn('h-5 w-5 text-slate-400 transition', open && 'rotate-180')} />
                </button>
                {open && (
                  <ul className="border-t border-slate-100">
                    {m.lessons.map((l) => {
                      const T = LESSON_TYPES[l.type];
                      const isDone = progress[l.id]?.completed;
                      return (
                        <li key={l.id}>
                          <Link
                            to={locked ? '#' : `/app/cours/${course.id}/lecon/${l.id}`}
                            onClick={(e) => { if (locked) { e.preventDefault(); toast(locks[mi].reason, { icon: '🔒' }); } }}
                            className={cn('flex items-center gap-3 px-5 py-3 text-sm', locked ? 'cursor-not-allowed' : 'hover:bg-brand-50/50')}
                          >
                            {isDone ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="h-5 w-5 shrink-0 text-slate-300" />}
                            <span className={cn('rounded-lg p-1.5', T.color)}><T.icon className="h-3.5 w-3.5" /></span>
                            <span className={cn('flex-1', isDone ? 'text-slate-500' : 'font-medium text-navy-800')}>{l.title}</span>
                            <span className="text-xs text-slate-400">{T.label} · {l.duration_minutes} min</span>
                          </Link>
                        </li>
                      );
                    })}
                    {m.lessons.length === 0 && (
                      <li className="flex items-center gap-2 px-5 py-3 text-sm text-slate-400">
                        <Lock className="h-4 w-4" /> {locked ? 'Leçons, missions et quiz visibles dès l’ouverture du module par votre formateur' : 'Contenu bientôt disponible'}
                      </li>
                    )}
                    <li className="border-t border-slate-100 bg-slate-50/40 p-5">
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">📥 Télécharger les contenus du module</p>
                      <ModuleDownloads module={m} courseTitle={course.title} locked={locked} lockReason={locks[mi]?.reason} />
                    </li>
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        {/* Description */}
        <aside className="space-y-4">
          <div className="card p-6">
            <h2 className="mb-3 text-lg font-bold text-navy-900">À propos</h2>
            {course.description ? <Markdown className="prose-sm">{course.description}</Markdown> : <p className="text-sm text-slate-500">Aucune description.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
