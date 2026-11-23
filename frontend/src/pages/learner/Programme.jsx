/* Mon programme : un module par jour, puis le suivi J+30, avec l'état d'ouverture de chaque module */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, PlayCircle, CalendarDays } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { fetchCourseTree, fetchLessonProgress } from '../../lib/queries';
import { EmptyState, PageLoader, ProgressBar } from '../../components/ui';
import { moduleLockState, profilDone, profilStore, useLocalStoreVersion } from '../../lib/stores';
import { PROGRAMME, moduleMeta } from '../../data/programme';
import { cn } from '../../lib/utils';

export default function Programme() {
  const { profile } = useAuth();
  useLocalStoreVersion({ refresh: true });
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: enr } = await db.from('enrollments').select('course_id, enrolled_at').eq('user_id', profile.id).order('enrolled_at');
      if (!enr?.length) return setState({ course: null });
      const courseId = enr[0].course_id;
      const [course, progress] = await Promise.all([fetchCourseTree(courseId), fetchLessonProgress(courseId, profile.id)]);
      setState({ course, progress });
    })().catch(() => setState({ course: null }));
  }, [profile.id]);

  if (!state) return <PageLoader />;
  const { course, progress } = state;
  if (!course) return <EmptyState icon={CalendarDays} title="Aucun programme pour l’instant" description="Votre formateur vous inscrira bientôt à votre formation." />;

  const hasProfil = profilDone(profilStore.get(profile.id));
  const mods = course.modules.map((m, i) => ({ m, meta: moduleMeta(m), lock: moduleLockState(course, i, progress, hasProfil) }));
  const byDay = (day) => mods.filter((x) => (day === 'Après' ? x.meta.followUp : x.meta.day === day));

  const Status = ({ x }) =>
    x.lock.done ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Terminé</span>
      : x.lock.locked ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500" title={x.lock.reason}><Lock className="h-3.5 w-3.5" /> {x.lock.reason}</span>
      : <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700"><PlayCircle className="h-3.5 w-3.5" /> Ouvert · {x.lock.pct} %</span>;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">{course.title}</p>
        <h1 className="page-title">Mon programme</h1>
        <p className="page-subtitle">Un module par jour, ouvert par votre formateur, puis un suivi jusqu’à J+30.</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-900 text-xs uppercase tracking-wider text-white">
            <tr><th className="w-32 px-5 py-3">Jour</th><th className="px-5 py-3">Module et statut</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PROGRAMME.map((row) => {
              const list = byDay(row.day);
              return (
                <tr key={row.day} className="align-top">
                  <td className="px-5 py-4 font-display text-base font-extrabold text-navy-900">{row.day}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy-900">{row.module}</p>
                    {list.map((x) => (
                      <Link key={x.m.id} to={`/app/cours/${course.id}`} className={cn('mt-2 block rounded-xl p-3 ring-1 transition', x.lock.locked ? 'bg-slate-50 ring-slate-100' : 'ring-slate-200 hover:ring-brand-300')}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{x.meta.icon}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-800">{x.meta.followUp ? x.m.title : x.meta.label}</span>
                          <Status x={x} />
                        </div>
                        {!x.lock.locked && <ProgressBar value={x.lock.pct} size="xs" className="mt-2" />}
                      </Link>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-center text-sm text-slate-500">
        Chaque module contient des <b>leçons</b>, des <b>missions</b> et un <b>quiz</b>. Retrouvez vos supports dans <Link to="/app/documents" className="font-semibold text-brand-600">Mes documents</Link>.
      </p>
    </div>
  );
}
