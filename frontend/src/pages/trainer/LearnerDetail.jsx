import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Target, Star, BookOpen, Plus, X, Mail, Briefcase, CalendarDays, Activity } from 'lucide-react';
import { db } from '../../lib/db';
import { fetchCourseTree, fetchProgressMap } from '../../lib/queries';
import { moduleStore, profilStore, profilDone, useLocalStoreVersion } from '../../lib/stores';
import { moduleMeta } from '../../data/programme';
import ProfilReport from '../../components/profil/ProfilReport';
import ProfilDownload from '../../components/profil/ProfilDownload';
import { isModuleOpen } from './Programme';
import { Avatar, Badge, PageLoader, ProgressBar, StatCard, Tabs } from '../../components/ui';
import { formatDate, formatDateTime, formatDuration, scoreColor, timeAgo } from '../../lib/utils';

export default function LearnerDetail({ base = '/formateur' }) {
  const { userId } = useParams();
  useLocalStoreVersion({ refresh: true });
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('evolution');

  const load = async () => {
    const { data: who } = await db.from('profiles').select('company_id').eq('id', userId).maybeSingle();
    const [p, prog, courses, attempts, subs, sessions, done] = await Promise.all([
      db.from('profiles').select('*').eq('id', userId).single(),
      fetchProgressMap(userId),
      db.from('courses').select('id, title, is_published').eq('company_id', who?.company_id || '').order('created_at'),
      db.from('quiz_attempts').select('*, lesson:lessons(title), course:courses(title)').eq('user_id', userId).order('created_at', { ascending: false }),
      db.from('exercise_submissions').select('*, lesson:lessons(title), course:courses(title)').eq('user_id', userId).order('submitted_at', { ascending: false }),
      db.from('user_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(200),
      db.from('lesson_progress').select('lesson_id, course_id, completed_at').eq('user_id', userId).eq('completed', true),
    ]);
    // Évolution module par module, pour chaque formation suivie
    const enrolled = (courses.data || []).filter((c) => prog[c.id]);
    const evolution = await Promise.all(
      enrolled.map(async (c) => {
        const [tree, mp] = await Promise.all([fetchCourseTree(c.id), db.rpc('module_progress', { p_course: c.id, p_user: userId })]);
        const byModule = Object.fromEntries((mp.data || []).map((r) => [r.module_id, r]));
        return { course: tree, rows: tree.modules.map((m) => ({ m, meta: moduleMeta(m), st: byModule[m.id] || {} })) };
      })
    );
    setData({
      profile: p.data,
      progress: prog,
      courses: courses.data || [],
      attempts: attempts.data || [],
      submissions: subs.data || [],
      sessions: sessions.data || [],
      completed: done.data || [],
      evolution,
    });
  };

  useEffect(() => {
    load();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const daily = useMemo(() => {
    if (!data) return [];
    const days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), minutes: 0 };
    });
    const idx = Object.fromEntries(days.map((d, i) => [d.key, i]));
    data.sessions.forEach((s) => {
      const k = new Date(s.started_at).toISOString().slice(0, 10);
      if (idx[k] !== undefined) days[idx[k]].minutes += Math.round(s.duration_seconds / 60);
    });
    return days;
  }, [data]);

  const timeline = useMemo(() => {
    if (!data) return { lessons: [], quiz: [] };
    const dates = data.completed.map((x) => x.completed_at).filter(Boolean).map(String).sort();
    const perDay = {};
    dates.forEach((d) => (perDay[d.slice(0, 10)] = (perDay[d.slice(0, 10)] || 0) + 1));
    let cum = 0;
    const lessons = Object.keys(perDay).sort().map((k) => ({ label: new Date(k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), total: (cum += perDay[k]) }));
    const quiz = [...data.attempts].reverse().map((a) => ({ label: a.lesson?.title || 'Quiz', score: Math.round(a.score) }));
    return { lessons, quiz };
  }, [data]);

  if (!data) return <PageLoader />;
  if (!data.profile) return <p className="text-slate-500">Apprenant introuvable.</p>;

  const { profile, progress, courses, attempts, submissions, sessions } = data;
  const totalSeconds = sessions.reduce((s, x) => s + x.duration_seconds, 0);
  const best = {};
  attempts.forEach((a) => (best[a.lesson_id] = Math.max(best[a.lesson_id] ?? 0, Number(a.score))));
  const bestVals = Object.values(best);
  const avgQuiz = bestVals.length ? Math.round(bestVals.reduce((a, b) => a + b, 0) / bestVals.length) : null;
  const graded = submissions.filter((s) => s.grade !== null);
  const avgEx = graded.length ? (graded.reduce((s, x) => s + Number(x.grade), 0) / graded.length).toFixed(1) : null;
  const enrolledIds = Object.keys(progress);
  const notEnrolled = courses.filter((c) => !enrolledIds.includes(c.id));
  const progList = Object.values(progress);
  const overall = progList.length
    ? Math.round((progList.reduce((s, p) => s + Number(p.completed_lessons), 0) / Math.max(1, progList.reduce((s, p) => s + Number(p.total_lessons), 0))) * 100)
    : 0;

  const enroll = async (courseId) => {
    const { error } = await db.from('enrollments').insert({ user_id: userId, course_id: courseId });
    if (error) return toast.error(error.message);
    toast.success('Apprenant inscrit');
    load();
  };
  const unenroll = async (courseId) => {
    if (!confirm('Désinscrire cet apprenant de ce cours ? Sa progression est conservée.')) return;
    const { error } = await db.from('enrollments').delete().eq('user_id', userId).eq('course_id', courseId);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-6">
      <Link to={`${base}/apprenants`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-800">
        <ArrowLeft className="h-4 w-4" /> Apprenants
      </Link>

      <div className="card flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">{profile.full_name}</h1>
            {!profile.is_active && <Badge tone="red">Désactivé</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {profile.email}</span>
            {profile.job_title && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {profile.job_title}</span>}
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Inscrit le {formatDate(profile.created_at)}</span>
            <span className="flex items-center gap-1.5"><Activity className="h-4 w-4" /> Vu {timeAgo(profile.last_seen_at).toLowerCase()}</span>
          </div>
          <ProgressBar value={overall} showLabel className="mt-4 max-w-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock} label="Temps de connexion" value={formatDuration(totalSeconds)} hint={`${sessions.length} sessions`} tone="navy" />
        <StatCard icon={BookOpen} label="Cours terminés" value={`${progList.filter((p) => p.progress_pct >= 100).length}/${progList.length}`} />
        <StatCard icon={Target} label="Moyenne quiz" value={avgQuiz !== null ? `${avgQuiz}%` : '—'} tone="green" />
        <StatCard icon={Star} label="Moyenne exercices" value={avgEx !== null ? `${avgEx}/20` : '—'} tone="gold" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'evolution', label: 'Évolution' },
          { value: 'profil', label: 'Profil professionnel' },
          { value: 'courses', label: 'Cours', count: progList.length },
          { value: 'grades', label: 'Notes', count: attempts.length + submissions.length },
          { value: 'activity', label: 'Connexions', count: sessions.length },
        ]}
      />

      {tab === 'evolution' && <Evolution data={data} timeline={timeline} />}
      {tab === 'profil' && <ProfilTab learner={profile} />}

      {tab === 'courses' && (
        <div className="space-y-4">
          <div className="card divide-y divide-slate-100">
            {courses.filter((c) => progress[c.id]).map((c) => {
              const p = progress[c.id];
              return (
                <div key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-900">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {p.completed_lessons}/{p.total_lessons} leçons · {formatDuration(p.time_spent_seconds)} passées · inscrit le {formatDate(p.enrolled_at)}
                      {p.completed_at && ` · terminé le ${formatDate(p.completed_at)}`}
                    </p>
                  </div>
                  <ProgressBar value={p.progress_pct} showLabel className="sm:w-64" />
                  <button onClick={() => unenroll(c.id)} className="btn-ghost btn-sm text-slate-400 hover:text-red-600" title="Désinscrire"><X className="h-4 w-4" /></button>
                </div>
              );
            })}
            {progList.length === 0 && <p className="p-5 text-sm text-slate-500">Inscrit à aucun cours.</p>}
          </div>
          {notEnrolled.length > 0 && (
            <div className="card p-5">
              <p className="mb-3 text-sm font-semibold text-navy-800">Inscrire à un autre cours</p>
              <div className="flex flex-wrap gap-2">
                {notEnrolled.map((c) => (
                  <button key={c.id} onClick={() => enroll(c.id)} className="btn-secondary btn-sm"><Plus className="h-3.5 w-3.5" /> {c.title}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'grades' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="border-b border-slate-100 px-5 py-4 font-bold text-navy-900">Quiz</h3>
            <ul className="divide-y divide-slate-100">
              {attempts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-800">{a.lesson?.title}</p>
                    <p className="text-xs text-slate-400">{a.course?.title} · {formatDateTime(a.created_at)}</p>
                  </div>
                  <span className={`font-bold ${scoreColor(a.score)}`}>{Math.round(a.score)}%</span>
                  <Badge tone={a.passed ? 'green' : 'amber'}>{a.passed ? 'Réussi' : 'Échoué'}</Badge>
                </li>
              ))}
              {attempts.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">Aucune tentative.</li>}
            </ul>
          </div>
          <div className="card">
            <h3 className="border-b border-slate-100 px-5 py-4 font-bold text-navy-900">Exercices</h3>
            <ul className="divide-y divide-slate-100">
              {submissions.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-800">{s.lesson?.title}</p>
                      <p className="text-xs text-slate-400">{s.course?.title} · {formatDateTime(s.submitted_at)}</p>
                    </div>
                    {s.grade !== null ? <span className="font-bold text-navy-900">{Number(s.grade)}/20</span> : <Badge tone="brand">À corriger</Badge>}
                  </div>
                </li>
              ))}
              {submissions.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">Aucun exercice rendu.</li>}
            </ul>
            {submissions.some((s) => s.status === 'submitted') && (
              <div className="border-t border-slate-100 p-4 text-right">
                <Link to="/formateur/corrections" className="btn-primary btn-sm">Corriger</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="card p-6 lg:col-span-3">
            <h3 className="mb-4 font-bold text-navy-900">Minutes de connexion (14 jours)</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`${v} min`, 'Temps']} contentStyle={{ borderRadius: 12, border: 'none' }} cursor={{ fill: '#EBF7FD' }} />
                  <Bar dataKey="minutes" fill="#2B9FDC" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card lg:col-span-2">
            <h3 className="border-b border-slate-100 px-5 py-4 font-bold text-navy-900">Dernières sessions</h3>
            <ul className="scroll-thin max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {sessions.slice(0, 50).map((s) => (
                <li key={s.id} className="flex justify-between px-5 py-2.5 text-sm">
                  <span className="text-navy-800">{formatDateTime(s.started_at)}</span>
                  <span className="font-semibold text-slate-600">{formatDuration(s.duration_seconds)}</span>
                </li>
              ))}
              {sessions.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">Aucune connexion enregistrée.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Évolution module par module ---------------- */
function Evolution({ data, timeline }) {
  if (!data.evolution.length) return <p className="card p-6 text-sm text-slate-500">Cet apprenant n’est inscrit à aucune formation.</p>;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-bold text-navy-900">Éléments terminés au fil du temps</h3>
          <p className="mb-3 text-xs text-slate-500">Leçons, missions et quiz validés (cumul)</p>
          <div className="h-52">
            {timeline.lessons.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline.lessons} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="evo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2B9FDC" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#2B9FDC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [v, 'Éléments terminés']} contentStyle={{ borderRadius: 12, border: 'none' }} />
                  <Area type="monotone" dataKey="total" stroke="#2B9FDC" strokeWidth={3} fill="url(#evo)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-16 text-center text-sm text-slate-400">Aucun élément terminé pour l’instant.</p>
            )}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-navy-900">Scores aux quiz</h3>
          <p className="mb-3 text-xs text-slate-500">Chaque tentative, dans l’ordre chronologique</p>
          <div className="h-52">
            {timeline.quiz.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline.quiz} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F8" vertical={false} />
                  <XAxis dataKey="label" tick={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`${v} %`, 'Score']} contentStyle={{ borderRadius: 12, border: 'none' }} />
                  <Line type="monotone" dataKey="score" stroke="#C9A227" strokeWidth={3} dot={{ r: 5, fill: '#C9A227' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-16 text-center text-sm text-slate-400">Aucun quiz passé pour l’instant.</p>
            )}
          </div>
        </div>
      </div>

      {data.evolution.map(({ course, rows }) => (
        <div key={course.id} className="card overflow-hidden">
          <h3 className="border-b border-slate-100 px-5 py-4 font-bold text-navy-900">{course.title}</h3>
          <ul className="divide-y divide-slate-100">
            {rows.map(({ m, meta, st }) => {
              const pct = st.total_lessons ? Math.round((100 * st.completed_lessons) / st.total_lessons) : 0;
              const open = isModuleOpen(moduleStore.get(m.id));
              return (
                <li key={m.id} className="grid gap-3 px-5 py-4 md:grid-cols-12 md:items-center">
                  <div className="flex items-center gap-3 md:col-span-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: `${meta.color}1f` }}>{meta.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-900">{m.title}</p>
                      <p className="text-xs text-slate-400">
                        {open ? 'Module ouvert' : '🔒 Module fermé'}
                        {st.last_completed_at ? ` · dernière activité le ${formatDate(st.last_completed_at)}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-3"><ProgressBar value={pct} showLabel /></div>
                  <div className="flex flex-wrap gap-2 text-xs md:col-span-4 md:justify-end">
                    <span className={`rounded-full px-2.5 py-1 font-bold ${st.best_quiz != null ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>🧠 Quiz {st.best_quiz != null ? `${Math.round(st.best_quiz)} %` : '—'}</span>
                    <span className={`rounded-full px-2.5 py-1 font-bold ${st.submitted_exercises ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>✍️ Missions {st.submitted_exercises || 0}/{st.total_exercises || 0}</span>
                    {st.avg_grade != null && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">⭐ {st.avg_grade}/20</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Profil professionnel ---------------- */
function ProfilTab({ learner }) {
  const p = profilStore.get(learner.id);
  const [comment, setComment] = useState(p.comment || '');
  useEffect(() => setComment(p.comment || ''), [p.comment]);
  if (!profilDone(p)) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl">🧭</p>
        <p className="mt-3 font-bold text-navy-900">{learner.full_name} n’a pas encore passé son test de profil professionnel.</p>
        <p className="mt-1 text-sm text-slate-500">{p.draft ? 'Un test est en cours : les réponses sont enregistrées au fur et à mesure.' : 'Le rapport apparaîtra ici dès la fin du questionnaire.'}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-navy-900">✍️ Observations du formateur <span className="font-normal text-slate-500">(ajoutées au rapport de l’apprenant)</span></p>
          <ProfilDownload profil={{ ...p, comment }} name={learner.full_name} />
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input" placeholder="Observations en formation, progrès constatés, engagements…" />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { profilStore.setComment(learner.id, comment); toast.success('Observations enregistrées'); }} className="btn-primary btn-sm">Enregistrer</button>
          <button onClick={() => { profilStore.allowRetake(learner.id); toast.success('Nouvelle passation ouverte'); }} disabled={p.retake} className="btn-secondary btn-sm">
            {p.retake ? 'Nouvelle passation ouverte ✔' : 'Ouvrir une nouvelle passation (mesurer l’évolution)'}
          </button>
          <span className="self-center text-xs text-slate-400">{p.runs.length} passation(s)</span>
        </div>
      </div>
      <ProfilReport profil={p} name={learner.full_name} />
    </div>
  );
}
