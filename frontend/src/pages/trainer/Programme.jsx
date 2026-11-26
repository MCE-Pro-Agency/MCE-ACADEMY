/* Programme & déblocage (formateur / admin)
   - ouverture des modules jour après jour (fermé / ouvert / à une date)
   - grille de suivi : chaque apprenant × chaque module (leçons, missions, quiz) + profil professionnel */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock, CalendarClock, CheckCircle2, ChevronRight, Sparkles, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { fetchCourseTree } from '../../lib/queries';
import { Avatar, EmptyState, PageLoader } from '../../components/ui';
import { moduleStore, profilStore, lastRun, profilDone, useLocalStoreVersion } from '../../lib/stores';
import { moduleTitle, scheduleLabel } from '../../lib/moduleSchedule';
import { moduleMeta } from '../../data/programme';
import { profilType } from '../../data/profilModel';
import { cn, formatDate } from '../../lib/utils';

const todayStr = () => new Date().toISOString().slice(0, 10);
export const isModuleOpen = (s) => s.mode === 'open' || s.mode === 'sequential' || (s.mode === 'date' && s.opensAt && s.opensAt <= todayStr());

const cellColor = (pct) => (pct >= 100 ? '#10B981' : pct >= 60 ? '#2B9FDC' : pct > 0 ? '#F59E0B' : '#E2E8F0');

