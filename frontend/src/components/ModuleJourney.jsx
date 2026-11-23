/* Parcours de déblocage des modules — chemin animé */
import { useId } from 'react';

const STATUS = {
  done: { fill: '#10B981', ring: '#A7F3D0', label: 'Terminé' },
  open: { fill: '#2B9FDC', ring: '#A9DCF6', label: 'Ouvert' },
  locked: { fill: '#CBD5E1', ring: '#E2E8F0', label: 'Verrouillé' },
};

/**
 * items : [{ title, state: 'done'|'open'|'locked', pct, reason }]
 */
export default function ModuleJourney({ items, onSelect }) {
  const id = useId().replace(/:/g, '');
  const gap = 180;
  const W = Math.max(items.length * gap + 40, 400);
  const H = 230;
  const pos = items.map((_, i) => [70 + i * gap, i % 2 === 0 ? 70 : 140]);
  const seg = (i) => {
    const [x0, y0] = pos[i];
    const [x1, y1] = pos[i + 1];
    const mx = (x0 + x1) / 2;
    return `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  };
  const doneCount = items.filter((x) => x.state === 'done').length;

  return (
    <div className="scroll-thin overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W, height: H }} className="w-full">
        <defs>
          <linearGradient id={`jg${id}`} x1="0" x2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#2B9FDC" />
          </linearGradient>
          <filter id={`js${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#0B1D33" floodOpacity="0.2" />
          </filter>
        </defs>

        {items.slice(0, -1).map((it, i) => {
          const reached = items[i + 1].state !== 'locked';
          return (
            <g key={i}>
              <path d={seg(i)} stroke="#E2E8F0" strokeWidth="10" fill="none" strokeLinecap="round" />
              {reached ? (
                <path d={seg(i)} stroke={`url(#jg${id})`} strokeWidth="10" fill="none" strokeLinecap="round" className="mce-draw" style={{ animationDelay: `${i * 200}ms` }} />
              ) : (
                <path d={seg(i)} stroke="#94A3B8" strokeWidth="3" fill="none" strokeDasharray="6 8" className="mce-dash" />
              )}
            </g>
          );
        })}

        {items.map((it, i) => {
          const [x, y] = pos[i];
          const s = STATUS[it.state];
          const r = 30;
          const C = 2 * Math.PI * (r + 7);
          return (
            <g key={i} onClick={() => onSelect?.(i)} className={onSelect ? 'cursor-pointer' : ''}>
              {it.state === 'open' && <circle cx={x} cy={y} r={r} fill={s.fill} className="mce-pulse-ring" />}
              {/* anneau de progression */}
              <circle cx={x} cy={y} r={r + 7} fill="none" stroke={s.ring} strokeWidth="5" />
              {it.state !== 'locked' && (
                <circle
                  cx={x} cy={y} r={r + 7} fill="none" stroke={s.fill} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (C * (it.pct || 0)) / 100}
                  transform={`rotate(-90 ${x} ${y})`} style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              )}
              <circle cx={x} cy={y} r={r} fill={s.fill} filter={`url(#js${id})`} className="mce-pop" style={{ animationDelay: `${i * 120}ms` }} />
              <text x={x} y={y + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="white">
                {it.state === 'done' ? '✓' : it.state === 'locked' ? '🔒' : i + 1}
              </text>
              <foreignObject x={x - 80} y={y + r + 14} width="160" height="70">
                <div className="text-center leading-tight">
                  <p className="line-clamp-2 text-[12px] font-bold text-navy-900">{it.title}</p>
                  <p className="mt-0.5 text-[10.5px] font-semibold" style={{ color: it.state === 'locked' ? '#64748B' : s.fill }}>
                    {it.state === 'locked' ? it.reason || s.label : it.state === 'open' ? `${it.pct || 0} % · en cours` : s.label}
                  </p>
                </div>
              </foreignObject>
            </g>
          );
        })}

        {/* drapeau d'arrivée */}
        {items.length > 0 && (() => {
          const [x, y] = pos[pos.length - 1];
          const finished = doneCount === items.length;
          return (
            <text x={x + 46} y={y - 30} fontSize="26" className={finished ? 'mce-float' : ''} opacity={finished ? 1 : 0.35}>🏁</text>
          );
        })()}
      </svg>
    </div>
  );
}
