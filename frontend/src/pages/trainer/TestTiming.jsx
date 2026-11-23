import { Clock3, CheckCircle2, TimerReset, AlertCircle } from 'lucide-react';
import { PM } from '../../data/profilModel';

/** Indicateur informatif. Le test n'a pas de date limite enregistrée : ne jamais parler de retard contractuel. */
export function testTiming(run) {
  const value = Number(run?.minutes);
  if (!Number.isFinite(value) || value <= 0) return { value: null, minutesOver: null, label: 'Durée indisponible', tone: 'slate' };
  const limit = Number(PM.duration) || 25;
  if (value <= limit) return { value, minutesOver: 0, label: 'Dans le temps indicatif', tone: 'emerald' };
  return { value, minutesOver: value - limit, label: `+${value - limit} min sur le temps indicatif`, tone: 'amber' };
}

const tones = {
  emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  slate: 'bg-slate-50 text-slate-600 ring-slate-200',
};

export default function TestTiming({ run, compact = false }) {
  const info = testTiming(run);
  const Icon = info.value === null ? AlertCircle : info.minutesOver ? TimerReset : CheckCircle2;
  return <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100'}`}>
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[info.tone]}`}>
      <Icon className="h-3.5 w-3.5" />{info.label}
    </span>
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900"><Clock3 className="h-4 w-4 text-brand-600" />{info.value === null ? '—' : `${info.value} min`}</span>
    {!compact && <span className="text-xs text-slate-500">Durée indicative : {PM.duration} min. Temps écoulé, pauses éventuelles incluses ; ce n’est pas une échéance de remise ni une note.</span>}
  </div>;
}
