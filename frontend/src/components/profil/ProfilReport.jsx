/* Rapport de profil professionnel — identique pour l'apprenant, le formateur et l'administrateur */
import { Sparkles, ShieldAlert, Compass, Target, Lightbulb, CalendarCheck, MessageSquareQuote, TrendingUp, Handshake, ShieldCheck, Quote, Flag } from 'lucide-react';
import { PM, DIM, DIM_COLORS, CONTEXT, profilType, narrative, gaps, runValues, bandOf, portrait, workWithTips, dimOf } from '../../data/profilModel';
import { ScoreGauge, RadarChart, DimensionBars, DumbbellChart, AxesChart } from './Charts';
import { formatDateTime } from '../../lib/utils';

function Section({ icon: Icon, title, subtitle, children, className = '' }) {
  return (
    <section className={`card p-6 sm:p-8 ${className}`}>
      <div className="mb-5 flex items-start gap-3">
        {Icon && <span className="rounded-xl bg-brand-50 p-2.5 text-brand-600"><Icon className="h-5 w-5" /></span>}
        <div>
          <h2 className="text-xl font-bold text-navy-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const RELIA_TONE = { Bonne: 'bg-emerald-400/20 text-emerald-200', Correcte: 'bg-amber-300/20 text-amber-100', 'À confirmer': 'bg-red-400/20 text-red-200' };

export default function ProfilReport({ profil, name }) {
  const runs = profil?.runs || [];
  const run = runs[runs.length - 1];
  const prev = runs.length > 1 ? runs[runs.length - 2] : null;
  if (!run) return null;

  const r = run.result;
  const ty = profilType(run);
  const gp = gaps(run);
  const first = (name || '').split(' ')[0] || 'cette personne';
  const ctx = r.context || {};
  const obj = r.objective?.dim ? DIM[r.objective.dim] : null;
  const deltaGlobal = prev ? r.global_score - prev.result.global_score : null;
  const chips = [
    ctx.CTX_TEAM !== undefined && `👥 ${CONTEXT[0].options[ctx.CTX_TEAM]}`,
    ctx.CTX_SENIORITY !== undefined && `⏳ ${CONTEXT[1].options[ctx.CTX_SENIORITY]} dans le poste`,
    ctx.CTX_CONTACT !== undefined && `🤝 Contact client : ${CONTEXT[2].options[ctx.CTX_CONTACT].toLowerCase()}`,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* ======= EN-TÊTE ======= */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full blur-3xl" style={{ background: `${DIM_COLORS[ty.mainId]}40` }} />
        <div className="relative grid items-center gap-8 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center"><ScoreGauge value={r.global_score} dark label="Indice pédagogique" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Profil de fonctionnement professionnel</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-navy-200">
              <span>{formatDateTime(run.date)} · {run.minutes} min{run.timed_out ? ' · temps écoulé' : ''}{runs.length > 1 ? ` · passation n°${runs.length}` : ''}</span>
              {r.reliability && <span className={`rounded-full px-2 py-0.5 font-bold ${RELIA_TONE[r.reliability.level]}`}>Fiabilité des réponses : {r.reliability.level}</span>}
              {deltaGlobal !== null && (
                <span className={`rounded-full px-2 py-0.5 font-bold ${deltaGlobal >= 0 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'}`}>
                  {deltaGlobal >= 0 ? '▲ +' : '▼ '}{deltaGlobal} depuis la passation précédente
                </span>
              )}
            </div>
            {chips.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{chips.map((c) => <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">{c}</span>)}</div>}
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <span className="mce-float flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-lift" style={{ background: DIM_COLORS[ty.mainId] }}>{ty.main.emoji}</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-200">Style de fonctionnement dominant</p>
                <p className="text-2xl font-extrabold">{ty.main.nom} <span className="text-base font-semibold text-navy-200">· tendance {ty.second.nom} {ty.second.emoji}</span></p>
                <p className="text-sm text-navy-100">{ty.main.court}.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= PORTRAIT ======= */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <Quote className="absolute right-6 top-6 h-16 w-16 text-brand-50" />
        <p className="eyebrow">Portrait professionnel</p>
        <p className="relative mt-3 text-[17px] leading-relaxed text-navy-800">{portrait(run, name)}</p>
        {r.objective?.text && (
          <div className="mt-5 rounded-2xl bg-gold-100/50 p-4 text-sm ring-1 ring-gold-300">
            <p className="flex items-center gap-2 font-bold text-navy-900"><Flag className="h-4 w-4 text-gold-600" /> Ce que {first} attend de la formation</p>
            <p className="mt-1 italic text-navy-700">« {r.objective.text} »</p>
          </div>
        )}
      </section>

      {/* ======= RADAR + CARTE D'IDENTITÉ ======= */}
      <div className="grid gap-6 xl:grid-cols-5">
        <Section icon={Compass} title="Carte des 10 compétences" subtitle="Survolez une compétence pour la détailler" className="xl:col-span-3">
          <RadarChart
            series={[
              ...(prev ? [{ values: runValues(prev), label: 'Passation précédente', color: '#94A3B8', dashed: true }] : []),
              { values: runValues(run), label: prev ? 'Aujourd’hui' : 'Profil', color: '#2B9FDC' },
            ]}
          />
        </Section>
        <div className="space-y-4 xl:col-span-2">
          {[
            { icon: Sparkles, t: 'Ce que ce profil apporte', b: ty.main.apport, c: '#10B981' },
            { icon: ShieldAlert, t: 'Point de vigilance', b: ty.main.vigilance, c: '#F59E0B' },
            { icon: Target, t: 'Environnements favorables', b: `Dans ${ty.main.env}`, c: '#6366F1' },
          ].map((x, i) => (
            <div key={x.t} className="card relative overflow-hidden p-5 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: x.c }} />
              <p className="flex items-center gap-2 font-bold text-navy-900"><x.icon className="h-4 w-4" style={{ color: x.c }} />{x.t}</p>
              <p className="mt-1.5 text-sm text-slate-600">{x.b}</p>
            </div>
          ))}
          {obj && (
            <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lift" style={{ background: `linear-gradient(135deg, ${DIM_COLORS[obj.id]}, #0B1D33)` }}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Objectif personnel choisi</p>
              <p className="mt-1 text-lg font-bold">{obj.title}</p>
              <p className="text-sm text-white/80">Niveau actuel : {dimOf(run, obj.id).score}/100 · {bandOf(dimOf(run, obj.id).score).label}</p>
            </div>
          )}
        </div>
      </div>

      {/* ======= DÉTAIL ======= */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Section icon={TrendingUp} title="Les dix compétences en détail" subtitle="Score = 70 % auto-positionnement + 30 % mise en situation">
          <DimensionBars dimensions={r.dimensions} previous={prev?.result.dimensions} />
        </Section>
        <Section icon={Lightbulb} title="Ce que je déclare / ce que je choisis" subtitle="Un grand écart signale un point à tester en exercice">
          <DumbbellChart dimensions={r.dimensions} />
          {gp.length > 0 && (
            <div className="mt-5 space-y-2">
              {gp.map((g) => <div key={g.title} className="rounded-xl border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-navy-800"><b>{g.title}</b> — {g.text}</div>)}
            </div>
          )}
        </Section>
      </div>

      {/* ======= FONCTIONNEMENT ======= */}
      {r.axes && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Section icon={Compass} title="Manière de fonctionner" subtitle="Cinq axes de préférences de travail">
            <AxesChart values={r.axes} compare={prev?.result.axes} compareLabel="passation précédente" />
          </Section>
          <Section icon={Handshake} title={`Comment bien travailler avec ${first}`} subtitle="Repères pour la formatrice, le manager… et pour soi-même">
            <ul className="space-y-3">
              {workWithTips(run).map((t, i) => (
                <li key={t} className="flex gap-3 text-sm text-navy-800 animate-fade-in" style={{ animationDelay: `${i * 70}ms` }}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}

      {/* ======= LECTURE PERSONNALISÉE ======= */}
      <Section icon={MessageSquareQuote} title="Lecture personnalisée" subtitle="Hypothèses d’accompagnement construites à partir des réponses, pas des conclusions psychologiques">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {narrative(run).map((n, i) => (
            <div key={n.t} className="rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/60 p-5 ring-1 ring-slate-100 animate-fade-in" style={{ animationDelay: `${i * 70}ms` }}>
              <p className="font-bold text-navy-900">{n.t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{n.b}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
            <p className="mb-3 font-bold text-emerald-800">💪 Trois appuis</p>
            {r.strengths.map((id, i) => (
              <div key={id} className="mb-3 flex gap-3 last:mb-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ background: DIM_COLORS[id] }}>{i + 1}</span>
                <p className="text-sm"><b className="text-navy-900">{DIM[id].title}</b> · {dimOf(run, id).score}/100<br /><span className="text-slate-600">{DIM[id].high}</span></p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">
            <p className="mb-3 font-bold text-amber-800">🎯 Deux axes de progrès</p>
            {r.priorities.map((id) => {
              const d = dimOf(run, id);
              return (
                <div key={id} className="mb-3 flex gap-3 last:mb-0">
                  <span className="flex h-7 shrink-0 items-center rounded-full px-2 text-xs font-extrabold text-white" style={{ background: bandOf(d.score).color }}>{d.score}</span>
                  <p className="text-sm"><b className="text-navy-900">{d.title}</b><br /><span className="text-slate-600">{d.summary}</span></p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ======= PLAN + FIABILITÉ ======= */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Section icon={CalendarCheck} title="Plan d’action sur 30 jours" subtitle="Trois gestes concrets à tester au travail">
          <ol className="relative space-y-5 border-l-2 border-dashed border-brand-200 pl-7">
            {[
              ...[...new Set([...(obj && !r.priorities.includes(obj.id) ? [obj.id] : []), ...r.priorities])].slice(0, 2).map((id) => ({ t: DIM[id].action30, c: DIM_COLORS[id], label: DIM[id].short })),
              { t: 'Demander un retour concret à un collègue ou à son responsable sur une pratique travaillée.', c: '#0B1D33', label: 'Feedback' },
            ].map((a, i) => (
              <li key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 120}ms` }}>
                <span className="absolute -left-[42px] flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold text-white ring-4 ring-white" style={{ background: a.c }}>{i + 1}</span>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: a.c }}>{['J+7', 'J+14', 'J+30'][i]} · {a.label}</p>
                <p className="mt-0.5 text-sm text-navy-800">{a.t}</p>
              </li>
            ))}
          </ol>
        </Section>
        {r.reliability && (
          <Section icon={ShieldCheck} title="Fiabilité des réponses" subtitle="Repères de lecture, pas un jugement sur la personne">
            <div className="flex items-center gap-5">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#2B9FDC ${r.reliability.coherence * 3.6}deg, #EEF3F8 0)` }}>
                <span className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-display text-2xl font-extrabold text-navy-900">{r.reliability.coherence}</span>
                  <span className="text-[10px] font-semibold text-slate-400">cohérence</span>
                </span>
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-bold text-navy-900">Niveau : {r.reliability.level}</p>
                <p className="mt-1">L’indice de cohérence compare ce qui est déclaré et ce qui est choisi dans les mises en situation.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {r.reliability.notes.length ? r.reliability.notes.map((n) => <p key={n} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">⚠️ {n}</p>) : <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">✔ Réponses nuancées et cohérentes : le profil peut être lu avec confiance.</p>}
            </div>
          </Section>
        )}
      </div>

      {profil.comment && (
        <section className="card border-l-4 border-gold-400 bg-gold-100/40 p-6">
          <p className="font-bold text-navy-900">✍️ Observations de la formatrice MCE</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-navy-800">{profil.comment}</p>
        </section>
      )}

      <p className="px-2 text-xs text-slate-400">{PM.notice} Les réponses et scores ne doivent pas être utilisés seuls pour une décision d’emploi.</p>
    </div>
  );
}
