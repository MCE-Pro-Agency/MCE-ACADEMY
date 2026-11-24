import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function Logo({ to = '/', dark = false, compact = false, className }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
        <img src="/logo.png" alt="MCE" className="h-9 w-9 object-contain" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={cn('block font-display text-lg font-extrabold tracking-tight', dark ? 'text-white' : 'text-navy-900')}>
            MCE <span className="text-brand-500">Academy</span>
          </span>
          <span className={cn('block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em]', dark ? 'text-navy-200' : 'text-slate-400')}>
            Ensemble vers la réussite
          </span>
        </span>
      )}
    </Link>
  );
}
