/* Suivi des profils professionnels — formateur (son entreprise) & administrateur (toutes) */
import { useEffect, useMemo, useState } from 'react';
import { Users, Brain, TrendingUp, Download, Eye, RotateCcw, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { profilStore, profilDone, lastRun, firstRun, useLocalStoreVersion } from '../../lib/stores';
import { PM, DIM, DIM_COLORS, groupStats, runValues, profilType, dimOf } from '../../data/profilModel';
import { RadarChart, BandDistribution, StyleBubbles, AxesChart, TeamHeatmap, ScoreGauge } from '../../components/profil/Charts';
import ProfilReport from '../../components/profil/ProfilReport';
import JoinCodeCard from '../../components/JoinCodeCard';
import ProfilDownload from '../../components/profil/ProfilDownload';
import { Avatar, Badge, EmptyState, Modal, PageLoader, StatCard } from '../../components/ui';
import { downloadCSV, formatDate } from '../../lib/utils';

export default function ProfilsSuivi({ scope = 'trainer' }) {
  const { activeCompanyId } = useAuth();
  useLocalStoreVersion({ refresh: true });
  const [learners, setLearners] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    (async () => {
      let q = db.from('profiles').select('id, full_name, email, job_title, company_id').eq('role', 'learner').order('full_name');
      if (scope === 'trainer') q = q.eq('company_id', activeCompanyId);
      const { data } = await q;
      setLearners(data || []);
      if (scope === 'admin') {
        const { data: cs } = await db.from('companies').select('id, name').order('name');
        setCompanies(cs || []);
      }
    })();
  }, [scope, activeCompanyId]);

  const all = profilStore.all();
  const list = useMemo(
    () => (learners || []).filter((l) => !companyFilter || l.company_id === companyFilter).map((l) => ({ ...l, p: profilStore.get(l.id) })),
    [learners, companyFilter, all] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const withRun = list.filter((l) => profilDone(l.p));
  const runs = withRun.map((l) => lastRun(l.p));
  const stats = groupStats(runs);
  const retests = withRun.filter((l) => l.p.runs.length > 1);
  const firstStats = groupStats(retests.map((l) => firstRun(l.p)));
  const lastStats = groupStats(retests.map((l) => lastRun(l.p)));
  if (!learners) return <PageLoader />;
  if (scope === 'trainer' && !activeCompanyId) return <EmptyState title="Choisissez une entreprise" description="Sélectionnez une entreprise dans le menu de gauche." />;

  const open = openId && list.find((l) => l.id === openId);

  const exportCSV = () => {
    const rows = withRun.map((l) => {
      const r = lastRun(l.p);
      return {
        Nom: l.full_name, Email: l.email || '', Passations: l.p.runs.length, Date: formatDate(r.date), 'Indice global': r.result.global_score,
        ...Object.fromEntries(PM.dimensions.map((d) => [d.title, dimOf(r, d.id).score])),
        'Style dominant': profilType(r).main.nom,
        'Axes de progrès': r.result.priorities.map((x) => DIM[x].short).join(', '),
        'Objectif personnel': r.result.objective?.dim ? DIM[r.result.objective.dim].title : '',
        'Fiabilité': r.result.reliability?.level || '',
        'Observations MCE': l.p.comment || '',
      };
    });
    if (!rows.length) return toast('Aucun profil à exporter.');
    downloadCSV('profils_professionnels.csv', rows);
  };

  return (
    <div className="space-y-8">
      {(scope === 'trainer' || companyFilter) && <JoinCodeCard companyId={scope === 'trainer' ? activeCompanyId : companyFilter} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Profils professionnels</p>
          <h1 className="page-title">Cartographie des compétences du groupe</h1>
          <p className="page-subtitle">Auto-positionnement pédagogique · résultats collectifs sans classement · rapports individuels confidentiels.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {scope === 'admin' && (
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="input w-56">
              <option value="">Toutes les entreprises</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button onClick={exportCSV} className="btn-secondary"><Download className="h-4 w-4" /> Export CSV</button>
        </div>
      </div>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Apprenants" value={list.length} tone="navy" />
        <StatCard icon={Brain} label="Tests terminés" value={`${withRun.length}/${list.length}`} hint={`${list.filter((l) => l.p.draft).length} en cours`} tone="brand" />
        <StatCard icon={ShieldCheck} label="Indice moyen" value={stats.n ? `${stats.global}/100` : '—'} hint="Moyenne du groupe" tone="gold" />
        <StatCard icon={TrendingUp} label="2es passations" value={retests.length} hint="Mesure de progression" tone="green" />
      </div>

      {stats.n > 0 ? (
        <>
          {/* Synthèse : jauge + radar */}
          <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white sm:p-10">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[auto_1fr]">
              <div className="text-center">
                <ScoreGauge value={stats.global} dark label="Indice moyen" />
                <p className="mt-2 text-sm text-navy-200">{stats.n} profil(s) analysé(s)</p>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <RadarChart
                  series={[
                    ...(retests.length ? [{ values: firstStats.avg, label: '1re passation (re-testés)', color: '#94A3B8', dashed: true }] : []),
                    ...(retests.length ? [{ values: lastStats.avg, label: '2e passation (re-testés)', color: '#10B981', dashed: true }] : []),
                    { values: stats.avg, label: 'Moyenne du groupe', color: '#2B9FDC' },
                  ]}
                  size={380}
                />
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="card p-6">
              <h2 className="mb-1 text-lg font-bold text-navy-900">Répartition des niveaux par compétence</h2>
              <p className="mb-5 text-sm text-slate-500">Nombre de participants dans chaque repère MCE</p>
              <BandDistribution stats={stats} />
            </div>
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="mb-1 text-lg font-bold text-navy-900">Styles de fonctionnement dominants</h2>
                <p className="mb-3 text-sm text-slate-500">Taille de la bulle = nombre de participants</p>
                <StyleBubbles types={stats.types} />
              </div>
              <div className="card p-6">
                <h2 className="mb-4 text-lg font-bold text-navy-900">Axes de progrès les plus fréquents</h2>
                {Object.entries(stats.prio).sort((a, b) => b[1] - a[1]).map(([id, n]) => (
                  <div key={id} className="mb-2.5 flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 font-semibold text-navy-800">{DIM[id].short}</span>
                    <div className="h-6 flex-1 rounded-lg bg-slate-100">
                      <div className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-amber-300 to-amber-500 pr-2 text-xs font-bold text-white animate-grow" style={{ width: `${(n / stats.n) * 100}%` }}>{n}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="card p-6">
              <h2 className="mb-1 text-lg font-bold text-navy-900">Manière de fonctionner du groupe</h2>
              <p className="mb-5 text-sm text-slate-500">Position moyenne sur les cinq axes de préférences</p>
              <AxesChart values={stats.axes} />
            </div>
            <div className="card p-6">
              <h2 className="mb-1 text-lg font-bold text-navy-900">Objectifs personnels choisis</h2>
              <p className="mb-5 text-sm text-slate-500">Ce que les apprenants veulent développer en priorité</p>
              {Object.entries(stats.objectives).sort((a, b) => b[1] - a[1]).map(([id, n]) => (
                <div key={id} className="mb-2.5 flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 font-semibold text-navy-800">{DIM[id].short}</span>
                  <div className="h-6 flex-1 rounded-lg bg-slate-100">
                    <div className="flex h-full items-center justify-end rounded-lg pr-2 text-xs font-bold text-white animate-grow" style={{ width: `${(n / stats.n) * 100}%`, background: DIM_COLORS[id] }}>{n}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-1 text-lg font-bold text-navy-900">Carte de chaleur de l’équipe</h2>
            <p className="mb-4 text-sm text-slate-500">Outil de pilotage pédagogique (ordre alphabétique, pas un classement). Cliquez sur une ligne pour ouvrir le rapport.</p>
            <TeamHeatmap rows={withRun.map((l) => ({ id: l.id, name: l.full_name, values: runValues(lastRun(l.p)), global: lastRun(l.p).result.global_score }))} onSelect={setOpenId} />
          </div>
        </>
      ) : (
        <EmptyState icon={Brain} title="Aucun test terminé pour le moment" description="Les synthèses apparaîtront dès qu’un apprenant aura terminé son questionnaire." />
      )}

      {/* Liste */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr><th className="table-th">Apprenant</th><th className="table-th">Indice</th><th className="table-th">Fiabilité</th><th className="table-th">Style dominant</th><th className="table-th" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((l) => {
              const r = lastRun(l.p);
              return (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="table-td"><div className="flex items-center gap-3"><Avatar name={l.full_name} size="sm" /><div><p className="font-semibold">{l.full_name}</p><p className="text-xs text-slate-400">{l.job_title || l.email}</p></div></div></td>
                  <td className="table-td">
                    {r ? <span className="font-display text-lg font-extrabold">{r.result.global_score}<span className="text-xs text-slate-400">/100</span></span> : l.p.draft ? <Badge tone="amber">En cours</Badge> : <Badge>À faire</Badge>}
                    {l.p.runs.length > 1 && <Badge tone="brand" className="ml-2">×{l.p.runs.length}</Badge>}
                  </td>
                  <td className="table-td">{r?.result.reliability ? <Badge tone={{ Bonne: 'green', Correcte: 'amber', 'À confirmer': 'red' }[r.result.reliability.level]}>{r.result.reliability.level}</Badge> : '—'}</td>
                  <td className="table-td text-sm">{r ? `${profilType(r).main.emoji} ${profilType(r).main.nom}` : '—'}</td>
                  <td className="table-td text-right">
                    <button onClick={() => setOpenId(l.id)} disabled={!r} className="btn-secondary btn-sm"><Eye className="h-3.5 w-3.5" /> Rapport</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <p className="p-8 text-center text-sm text-slate-500">Aucun apprenant.</p>}
      </div>

      <Modal open={Boolean(open)} onClose={() => setOpenId(null)} size="xl" title={open?.full_name} description="Rapport de profil professionnel">
        {open && <ProfilDetail learner={open} />}
      </Modal>
    </div>
  );
}

function ProfilDetail({ learner }) {
  const [comment, setComment] = useState(learner.p.comment || '');
  const done = profilDone(learner.p);
  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-5">
        <p className="font-bold text-navy-900">✍️ Observations de la formatrice (ajoutées au rapport de l’apprenant)</p>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input" placeholder="Observations en formation, progrès constatés, engagements…" />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { profilStore.setComment(learner.id, comment); toast.success('Observations enregistrées'); }} className="btn-primary btn-sm">Enregistrer</button>
          {done && (
            <button onClick={() => { profilStore.allowRetake(learner.id); toast.success('Nouvelle passation ouverte'); }} disabled={learner.p.retake} className="btn-secondary btn-sm">
              <RotateCcw className="h-3.5 w-3.5" /> {learner.p.retake ? 'Nouvelle passation ouverte ✔' : 'Ouvrir une nouvelle passation'}
            </button>
          )}
          <ProfilDownload profil={{ ...learner.p, comment }} name={learner.full_name} />
          <button onClick={() => { if (confirm('Effacer toutes les réponses de profil de cet apprenant ?')) { profilStore.reset(learner.id); toast.success('Profil réinitialisé'); } }} className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Réinitialiser
          </button>
        </div>
      </div>
      <ProfilReport profil={learner.p} name={learner.full_name} />
    </div>
  );
}
