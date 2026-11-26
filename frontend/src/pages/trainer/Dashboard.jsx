import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, GraduationCap, Clock, Target, ClipboardCheck, AlertTriangle, ArrowRight, TrendingUp, Megaphone, Building2, UserCircle, Layers, Trophy, CalendarDays, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { Avatar, Badge, EmptyState, PageLoader, ProgressBar } from '../../components/ui';
import { formatDuration, timeAgo, num } from '../../lib/utils';

function DashboardStat({icon: Icon, label, value, hint, tone}) {
  return <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-6 w-6"/></div>
    <div className="min-w-0"><p className="text-xs font-semibold leading-snug text-navy-700">{label}</p><p className="mt-1 text-2xl font-bold leading-tight text-navy-900 tabular-nums">{value}</p><p className="mt-1 text-xs leading-snug text-slate-500">{hint}</p></div>
  </div>;
}

export default function TrainerDashboard() {
  const { activeCompanyId, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [learners, setLearners] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [pending, setPending] = useState(0);
  const [companyName, setCompanyName] = useState('');

  const [error, setError] = useState(null);
  useEffect(() => {
    if (!activeCompanyId) { setLoading(false); return; }
    let alive = true;
    setError(null);
    setLoading(true);
    (async () => {
      const [l, c, a, p, comp] = await Promise.all([
        db.rpc('company_learner_stats', { p_company: activeCompanyId }),
        db.rpc('company_course_stats', { p_company: activeCompanyId }),
        db.rpc('activity_by_day', { p_company: activeCompanyId, p_days: 14 }),
        db.from('exercise_submissions').select('id, course:courses!inner(company_id)', { count: 'exact', head: true }).eq('status', 'submitted').eq('course.company_id', activeCompanyId),
        db.from('companies').select('name').eq('id', activeCompanyId).single(),
      ]);
      if (!alive) return;
      if ([l,c,a,p,comp].some(r => r.error)) setError("Certaines données n’ont pas pu être chargées.");
      setLearners(l.data || []);
      setCourses(c.data || []);
      setActivity((a.data || []).map((d) => ({ ...d, label: new Date(d.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), minutes: Number(d.minutes) })));
      setPending(p.count || 0);
      setCompanyName(comp.data?.name || '');
      setLoading(false);
    })().catch(() => { if (alive) { setError("Impossible de charger les données."); setLoading(false); } });
    return () => { alive = false; };
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

  if (!activeCompanyId) return <EmptyState icon={Building2} title="Choisissez une entreprise" description="Sélectionnez une entreprise dans le menu latéral." />;
  return (
    <div className="space-y-5">
      <header className="relative isolate overflow-hidden rounded-2xl bg-navy-900 text-white shadow-card">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-800 to-brand-700" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] bg-cover bg-right md:block" style={{backgroundImage: 'linear-gradient(90deg, #112842 0%, rgba(17,40,66,.35) 45%, transparent 100%), url(/dashboard-hero.webp)'}} />
        <div className="px-5 py-7 sm:px-7 sm:py-8">
          <div className="max-w-xl border-l-4 border-brand-400 pl-4">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-200">{companyName || 'MCE Academy'}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Bonjour {profile?.full_name?.split(' ')[0] || 'Formateur'} 👋</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-100">Voici l’avancement de vos apprenants. Pilotez vos formations et accompagnez chaque progression.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 pl-5">
            <Link to="/formateur/apprenants" className="btn border border-white/30 bg-navy-900/70 text-white hover:bg-navy-700"><Users className="h-4 w-4"/> Apprenants</Link>
            <Link to="/formateur/cours" className="btn-brand"><GraduationCap className="h-4 w-4"/> Gérer les cours</Link>
          </div>
        </div>
      </header>
      <nav aria-label="Raccourcis du tableau de bord" className="flex flex-wrap gap-2">
        {[['/formateur/profils','Profils professionnels',UserCircle],['/formateur/annonces','Annonces',Megaphone],['/formateur/entreprise','Mon entreprise',Building2]].map(([to,label,Icon])=><Link key={to} to={to} className="btn-secondary rounded-full shadow-sm hover:text-brand-700"><Icon className="h-5 w-5 text-brand-600"/>{label}</Link>)}
      </nav>
      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error} Les indicateurs peuvent être incomplets.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat icon={Users} label="Apprenants" value={kpi.total} hint={`${kpi.active7} actifs cette semaine`} tone="bg-brand-100 text-brand-700"/>
        <DashboardStat icon={TrendingUp} label="Progression moyenne" value={`${kpi.avgProgress}%`} hint="Ensemble des apprenants" tone="bg-emerald-100 text-emerald-700"/>
        <DashboardStat icon={Target} label="Moyenne aux quiz" value={kpi.avgScore !== null ? `${kpi.avgScore}%` : '—'} hint={kpi.avgScore === null ? 'Pas encore de résultat' : 'Résultats disponibles'} tone="bg-violet-100 text-violet-700"/>
        <DashboardStat icon={Clock} label="Temps de formation cumulé" value={formatDuration(kpi.totalSeconds)} hint="Temps de connexion cumulé" tone="bg-amber-100 text-amber-700"/>
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

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card min-w-0 border border-slate-200 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-navy-900"><TrendingUp className="h-5 w-5 shrink-0 text-brand-600"/> Activité des 14 derniers jours</h2>
            <span className="text-xs text-slate-400">minutes de connexion</span>
          </div>
          <div className="h-56">
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
                <Area type="monotone" dataKey="minutes" stroke="#1C82BD" strokeWidth={3} fill="url(#gArea)" dot={{r:3,fill:"#2B9FDC",strokeWidth:0}} activeDot={{r:5}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card min-w-0 border border-slate-200 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-navy-900"><Layers className="h-5 w-5 text-brand-600"/> Progression par cours</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun cours.</p>
          ) : (
            <ul className="space-y-5">
              {courses.slice(0, 6).map((c) => (
                <li key={c.course_id}>
                  <Link to={`/formateur/cours/${c.course_id}`} className="block">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <span className="break-words text-sm font-semibold text-navy-800 hover:text-brand-600">{c.title}</span>
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

      <section className="card border border-slate-200 p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-bold text-navy-900"><CalendarDays className="h-5 w-5 text-brand-600"/> Pilotage pédagogique</h2><Link to="/formateur/activites" className="text-xs font-semibold text-brand-700">Voir les activités →</Link></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/formateur/programme" className="flex items-center gap-3 rounded-xl bg-brand-50 p-3 text-sm font-semibold text-navy-800 hover:bg-brand-100"><CalendarDays className="h-5 w-5 shrink-0 text-brand-700"/> Programme & déblocage <ArrowRight className="ml-auto h-4 w-4 shrink-0"/></Link>
          <Link to="/formateur/exercices" className="flex items-center gap-3 rounded-xl bg-violet-50 p-3 text-sm font-semibold text-navy-800 hover:bg-violet-100"><BookOpen className="h-5 w-5 shrink-0 text-violet-700"/> Quiz & exercices <ArrowRight className="ml-auto h-4 w-4 shrink-0"/></Link>
          <Link to="/formateur/corrections" className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-navy-800 hover:bg-amber-100"><ClipboardCheck className="h-5 w-5 shrink-0 text-amber-700"/> {pending} à corriger <ArrowRight className="ml-auto h-4 w-4 shrink-0"/></Link>
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card min-w-0 border border-slate-200 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-bold text-navy-900"><Trophy className="h-5 w-5 text-gold-500"/> Meilleures progressions</h2><Link to="/formateur/apprenants" className="text-xs font-semibold text-brand-700">Voir tout →</Link></div>
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

        <div className="card min-w-0 border border-slate-200 p-5">
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
