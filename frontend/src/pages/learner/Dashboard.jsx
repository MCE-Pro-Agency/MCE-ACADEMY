import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trophy, Clock, Target, PlayCircle, Megaphone, ArrowRight, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { fetchProgressMap } from '../../lib/queries';
import { PageLoader, ProgressBar, ProgressRing, StatCard, EmptyState } from '../../components/ui';
import CourseCard, { CourseCover } from '../../components/CourseCard';
import { formatDuration, formatDate, timeAgo } from '../../lib/utils';
import { BRAND } from '../../config';
import { profilStore, lastRun, useLocalStoreVersion } from '../../lib/stores';
import { profilType } from '../../data/profilModel';

export default function LearnerDashboard() {
  const { profile, company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [avgScore, setAvgScore] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [lessonCounts, setLessonCounts] = useState({});

  useEffect(() => {
    (async () => {
      const [prog, sessions, attempts, ann] = await Promise.all([
        fetchProgressMap(),
        db.from('user_sessions').select('duration_seconds').eq('user_id', profile.id),
        db.from('quiz_attempts').select('lesson_id, score').eq('user_id', profile.id),
        db.from('announcements').select('*').order('created_at', { ascending: false }).limit(4),
      ]);
      setProgress(prog);
      setTotalSeconds((sessions.data || []).reduce((s, r) => s + r.duration_seconds, 0));
      const best = {};
      (attempts.data || []).forEach((a) => (best[a.lesson_id] = Math.max(best[a.lesson_id] ?? 0, Number(a.score))));
      const vals = Object.values(best);
      setAvgScore(vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null);
      setAnnouncements(ann.data || []);

      const ids = Object.keys(prog);
      if (ids.length) {
        const { data } = await db.from('courses').select('*').in('id', ids);
        setCourses(data || []);
        setLessonCounts(Object.fromEntries(ids.map((id) => [id, prog[id].total_lessons])));
      }
      setLoading(false);
    })();
  }, [profile.id]);

  const stats = useMemo(() => {
    const list = Object.values(progress);
    const completed = list.filter((p) => p.progress_pct >= 100).length;
    const inProgress = list.length - completed;
    const totalLessons = list.reduce((s, p) => s + Number(p.total_lessons), 0);
    const doneLessons = list.reduce((s, p) => s + Number(p.completed_lessons), 0);
    const overall = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;
    return { completed, inProgress, overall, doneLessons, totalLessons };
  }, [progress]);

  const resume = useMemo(() => {
    const candidates = courses
      .map((c) => ({ course: c, p: progress[c.id] }))
      .filter((x) => x.p && x.p.progress_pct < 100)
      .sort((a, b) => new Date(b.p.last_viewed_at || 0) - new Date(a.p.last_viewed_at || 0));
    return candidates[0];
  }, [courses, progress]);

  if (loading) return <PageLoader />;
  const firstName = profile.full_name?.split(' ')[0] || '';

  return (
    <div className="space-y-8">
      {/* Bandeau d'accueil */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 85% 20%, #2B9FDC 0, transparent 45%)' }} />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-brand-300">{company?.name || BRAND.name}</p>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Bonjour {firstName} 👋</h1>
            <p className="mt-2 max-w-lg text-navy-200">
              {stats.overall >= 100
                ? 'Bravo, vous avez terminé toutes vos formations ! 🎉'
                : stats.doneLessons > 0
                ? `Vous avez terminé ${stats.doneLessons} leçon${stats.doneLessons > 1 ? 's' : ''} sur ${stats.totalLessons}. Continuez sur votre lancée !`
                : 'Bienvenue dans votre espace de formation. Prêt(e) à commencer ?'}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">{BRAND.motto}</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <ProgressRing value={stats.overall} size={84} stroke={8} labelClassName="text-white text-base" trackColor="rgba(255,255,255,0.15)" />
            <div>
              <p className="text-sm text-navy-200">Progression globale</p>
              <p className="text-lg font-bold text-white">{stats.doneLessons}/{stats.totalLessons} leçons</p>
            </div>
          </div>
        </div>
      </section>

      <ProfilBanner userId={profile.id} />

      {/* KPI */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Formations en cours" value={stats.inProgress} />
        <StatCard icon={Trophy} label="Formations terminées" value={stats.completed} tone="gold" />
        <StatCard icon={Clock} label="Temps de formation" value={formatDuration(totalSeconds)} tone="navy" />
        <StatCard icon={Target} label="Moyenne aux quiz" value={avgScore !== null ? `${avgScore}%` : '—'} tone="green" />
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Reprendre */}
          {resume && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy-900"><Flame className="h-5 w-5 text-gold-500" /> Reprendre où vous en étiez</h2>
              <div className="card flex flex-col overflow-hidden sm:flex-row">
                <CourseCover course={resume.course} className="h-36 sm:h-auto sm:w-56" />
                <div className="flex flex-1 flex-col justify-between gap-4 p-5">
                  <div>
                    <p className="font-bold text-navy-900">{resume.course.title}</p>
                    <p className="text-sm text-slate-500">
                      {resume.p.completed_lessons}/{resume.p.total_lessons} leçons · dernière activité {timeAgo(resume.p.last_viewed_at)}
                    </p>
                  </div>
                  <ProgressBar value={resume.p.progress_pct} showLabel />
                  <Link to={`/app/cours/${resume.course.id}?reprendre=1`} className="btn-primary self-start">
                    <PlayCircle className="h-4 w-4" /> Continuer
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Mes formations */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Mes formations</h2>
              <Link to="/app/catalogue" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Tout voir <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Aucune formation pour le moment"
                description="Découvrez les formations disponibles pour votre entreprise."
                action={<Link to="/app/catalogue" className="btn-primary">Voir les formations</Link>}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {courses.map((c) => (
                  <CourseCard key={c.id} course={c} progress={progress[c.id]} lessonsCount={lessonCounts[c.id]} to={`/app/cours/${c.id}`} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Annonces */}
        <aside className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900"><Megaphone className="h-5 w-5 text-brand-500" /> Annonces</h2>
          {announcements.length === 0 ? (
            <div className="card p-5 text-sm text-slate-500">Aucune annonce pour le moment.</div>
          ) : (
            announcements.map((a) => (
              <article key={a.id} className="card border-l-4 border-l-brand-400 p-5">
                <p className="text-xs text-slate-400">{formatDate(a.created_at)}</p>
                <h3 className="mt-1 font-bold text-navy-900">{a.title}</h3>
                {a.body && <p className="mt-1.5 whitespace-pre-line text-sm text-slate-600">{a.body}</p>}
              </article>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}

/* Bandeau « Mon profil pro » */
function ProfilBanner({ userId }) {
  useLocalStoreVersion();
  const p = profilStore.get(userId);
  const run = lastRun(p);
  if (run) {
    const t = profilType(run);
    return (
      <Link to="/app/mon-profil" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
        <span className="mce-float flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-3xl">{t.main.emoji}</span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Mon profil pro</p>
          <p className="font-bold text-navy-900">{t.main.nom} · indice {run.result.global_score}/100</p>
          <p className="text-sm text-slate-500">Revoir mes diagrammes, mes appuis et mon plan d’action 30 jours.</p>
        </div>
        <ArrowRight className="h-5 w-5 text-brand-500" />
      </Link>
    );
  }
  return (
    <Link to="/app/mon-profil" className="relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 p-5 text-white shadow-lift transition hover:-translate-y-0.5">
      <span className="text-4xl mce-float">🧭</span>
      <div className="flex-1">
        <p className="text-lg font-extrabold">{p.draft ? 'Terminez votre profil professionnel' : 'Première étape : votre profil professionnel'}</p>
        <p className="text-sm text-white/85">Environ 25 minutes pour découvrir vos forces, votre manière de fonctionner et votre plan de progression, avec des diagrammes personnalisés.</p>
      </div>
      <span className="btn bg-white text-navy-900 hover:bg-white/90">Commencer</span>
    </Link>
  );
}
