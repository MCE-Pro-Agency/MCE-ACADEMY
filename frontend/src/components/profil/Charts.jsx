/* =====================================================================
   Diagrammes du profil professionnel — SVG sur mesure, animés
   ===================================================================== */
import { useEffect, useId, useMemo, useState } from 'react';
import { PM, DIM_COLORS, DIM, bandOf, ARCH, AXES } from '../../data/profilModel';
import { cn } from '../../lib/utils';

/* Nombre qui défile de 0 à la valeur */
export function useCountUp(target, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const arcPath = (cx, cy, r, start, end) => {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};

/* ---------------------------------------------------------------------
   1. JAUGE DE SCORE GLOBAL — arc 270°, dégradé, halo, chiffre animé
   --------------------------------------------------------------------- */
export function ScoreGauge({ value, size = 230, label = 'Indice global', dark = false }) {
  const id = useId().replace(/:/g, '');
  const shown = useCountUp(value);
  const cx = size / 2;
  const r = size / 2 - 18;
  const START = -135;
  const END = 135;
  const len = (Math.PI * 2 * r * 270) / 360;
  const band = bandOf(value);
  const [mx, my] = polar(cx, cx, r, START + (270 * shown) / 100);
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      {/* Halo arc-en-ciel qui tourne lentement derrière la jauge */}
      {dark && <div className="mce-spin-slow pointer-events-none absolute left-1/2 top-[44%] h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-2xl"
        style={{ background: 'conic-gradient(from 0deg, #EF4444, #F59E0B, #2B9FDC, #10B981, #8B5CF6, #EF4444)' }} />}
      <svg width={size} height={size * 0.86} viewBox={`0 0 ${size} ${size * 0.86}`} className="overflow-visible">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="65%" stopColor="#2B9FDC" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id={`glow${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* graduations */}
        {Array.from({ length: 28 }).map((_, i) => {
          const deg = START + (270 / 27) * i;
          const [x1, y1] = polar(cx, cx, r - 16, deg);
          const [x2, y2] = polar(cx, cx, r - (i % 3 === 0 ? 26 : 21), deg);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={dark ? 'rgba(255,255,255,.25)' : '#CBD5E1'} strokeWidth={i % 3 === 0 ? 2 : 1} strokeLinecap="round" />;
        })}
        <path d={arcPath(cx, cx, r, START, END)} stroke={dark ? 'rgba(255,255,255,.12)' : '#EEF3F8'} strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d={arcPath(cx, cx, r, START, END)} stroke={`url(#g${id})`} strokeWidth="30" fill="none" strokeLinecap="round" opacity="0.28"
          strokeDasharray={len} strokeDashoffset={len - (len * shown) / 100} style={{ filter: 'blur(10px)' }} />
        <path
          d={arcPath(cx, cx, r, START, END)}
          stroke={`url(#g${id})`}
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len - (len * shown) / 100}
          filter={`url(#glow${id})`}
        />
        <circle cx={mx} cy={my} r="11" fill="none" stroke={band.color} strokeWidth="3" className="mce-pulse-ring" style={{ transformBox: 'fill-box' }} />
        <circle cx={mx} cy={my} r="11" fill="white" stroke={band.color} strokeWidth="4" className="drop-shadow" />
      </svg>
      <div className="absolute inset-x-0 top-[28%] flex flex-col items-center">
        <span className={cn('font-display text-6xl font-extrabold leading-none', dark ? 'text-white drop-shadow-[0_0_18px_rgba(255,255,255,.35)]' : 'text-navy-900')}>
          {shown}
          <span className={cn('text-xl font-bold', dark ? 'text-navy-200' : 'text-slate-400')}>/100</span>
        </span>
        <span className="mt-2 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: band.color, boxShadow: `0 0 0 3px ${band.color}33, 0 8px 22px ${band.color}88` }}>{band.label}</span>
        <span className={cn('mt-2 text-[10px] font-bold uppercase tracking-[0.18em]', dark ? 'text-brand-200' : 'text-slate-400')}>{label}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   2. RADAR DES 8 DIMENSIONS — anneaux de niveaux, dégradé, halo, survol
   series : [{ values:{dim:score}, label, color, dashed }]
   --------------------------------------------------------------------- */
export function RadarChart({ series, size = 420, interactive = true }) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  const dims = PM.dimensions;
  const n = dims.length;
  const pad = 78;
  const W = size + pad * 2;
  const c = W / 2;
  const R = size / 2 - 10;
  const pt = (i, v) => polar(c, c, (R * v) / 100, (360 / n) * i);
  const poly = (vals) => dims.map((d, i) => pt(i, vals[d.id] || 0).join(',')).join(' ');
  const main = series[series.length - 1];

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${W}`} className="mx-auto w-full max-w-[520px] overflow-visible">
        <defs>
          <radialGradient id={`rg${id}`}>
            <stop offset="0%" stopColor="#2B9FDC" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id={`bg${id}`}>
            <stop offset="0%" stopColor="#EBF7FD" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <filter id={`gl${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={c} cy={c} r={R + 30} fill={`url(#bg${id})`} />
        {/* zones de niveaux (couleurs des repères MCE) */}
        {[...PM.bands].reverse().map((b, i, arr) => {
          const outer = i === arr.length - 1 ? 100 : arr[i + 1].min;
          return <polygon key={b.label} points={poly(Object.fromEntries(dims.map((d) => [d.id, outer])))} fill={b.color} fillOpacity={0.035 + i * 0.012} stroke="none" />;
        })}
        {[20, 40, 60, 80, 100].map((v) => (
          <polygon key={v} points={poly(Object.fromEntries(dims.map((d) => [d.id, v])))} fill="none" stroke="#D5E0EC" strokeWidth={v === 100 ? 1.5 : 1} strokeDasharray={v === 100 ? '' : '3 4'} />
        ))}
        {[40, 60, 80].map((v) => {
          const [x, y] = pt(0, v);
          return <text key={v} x={x + 4} y={y - 3} fontSize="10" fill="#94A3B8" fontWeight="600">{v}</text>;
        })}
        {dims.map((d, i) => {
          const [x, y] = pt(i, 100);
          return <line key={d.id} x1={c} y1={c} x2={x} y2={y} stroke="#D5E0EC" />;
        })}

        {/* séries */}
        {series.map((s, si) => {
          const isMain = si === series.length - 1;
          return (
            <g key={si} className="mce-radar-in" style={{ transformOrigin: `${c}px ${c}px`, animationDelay: `${si * 180}ms` }}>
              <polygon
                points={poly(s.values)}
                fill={s.dashed ? 'none' : isMain ? `url(#rg${id})` : s.color}
                fillOpacity={s.dashed ? 0 : isMain ? 1 : 0.12}
                stroke={s.color || '#2B9FDC'}
                strokeWidth={isMain ? 3 : 2}
                strokeDasharray={s.dashed ? '6 5' : ''}
                strokeLinejoin="round"
                filter={isMain ? `url(#gl${id})` : undefined}
              />
            </g>
          );
        })}

        {/* points + étiquettes */}
        {dims.map((d, i) => {
          const v = main.values[d.id] || 0;
          const [x, y] = pt(i, v);
          const [lx, ly] = polar(c, c, R + 34, (360 / n) * i);
          const anchor = Math.abs(lx - c) < 10 ? 'middle' : lx < c ? 'end' : 'start';
          const active = hover === d.id;
          return (
            <g
              key={d.id}
              onMouseEnter={() => interactive && setHover(d.id)}
              onMouseLeave={() => interactive && setHover(null)}
              className="cursor-pointer"
            >
              <circle cx={x} cy={y} r={active ? 13 : 0} fill={DIM_COLORS[d.id]} fillOpacity="0.2" style={{ transition: 'r .2s' }} />
              <circle cx={x} cy={y} r={active ? 7 : 5.5} fill="white" stroke={DIM_COLORS[d.id]} strokeWidth="3" className="mce-pop" style={{ animationDelay: `${400 + i * 70}ms` }} />
              <text x={lx} y={ly - 7} textAnchor={anchor} fontSize="13" fontWeight="700" fill={active ? DIM_COLORS[d.id] : '#112842'} fontFamily="Plus Jakarta Sans, sans-serif">
                {d.short}
              </text>
              <text x={lx} y={ly + 11} textAnchor={anchor} fontSize="12" fontWeight="800" fill={DIM_COLORS[d.id]}>
                {v}
                <tspan fontSize="10" fill="#94A3B8" fontWeight="600">/100</tspan>
              </text>
              {/* zone de survol élargie */}
              <circle cx={lx} cy={ly} r="34" fill="transparent" />
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute left-1/2 top-2 w-64 -translate-x-1/2 rounded-xl bg-navy-900/95 p-3 text-xs text-white shadow-lift backdrop-blur animate-fade-in">
          <p className="font-bold" style={{ color: DIM_COLORS[hover] }}>{DIM[hover].title}</p>
          <p className="mt-1 text-navy-200">{DIM[hover].definition}</p>
          <div className="mt-2 space-y-0.5">
            {series.map((s, i) => (
              <p key={i} className="flex justify-between"><span className="text-navy-300">{s.label}</span><b>{s.values[hover] ?? '—'}/100</b></p>
            ))}
          </div>
        </div>
      )}
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-500">
          {series.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-6 rounded" style={{ background: s.color, borderTop: s.dashed ? `2px dashed ${s.color}` : '' }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   3. BARRES PAR DIMENSION — dégradé de couleur + repères auto / situation
   --------------------------------------------------------------------- */
export function DimensionBars({ dimensions, previous }) {
  return (
    <div className="space-y-4">
      {dimensions.map((d, i) => {
        const col = DIM_COLORS[d.id];
        const band = bandOf(d.score);
        const prev = previous?.find((p) => p.id === d.id);
        const delta = prev ? d.score - prev.score : null;
        return (
          <div key={d.id} className="group animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold text-navy-900">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-4" style={{ background: col, '--tw-ring-color': `${col}22` }} />
                <span className="min-w-0">{d.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {delta !== null && delta !== 0 && (
                  <span className={cn('rounded-full px-1.5 text-[11px] font-bold', delta > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
                    {delta > 0 ? '▲ +' : '▼ '}{delta}
                  </span>
                )}
                <span className="hidden whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline" style={{ background: `${band.color}18`, color: band.color }}>{band.label}</span>
                <span className="w-10 text-right font-display text-lg font-extrabold text-navy-900">{d.score}</span>
              </span>
            </div>
            <div className="relative h-3.5 rounded-full bg-slate-100">
              {[40, 60, 80].map((m) => <span key={m} className="absolute top-0 h-full w-px bg-white" style={{ left: `${m}%` }} />)}
              {prev && <span className="absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-slate-400/70" style={{ left: `${prev.score}%` }} title="1re passation" />}
              <div className="h-full rounded-full animate-grow" style={{ width: `${d.score}%`, background: `linear-gradient(90deg, ${col}88, ${col})`, boxShadow: `0 0 14px ${col}66` }} />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-400">
              <span>Auto-positionnement <b className="text-slate-600">{d.auto_score}</b></span>
              <span>Mise en situation <b className="text-slate-600">{d.situation_score}</b></span>
              <span className="ml-auto font-bold uppercase tracking-wide sm:hidden" style={{ color: band.color }}>{band.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------
   4. HALTÈRES « CE QUE JE DÉCLARE / CE QUE JE CHOISIS »
   --------------------------------------------------------------------- */
export function DumbbellChart({ dimensions }) {
  const W = 620;
  const rowH = 38;
  const left = 150;
  const right = 30;
  const H = dimensions.length * rowH + 40;
  const x = (v) => left + ((W - left - right) * v) / 100;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={x(v)} y1="8" x2={x(v)} y2={H - 26} stroke="#E2E8F0" strokeDasharray="3 4" />
            <text x={x(v)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94A3B8">{v}</text>
          </g>
        ))}
        {dimensions.map((d, i) => {
          const y = 22 + i * rowH;
          const a = x(d.auto_score);
          const s = x(d.situation_score);
          const gap = Math.abs(d.auto_score - d.situation_score) >= 40;
          return (
            <g key={d.id} className="animate-fade-in" style={{ animationDelay: `${i * 70}ms` }}>
              <text x={left - 14} y={y + 4} textAnchor="end" fontSize="12.5" fontWeight="700" fill="#112842">{DIM[d.id].short}</text>
              <line x1={Math.min(a, s)} y1={y} x2={Math.max(a, s)} y2={y} stroke={gap ? '#F59E0B' : DIM_COLORS[d.id]} strokeWidth="5" strokeOpacity={gap ? 0.8 : 0.35} strokeLinecap="round" />
              <circle cx={a} cy={y} r="8" fill="white" stroke={DIM_COLORS[d.id]} strokeWidth="3.5" />
              <rect x={s - 7.5} y={y - 7.5} width="15" height="15" rx="3.5" fill={DIM_COLORS[d.id]} transform={`rotate(45 ${s} ${y})`} />
              {gap && <text x={Math.max(a, s) + 14} y={y + 4} fontSize="11" fontWeight="800" fill="#D97706">écart</text>}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-5 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-[3px] border-brand-500 bg-white" /> Ce que je déclare (auto-positionnement)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-brand-500" /> Ce que je choisis (mise en situation)</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   6. RÉPARTITION DES NIVEAUX (groupe) — barres empilées
   --------------------------------------------------------------------- */
export function BandDistribution({ stats }) {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
        {PM.bands.map((b) => (
          <span key={b.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded" style={{ background: b.color }} />{b.label}</span>
        ))}
      </div>
      {PM.dimensions.map((d, i) => (
        <div key={d.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-semibold text-navy-800">{d.title}</span>
            <span className="font-display font-extrabold" style={{ color: DIM_COLORS[d.id] }}>{stats.avg[d.id]}</span>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
            {[...stats.bands[d.id]].reverse().map((count, k) => {
              const b = PM.bands[PM.bands.length - 1 - k];
              return count ? (
                <div key={b.label} className="h-full animate-grow" title={`${b.label} : ${count}`} style={{ width: `${(count / stats.n) * 100}%`, background: b.color }} />
              ) : null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------
   7. CARTE DE CHALEUR ÉQUIPE — participants × dimensions
   --------------------------------------------------------------------- */
const heat = (v) => {
  if (v >= 80) return ['#10B981', 'white'];
  if (v >= 70) return ['#34D399', 'white'];
  if (v >= 60) return ['#2B9FDC', 'white'];
  if (v >= 50) return ['#7BC8F0', '#0B1D33'];
  if (v >= 40) return ['#FBBF24', '#0B1D33'];
  return ['#F87171', 'white'];
};
export function TeamHeatmap({ rows, onSelect }) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className="min-w-[160px]" />
            {PM.dimensions.map((d) => (
              <th key={d.id} className="px-1 pb-2 text-center align-bottom">
                <span className="mx-auto mb-1 block h-1.5 w-8 rounded-full" style={{ background: DIM_COLORS[d.id] }} />
                <span className="block text-[11px] font-bold leading-tight text-navy-700">{d.short}</span>
              </th>
            ))}
            <th className="px-2 pb-2 text-[11px] font-bold text-navy-700">Indice</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onSelect?.(r.id)} className="group cursor-pointer">
              <td className="truncate rounded-lg px-2 py-1.5 text-sm font-semibold text-navy-800 group-hover:bg-brand-50">{r.name}</td>
              {PM.dimensions.map((d) => {
                const v = r.values[d.id];
                const [bg, fg] = heat(v);
                return (
                  <td key={d.id} className="h-10 min-w-[54px] rounded-lg text-center text-sm font-bold transition group-hover:scale-105" style={{ background: bg, color: fg }} title={`${d.title} : ${v}`}>
                    {v}
                  </td>
                );
              })}
              <td className="rounded-lg bg-navy-900 text-center font-display text-sm font-extrabold text-white">{r.global}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------------
   8. STYLES DOMINANTS DU GROUPE — bulles proportionnelles
   --------------------------------------------------------------------- */
export function StyleBubbles({ types }) {
  const entries = useMemo(() => Object.entries(types).sort((a, b) => b[1] - a[1]), [types]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  return (
    <div className="flex flex-wrap items-end justify-center gap-4 py-2">
      {entries.map(([dim, count], i) => {
        const s = 70 + (count / max) * 70;
        return (
          <div key={dim} className="mce-pop flex flex-col items-center" style={{ animationDelay: `${i * 90}ms` }}>
            <div
              className="flex flex-col items-center justify-center rounded-full text-white shadow-lift"
              style={{ width: s, height: s, background: `radial-gradient(circle at 30% 30%, ${DIM_COLORS[dim]}cc, ${DIM_COLORS[dim]})` }}
            >
              <span style={{ fontSize: s / 3.2 }}>{ARCH[dim].emoji}</span>
              <span className="text-sm font-extrabold">{count}</span>
            </div>
            <span className="mt-2 text-xs font-bold text-navy-800">{ARCH[dim].nom}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------
   5. AXES DE FONCTIONNEMENT — curseurs bipolaires
   values : { axisId: -100..100 }, compare (optionnel) : idem en pointillés
   --------------------------------------------------------------------- */
export function AxesChart({ values, compare, compareLabel }) {
  return (
    <div className="space-y-5">
      {AXES.map((ax, i) => {
        const v = values?.[ax.id] ?? 0;
        const pos = (v + 100) / 2;
        const leanA = v < -20;
        const leanB = v > 20;
        return (
          <div key={ax.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="mb-2 flex items-center justify-between text-sm font-bold">
              <span className={leanA ? 'text-navy-900' : 'text-slate-400'}>{ax.ia} {ax.a}</span>
              <span className={leanB ? 'text-navy-900' : 'text-slate-400'}>{ax.b} {ax.ib}</span>
            </div>
            <div className="relative h-4 rounded-full" style={{ background: 'linear-gradient(90deg,#6366F1 0%,#E2E8F0 50%,#F59E0B 100%)' }}>
              <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-white" />
              <div className="absolute inset-y-0 left-3.5 right-3.5">
              {compare && (
                <span className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-navy-400 bg-white/60" style={{ left: `${(compare[ax.id] + 100) / 2}%` }} title={compareLabel} />
              )}
              <span
                className="absolute top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-navy-900 text-[10px] font-extrabold text-white shadow-lift ring-4 ring-white transition-all duration-700"
                style={{ left: `${pos}%` }}
              >
                {Math.abs(v) >= 50 ? '●' : '◐'}
              </span>
              </div>
            </div>
          </div>
        );
      })}
      <p className="text-center text-xs text-slate-400">Préférences déclarées : aucune n’est meilleure que l’autre.{compare ? ` Cercle en pointillés : ${compareLabel}.` : ''}</p>
    </div>
  );
}
