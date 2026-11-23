import { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { downloadMemoPdf } from '../../lib/pdf';
import { MEMOS, THEMES } from '../../data/ressources';
import { Modal } from '../../components/ui';
import { cn } from '../../lib/utils';

const MOD = Object.fromEntries(THEMES.map((m) => [m.id, m]));

export default function Memos() {
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);

  const list = useMemo(
    () => MEMOS.filter((m) => (!filter || m.module === filter) && (!q || `${m.titre} ${m.mantra} ${m.tag}`.toLowerCase().includes(q.toLowerCase()))),
    [filter, q]
  );
  const counts = Object.fromEntries(THEMES.map((m) => [m.id, MEMOS.filter((x) => x.module === m.id).length]));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Méthode C.L.E.F.</p>
        <h1 className="page-title">Mes ressources — mémos du manager</h1>
        <p className="page-subtitle">20 repères concrets — Clarté · Lucidité & écoute · Équité & équilibre · Faire grandir.</p>
        <a href="/documents/MCE_Livret_20_Memos.pdf" download className="btn-secondary btn-sm mt-3"><Download className="h-4 w-4" /> Livret complet des 20 mémos (PDF)</a>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[['C', 'Clarté', 'Un résultat, une priorité, un délai', '#2B9FDC'], ['L', 'Lucidité & écoute', 'Des faits, des questions, un dialogue', '#6366F1'], ['E', 'Équité & équilibre', 'Un cadre juste, une posture stable', '#10B981'], ['F', 'Faire grandir', 'Du soutien, des responsabilités, des progrès', '#F59E0B']].map(([l, t, d, c], i) => (
          <div key={l} className="card flex items-center gap-3 p-4 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-extrabold text-white shadow" style={{ background: c }}>{l}</span>
            <div><p className="font-bold text-navy-900">{t}</p><p className="text-xs text-slate-500">{d}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter('')} className={cn('rounded-full px-4 py-1.5 text-sm font-semibold ring-1', !filter ? 'bg-navy-800 text-white ring-navy-800' : 'bg-white text-navy-700 ring-slate-200')}>Tous · {MEMOS.length}</button>
        {THEMES.filter((m) => counts[m.id]).map((m) => (
          <button key={m.id} onClick={() => setFilter(m.id)} className={cn('rounded-full px-4 py-1.5 text-sm font-semibold ring-1', filter === m.id ? 'text-white ring-transparent' : 'bg-white text-navy-700 ring-slate-200')} style={filter === m.id ? { background: m.color } : undefined}>
            {m.icon} {m.short} · {counts[m.id]}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un mémo…" className="input pl-9" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((m, i) => {
          const mod = MOD[m.module];
          return (
            <button key={m.id} onClick={() => setOpen(m)} className="card group relative overflow-hidden p-5 text-left transition hover:-translate-y-1 hover:shadow-lift animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: mod.color }} />
              <div className="flex items-center justify-between text-xs font-bold">
                <span style={{ color: mod.color }}>{m.id}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 tracking-wide text-slate-500">{m.tag}</span>
              </div>
              <h3 className="mt-3 font-bold text-navy-900 group-hover:text-brand-600">{m.titre}</h3>
              <p className="mt-2 text-sm italic text-slate-500">« {m.mantra} »</p>
              <p className="mt-3 text-xs text-slate-400">{mod.icon} {mod.short} · {m.audience}</p>
            </button>
          );
        })}
      </div>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} size="lg" title={open ? `${open.id} — ${open.titre}` : ''} description={open ? `${MOD[open.module].nom} · ${open.audience}` : ''}
        footer={open && <button onClick={() => downloadMemoPdf(open, MOD[open.module].nom)} className="btn-brand"><Download className="h-4 w-4" /> Télécharger ce mémo (PDF)</button>}>
        {open && (
          <div className="space-y-4 text-sm">
            <p className="rounded-xl border-l-4 border-orange-400 bg-orange-50 p-4 font-semibold text-navy-900">{open.mantra}</p>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">À retenir</p>
              <ul className="space-y-1.5">{open.points.map((p) => <li key={p} className="flex gap-2"><span className="text-brand-500">●</span>{p}</li>)}</ul>
            </div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-navy-900">Exemple concret</p><p className="mt-1 text-slate-600">{open.cas}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-navy-900">Question à se poser</p><p className="mt-1 text-slate-600">{open.question}</p></div>
            <div className="rounded-xl border-l-4 border-teal-500 bg-teal-50 p-4"><p className="font-bold text-navy-900">À tester demain</p><p className="mt-1 text-slate-700">{open.action}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
