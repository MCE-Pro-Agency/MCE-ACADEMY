import { useEffect } from 'react';
import { X, Loader2, Inbox } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn, initials } from '../../lib/utils';

/* ---------- Barre de progression ---------- */
export function ProgressBar({ value = 0, size = 'md', showLabel = false, tone = 'brand', className }) {
  const v = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };
  const tones = {
    brand: v >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-brand-400 to-brand-600',
    navy: 'bg-navy-700',
    gold: 'bg-gradient-to-r from-gold-400 to-gold-500',
  };
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn('w-full overflow-hidden rounded-full bg-slate-100', heights[size])}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn('h-full rounded-full animate-grow transition-all duration-700', tones[tone])} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-10 shrink-0 text-right text-xs font-semibold text-navy-700">{v}%</span>}
    </div>
  );
}

/* ---------- Anneau de progression ---------- */
export function ProgressRing({ value = 0, size = 64, stroke = 7, label, className, labelClassName = 'text-navy-800', trackColor = '#EEF3F8' }) {
  const v = Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = v >= 100 ? '#10B981' : '#2B9FDC';
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset .9s ease' }}
        />
      </svg>
      <span className={cn('absolute text-sm font-bold', labelClassName)}>{label ?? `${v}%`}</span>
    </div>
  );
}

/* ---------- Badge ---------- */
const BADGE_TONES = {
  slate: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
  navy: 'bg-navy-800 text-white',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100',
  gold: 'bg-gold-100 text-gold-600 ring-1 ring-inset ring-gold-300',
};
export function Badge({ tone = 'slate', children, className, icon: Icon }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', BADGE_TONES[tone], className)}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

/* ---------- Modale ---------- */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-lift animate-fade-in sm:rounded-2xl', widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-navy-900">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-800" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scroll-thin overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Chargement ---------- */
export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

export function PageLoader({ label = 'Chargement…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-slate-500">
      <Spinner className="h-8 w-8" />
      {label}
    </div>
  );
}

/* ---------- État vide ---------- */
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-brand-50 p-3 text-brand-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Carte KPI ---------- */
export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    navy: 'bg-navy-50 text-navy-700',
    green: 'bg-emerald-50 text-emerald-600',
    gold: 'bg-gold-100 text-gold-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-navy-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('rounded-xl p-2.5', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, src, size = 'md', className }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' };
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />;
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-navy-700 font-bold text-white', sizes[size], className)}>
      {initials(name)}
    </div>
  );
}

/* ---------- Champ de formulaire ---------- */
export function Field({ label, hint, children, className }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/* ---------- Onglets ---------- */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition',
            value === t.value ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-800'
          )}
        >
          {t.icon && <t.icon className="h-4 w-4" />}
          {t.label}
          {t.count !== undefined && (
            <span className={cn('rounded-full px-1.5 text-xs', value === t.value ? 'bg-brand-50 text-brand-700' : 'bg-slate-200')}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Markdown ---------- */
export function Markdown({ children, className }) {
  return (
    <div
      className={cn(
        'lesson-prose prose prose-slate max-w-none prose-headings:font-display prose-headings:text-navy-900 prose-a:text-brand-600 prose-strong:text-navy-900 prose-table:text-sm',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ''}</ReactMarkdown>
    </div>
  );
}

/* ---------- Interrupteur ---------- */
export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 text-sm font-medium text-navy-800">
      <span className={cn('relative h-6 w-11 rounded-full transition', checked ? 'bg-brand-500' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  );
}

/* ---------- Mot de passe temporaire ---------- */
export function CredentialBox({ email, password }) {
  if (!password) return null;
  return (
    <div className="rounded-xl border border-gold-300 bg-gold-100/60 p-4 text-sm">
      <p className="font-semibold text-navy-900">Identifiants à transmettre</p>
      <p className="mt-1 text-navy-700">
        Email : <span className="font-mono">{email}</span>
      </p>
      <p className="text-navy-700">
        Mot de passe temporaire : <span className="font-mono font-bold">{password}</span>
      </p>
      <button className="btn-secondary btn-sm mt-3" onClick={() => navigator.clipboard?.writeText(`Email : ${email}\nMot de passe : ${password}`)}>
        Copier
      </button>
    </div>
  );
}
