import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, Users, GraduationCap, Clock, Award, Activity, BookOpen, UserCog, ArrowRight } from 'lucide-react';
import { db } from '../../lib/db';
import { PageLoader, StatCard } from '../../components/ui';
import { timeAgo } from '../../lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    (async () => {
      const [s, a, c, o] = await Promise.all([
        db.rpc('platform_stats'),
        db.rpc('activity_by_day', { p_company: null, p_days: 30 }),
        db.from('companies').select('id, name, is_active').order('created_at', { ascending: false }),
        db.rpc('companies_overview'),
      ]);
      setStats(s.data || {});
      setActivity((a.data || []).map((d) => ({ ...d, label: new Date(d.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), minutes: Number(d.minutes), active_users: Number(d.active_users) })));
      const ov = Object.fromEntries((o.data || []).map((r) => [r.company_id, r]));
      setCompanies((c.data || []).map((x) => ({ ...x, ...ov[x.id] })));
    })();
  }, []);

  if (!stats) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Administration</p>
        <h1 className="page-title mt-1">Vue d’ensemble de la plateforme</h1>
        <p className="page-subtitle">Toutes les entreprises, tous les utilisateurs, toute l’activité.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Building2} label="Entreprises" value={stats.companies} />
        <StatCard icon={Users} label="Apprenants" value={stats.learners} hint={`${stats.active_7d} utilisateurs actifs (7 j)`} tone="green" />
        <StatCard icon={UserCog} label="Formateurs" value={stats.trainers} hint={`${stats.admins} administrateur(s)`} tone="navy" />
        <StatCard icon={GraduationCap} label="Cours" value={stats.courses} hint={`${stats.published} publiés · ${stats.lessons} leçons`} tone="gold" />
        <StatCard icon={BookOpen} label="Inscriptions" value={stats.enrollments} />
        <StatCard icon={Award} label="Formations terminées" value={stats.completions} tone="gold" />
        <StatCard icon={Clock} label="Heures de formation" value={`${stats.hours} h`} tone="navy" />
        <StatCard icon={Activity} label="Taux de complétion" value={stats.enrollments ? `${Math.round((stats.completions / stats.enrollments) * 100)}%` : '—'} tone="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-3">
          <h2 className="mb-4 font-bold text-navy-900">Utilisateurs actifs par jour (30 jours)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF3F8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7898B8' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7898B8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} cursor={{ fill: '#EBF7FD' }} formatter={(v, n) => [n === 'active_users' ? v : `${v} min`, n === 'active_users' ? 'Utilisateurs actifs' : 'Temps']} />
                <Bar dataKey="active_users" fill="#112842" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-navy-900">Entreprises</h2>
            <Link to="/admin/entreprises" className="flex items-center gap-1 text-sm font-semibold text-brand-600">Gérer <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {companies.slice(0, 7).map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-sm font-bold text-navy-700">{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.learners ?? 0} apprenants · {c.courses ?? 0} cours · {c.total_hours ?? 0} h</p>
                </div>
                <span className="text-xs text-slate-400">{timeAgo(c.last_activity)}</span>
              </li>
            ))}
            {companies.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">Aucune entreprise.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