export default function Programme({ base = '/formateur' }) {
  const { activeCompanyId } = useAuth();
  useLocalStoreVersion({ refresh: true });
  const [courses, setCourses] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [course, setCourse] = useState(null);
  const [learners, setLearners] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if (!activeCompanyId) return;
    db.from('courses').select('id, title, is_published').eq('company_id', activeCompanyId).order('created_at').then(({ data }) => {
      setCourses(data || []);
      setCourseId((data || [])[0]?.id || null);
    });
  }, [activeCompanyId]);

  const load = async (id) => {
    const [tree, enr, mp] = await Promise.all([
      fetchCourseTree(id),
      db.from('enrollments').select('user_id, completed_at, user:profiles(id, full_name, job_title, avatar_url, is_active)').eq('course_id', id),
      db.rpc('module_progress', { p_course: id }),
    ]);
    setCourse(tree);
    setLearners((enr.data || []).filter((e) => e.user).sort((a, b) => a.user.full_name.localeCompare(b.user.full_name)));
    setStats(mp.data || []);
  };
  useEffect(() => {
    if (courseId) load(courseId).catch((e) => toast.error(e.message));
  }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const byCell = useMemo(() => Object.fromEntries(stats.map((s) => [`${s.user_id}:${s.module_id}`, s])), [stats]);

  if (!courses) return <PageLoader />;
  if (!courses.length) return <EmptyState icon={CalendarClock} title="Aucune formation" description="Créez d’abord une formation dans « Cours & modules »." />;
  if (!course) return <PageLoader />;

  const mods = course.modules.map((m) => ({ m, meta: moduleMeta(m), s: moduleStore.get(m.id) }));
  const nextClosed = mods.find((x) => !isModuleOpen(x.s));
  const setMode = async (m, patch, msg) => {
    await moduleStore.set(m.id, patch);
    if (msg) toast.success(msg);
  };
  const completedBy = (moduleId) => learners.filter((l) => { const c = byCell[`${l.user_id}:${moduleId}`]; return c && c.total_lessons > 0 && c.completed_lessons >= c.total_lessons; }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Pilotage pédagogique</p>
          <h1 className="page-title">Programme & déblocage</h1>
          <p className="page-subtitle">Ouvrez les modules jour après jour et suivez l’évolution de chaque apprenant.</p>
        </div>
        {courses.length > 1 && (
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input w-auto">
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </div>

      {nextClosed && (
        <div className="flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-navy-900 to-navy-700 p-6 text-white sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">{nextClosed.meta.icon}</span>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Prochain module à ouvrir</p>
            <p className="text-lg font-bold">{moduleTitle(nextClosed.m.title)}</p>
            <p className="text-sm text-navy-200">{nextClosed.m.lessons.length} éléments · les apprenants y accèdent dès l’ouverture.</p>
          </div>
          <button onClick={() => setMode(nextClosed.m, { mode: 'open' }, `« ${nextClosed.m.title} » est ouvert aux apprenants`)} className="btn-brand px-6 py-3">
            <Unlock className="h-4 w-4" /> Ouvrir maintenant
          </button>
        </div>
      )}

      {/* ---------- Déblocage ---------- */}
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-navy-900">Déblocage jour après jour</h2>
          <p className="text-sm text-slate-500">Un module fermé est invisible pour les apprenants (leçons, missions, quiz et téléchargements).</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {mods.map(({ m, meta, s }, i) => {
            const open = isModuleOpen(s);
            const count = (t) => m.lessons.filter((l) => (t === 'text' ? ['text', 'video', 'document'].includes(l.type) : l.type === t)).length;
            return (
              <li key={m.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span className={cn('flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow', open ? '' : 'opacity-50 grayscale')} style={{ background: meta.color }}>
                    <span className="text-lg leading-none">{meta.icon}</span>
                    <span className="mt-0.5 text-[9px] font-bold">{i + 1}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-navy-900">{moduleTitle(m.title)}</p><p className="text-xs font-semibold text-brand-700 capitalize">{scheduleLabel(m.scheduled_date)}</p>
                    <p className="text-xs text-slate-500">{count('text')} leçons · {count('exercise')} mission(s) · {count('quiz')} quiz · {completedBy(m.id)}/{learners.length} apprenant(s) ont terminé</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold', open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                    {open ? <><CheckCircle2 className="h-3.5 w-3.5" /> Ouvert</> : s.mode === 'date' && s.opensAt ? <><CalendarClock className="h-3.5 w-3.5" /> Le {formatDate(s.opensAt)}</> : <><Lock className="h-3.5 w-3.5" /> Fermé</>}
                  </span>
                  <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                    {[['closed', 'Fermé'], ['open', 'Ouvert'], ['date', 'À une date']].map(([k, label]) => (
                      <button key={k} onClick={() => setMode(m, k === 'date' ? { mode: 'date', opensAt: s.opensAt || todayStr() } : { mode: k })} className={cn('rounded-lg px-3 py-1.5 transition', s.mode === k || (k === 'open' && s.mode === 'sequential') ? 'bg-white text-navy-900 shadow' : 'text-slate-500 hover:text-navy-800')}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {s.mode === 'date' && <input type="date" value={s.opensAt || ''} onChange={(e) => setMode(m, { opensAt: e.target.value })} className="input w-auto py-1.5 text-xs" />}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Suivi apprenant × module ---------- */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Évolution de chaque apprenant</h2>
            <p className="text-sm text-slate-500">Progression par module · 🧠 meilleur score au quiz · ✍️ missions rendues. Cliquez sur un nom pour le suivi détaillé.</p>
          </div>
          <div className="flex gap-3 text-[11px] font-semibold text-slate-500">
            {[['#10B981', 'Terminé'], ['#2B9FDC', '≥ 60 %'], ['#F59E0B', 'Commencé'], ['#E2E8F0', 'Pas commencé']].map(([c, l]) => <span key={l} className="flex items-center gap-1"><span className="h-3 w-3 rounded" style={{ background: c }} />{l}</span>)}
          </div>
        </div>
        {learners.length === 0 ? (
          <p className="flex items-center gap-2 p-6 text-sm text-slate-500"><Users className="h-4 w-4" /> Aucun apprenant inscrit à cette formation.</p>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="sticky left-0 z-10 bg-white px-5 py-3 text-left">Apprenant</th>
                  <th className="px-2 py-3 text-left">Profil</th>
                  {mods.map(({ m, meta }) => (
                    <th key={m.id} className="px-1.5 py-3 text-center" title={m.title}>
                      <span className="block text-base">{meta.icon}</span>
                      {m.scheduled_date ? scheduleLabel(m.scheduled_date) : moduleTitle(m.title).slice(0, 18)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {learners.map(({ user }) => {
                  const run = lastRun(profilStore.get(user.id));
                  const ty = run ? profilType(run) : null;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 bg-white px-5 py-3">
                        <Link to={`${base}/apprenants/${user.id}`} className="flex items-center gap-3">
                          <Avatar name={user.full_name} src={user.avatar_url} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-navy-900 hover:text-brand-600">{user.full_name}</span>
                            <span className="block truncate text-xs text-slate-400">{user.job_title || '—'}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      </td>
                      <td className="px-2 py-3">
                        {run ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700" title={ty.main.nom}>{ty.main.emoji} {run.result.global_score}</span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      {mods.map(({ m, s }) => {
                        const c = byCell[`${user.id}:${m.id}`];
                        const pct = c?.total_lessons ? Math.round((100 * c.completed_lessons) / c.total_lessons) : 0;
                        const open = isModuleOpen(s);
                        return (
                          <td key={m.id} className="px-1.5 py-2 text-center">
                            <div
                              className={cn('mx-auto flex h-14 w-16 flex-col items-center justify-center rounded-xl text-[10px] font-bold', !open && pct === 0 && 'opacity-40')}
                              style={{ background: `${cellColor(pct)}22`, boxShadow: `inset 0 0 0 1.5px ${cellColor(pct)}` }}
                              title={`${m.title}\n${c?.completed_lessons || 0}/${c?.total_lessons || 0} éléments · quiz ${c?.best_quiz != null ? Math.round(c.best_quiz) + ' %' : '—'} · missions ${c?.submitted_exercises || 0}/${c?.total_exercises || 0}`}
                            >
                              <span className="text-sm text-navy-900">{open || pct ? `${pct}%` : <Lock className="h-3.5 w-3.5 text-slate-400" />}</span>
                              <span className="text-slate-500">🧠{c?.best_quiz != null ? Math.round(c.best_quiz) : '–'} ✍️{c?.submitted_exercises || 0}/{c?.total_exercises || 0}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400"><Sparkles className="h-3.5 w-3.5" /> Les réglages sont enregistrés immédiatement et s’appliquent à tous les apprenants de la formation.</p>
    </div>
  );
}
