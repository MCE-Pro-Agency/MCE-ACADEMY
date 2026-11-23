import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, GraduationCap, Clock, Target, ClipboardCheck, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { Avatar, Badge, EmptyState, PageLoader, ProgressBar, StatCard } from '../../components/ui';
import { formatDuration, timeAgo, num } from '../../lib/utils';

export default function TrainerDashboard() {
  const { activeCompanyId, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [pending, setPending] = useState(0);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    if (!activeCompanyId) return;
    setLoading(true);
    (async () => {
      const [l, c, a, p, comp] = await Promise.all([
        db.rpc('company_learner_stats', { p_company: activeCompanyId }),
        db.rpc('company_course_stats', { p_company: activeCompanyId }),
        db.rpc('activity_by_day', { p_company: activeCompanyId, p_days: 14 }),
        db.from('exercise_submissions').select('id, course:courses!inner(company_id)', { count: 'exact', head: true }).eq('status', 'submitted').eq('course.company_id', activeCompanyId),
        db.from('companies').select('name').eq('id', activeCompanyId).single(),
      ]);
      setLearners(l.data || []);
      setCourses(c.data || []);
      setActivity((a.data || []).map((d) => ({ ...d, label: new Date(d.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), minutes: Number(d.minutes) })));
      setPending(p.count || 0);
      setCompanyName(comp.data?.name || '');
      setLoading(false);
    })();
  }, [activeCompanyId]);

  const kpi = useMemo(() => {
    const total = learners.length;
    const active7 = learners.filter((l) => l.last_seen_at && Date.now() - new Date(l.last_seen_at) < 7 * 86400000).length;
    const avgProgress = total ? Math.round(learners.reduce((s, l) => s + Number(l.progress_pct), 0) / total) : 0;
    const scores = learners.map((l) => num(l.avg_quiz_score)).filter((v) => v !== null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const totalSeconds = learners.reduce((s, l) => s + Number(l.total_seconds), 0);
    return { total, active7, avgProgress, avgScore, totalSeconds };
  }, [learners]);

  const top = [...learners].sort((a, b) => Number(b.progress_pct) - Number(a.progress_pct)).slice(0, 5);
  const atRisk = learners
    .filter((l) => l.is_active && (Number(l.progress_pct) < 25 || !l.last_seen_at || Date.now() - new Date(l.last_seen_at) > 7 * 86400000))
    .slice(0, 5);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{companyName}</p>
          <h1 className="page-title mt-1">Bonjour {profile.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Voici l’avancement de vos apprenants.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/formateur/apprenants" className="btn-secondary"><Users className="h-4 w-4" /> Apprenants</Link>
          <Link to="/formateur/cours" className="btn-primary"><GraduationCap className="h-4 w-4" /> Gérer les cours</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Apprenants" value={kpi.total} hint={`${kpi.active7} actifs cette semaine`} />
        <StatCard icon={TrendingUp} label="Progression moyenne" value={`${kpi.avgProgress}%`} tone="green" />
        <StatCard icon={Target} label="Moyenne aux quiz" value={kpi.avgScore !== null ? `${kpi.avgScore}%` : '—'} tone="gold" />
        <StatCard icon={Clock} label="Temps de formation cumulé" value={formatDuration(kpi.totalSeconds)} tone="navy" />
      </div>

      {pending > 0 && (
        <Link to="/formateur/corrections" className="flex items-center gap-4 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 transition hover:bg-brand-100">
          <div className="rounded-xl bg-brand-500 p-2.5 text-white"><ClipboardCheck className="h-5 w-5" /></div>
          <p className="flex-1 text-sm font-semibold text-navy-900">
            {pending} exercice{pending > 1 ? 's' : ''} en attente de correction
          </p>
          <ArrowRight className="h-5 w-5 text-brand-600" />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">Activité des 14 derniers jours</h2>
            <span className="text-xs text-slate-400">minutes de connexion</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2B9FDC" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2B9FDC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(11,29,51,.12)' }}
                  formatter={(v, n) => [n === 'minutes' ? `${v} min` : v, n === 'minutes' ? 'Temps' : 'Apprenants actifs']}
                />
                <Area type="monotone" dataKey="minutes" stroke="#1C82BD" strokeWidth={2.5} fill="url(#gArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-bold text-navy-900">Progression par cours</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun cours.</p>
          ) : (
            <ul className="space-y-5">
              {courses.slice(0, 6).map((c) => (
                <li key={c.course_id}>
                  <Link to={`/formateur/cours/${c.course_id}`} className="block">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-semibold text-navy-800 hover:text-brand-600">{c.title}</span>
                      {!c.is_published && <Badge tone="amber">Brouillon</Badge>}
                    </div>
                    <ProgressBar value={c.avg_progress} size="sm" showLabel />
                    <p className="mt-1 text-xs text-slate-400">{c.enrolled} inscrits · {c.completed} terminés</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-bold text-navy-900">🏆 Meilleures progressions</h2>
          {top.length === 0 ? (
            <EmptyState icon={Users} title="Aucun apprenant" description="Ajoutez vos premiers apprenants." action={<Link className="btn-primary" to="/formateur/apprenants">Ajouter</Link>} />
          ) : (
            <ul className="space-y-4">
              {top.map((l, i) => (
                <li key={l.user_id}>
                  <Link to={`/formateur/apprenants/${l.user_id}`} className="flex items-center gap-3">
                    <span className={`w-5 text-sm font-bold ${i === 0 ? 'text-gold-500' : 'text-slate-400'}`}>{i + 1}</span>
                    <Avatar name={l.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{l.full_name}</p>
                      <ProgressBar value={l.progress_pct} size="xs" className="mt-1" />
                    </div>
                    <span className="w-10 text-right text-sm font-bold text-navy-800">{Number(l.progress_pct)}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-navy-900"><AlertTriangle className="h-5 w-5 text-amber-500" /> À relancer</h2>
          {atRisk.length === 0 ? (
            <p className="text-sm text-slate-500">Tout le monde est sur la bonne voie 👏</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {atRisk.map((l) => (
                <li key={l.user_id}>
                  <Link to={`/formateur/apprenants/${l.user_id}`} className="flex items-center gap-3 py-3">
                    <Avatar name={l.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{l.full_name}</p>
                      <p className="text-xs text-slate-500">Dernière connexion : {timeAgo(l.last_seen_at)}</p>
                    </div>
                    <Badge tone="amber">{Number(l.progress_pct)}%</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
