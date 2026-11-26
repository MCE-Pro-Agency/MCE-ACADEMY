import { Link } from 'react-router-dom';
import { CalendarClock, FolderOpen, Video, ClipboardList, Info } from 'lucide-react';
import { MEMOS, THEMES } from '../../data/ressources';
import { useMemo, useState } from 'react';

export default function Activities() {
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('all');
  const memos = useMemo(() => MEMOS.filter(m => (theme === 'all' || m.module === theme) && `${m.titre} ${m.mantra} ${m.tag}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))), [search,theme]);
  return <div className="space-y-6"><header><p className="eyebrow">Animation pédagogique</p><h1 className="page-title">Séances & activités</h1><p className="page-subtitle">Préparez le déroulement des séances, les déblocages et les ressources MCE C.L.E.F.</p></header>
    <div className="grid gap-4 md:grid-cols-3">
      <Link to="/formateur/programme" className="card space-y-2 p-5 transition hover:ring-2 hover:ring-brand-200"><CalendarClock className="text-brand-600"/><h2 className="font-bold text-navy-900">Programme & déblocage</h2><p className="text-sm text-slate-500">Consulter le parcours par modules et les apprenants. Certaines commandes nécessitent l’activation SQL 003.</p></Link>
      <Link to="/formateur/documents" className="card space-y-2 p-5 transition hover:ring-2 hover:ring-brand-200"><FolderOpen className="text-brand-600"/><h2 className="font-bold text-navy-900">Documents & livrables</h2><p className="text-sm text-slate-500">Déposer les supports, e-books et attestations après activation de la table documents.</p></Link>
      <div className="card space-y-2 p-5"><Video className="text-brand-600"/><h2 className="font-bold text-navy-900">Ateliers et Miroir Vocal</h2><p className="text-sm text-slate-500">Préparation pédagogique disponible ; suivi vidéo et émargement à définir avant intégration Supabase.</p></div>
    </div>
    <section className="card space-y-4 p-5"><div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-brand-600"/><h2 className="font-bold text-navy-900">Bibliothèque des {MEMOS.length} mémos C.L.E.F.</h2></div><p className="text-sm text-slate-500">Contenus de référence en lecture seule, sans création de table ni publication automatique.</p><div className="flex flex-col gap-2 sm:flex-row"><input className="input flex-1" placeholder="Chercher un mémo" value={search} onChange={e=>setSearch(e.target.value)}/><select className="input sm:w-56" value={theme} onChange={e=>setTheme(e.target.value)}><option value="all">Tous les modules</option>{THEMES.map(t=><option key={t.id} value={t.id}>{t.short}</option>)}</select></div><div className="grid gap-3 md:grid-cols-2">{memos.map(m=><details key={m.id} className="rounded-xl border border-slate-200 p-4 open:bg-brand-50/30"><summary className="cursor-pointer font-semibold text-navy-900">{m.id} · {m.titre}</summary><p className="mt-2 text-sm italic text-brand-700">{m.mantra}</p><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">{m.points.map((x,i)=><li key={i}>{x}</li>)}</ul><p className="mt-3 text-sm"><strong>Action :</strong> {m.action}</p></details>)}{!memos.length&&<p className="text-sm text-slate-500">Aucun mémo trouvé.</p>}</div><a className="btn-secondary inline-flex" href="/documents/MCE_Livret_20_Memos.pdf" target="_blank" rel="noreferrer">Consulter le livret PDF</a></section>
    <p className="flex gap-2 text-xs text-slate-500"><Info className="h-4 w-4 shrink-0"/> Les présences, vidéos individuelles et échéances J+30 nécessitent des règles de stockage et de confidentialité à valider. Aucune fonctionnalité fictive n’est activée.</p>
  </div>;
}
