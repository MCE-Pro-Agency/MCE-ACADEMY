import { Link } from 'react-router-dom';
import { CalendarClock, FolderOpen, Video, Info, GraduationCap, BookOpen, Search, Layers, ChevronRight, ArrowRight, Users, KeyRound, Target, Ear, Scale, Star, UserCheck, MessageSquare, Clock, Compass, TrendingUp, HeartHandshake, Lightbulb, Eye, MessagesSquare, CalendarDays, Mic, Quote, Leaf, ClipboardCheck, FileText } from 'lucide-react';
import { MEMOS, THEMES } from '../../data/ressources';
import { Modal } from '../../components/ui';
import { useMemo, useState } from 'react';

const shortcuts = [
  { title: 'Programme & déblocage', text: 'Consulter le parcours par modules et les apprenants. Certaines commandes nécessitent l’activation SQL 003.', icon: GraduationCap, tone: 'bg-brand-100 text-brand-700', to: '/formateur/programme' },
  { title: 'Documents & livrables', text: 'Déposer les supports, e-books et attestations après activation de la table documents.', icon: FolderOpen, tone: 'bg-violet-100 text-violet-700', to: '/formateur/documents' },
  { title: 'Ateliers et Miroir Vocal', text: 'Préparation pédagogique disponible ; suivi vidéo et émargement à définir avant intégration Supabase.', icon: Video, tone: 'bg-amber-100 text-amber-700' },
];
const icons = [Users, KeyRound, Target, Ear, Scale, Star, UserCheck, MessageSquare, Clock, Compass, TrendingUp, HeartHandshake, Lightbulb, Eye, MessagesSquare, CalendarDays, Mic, Quote, Leaf, ClipboardCheck];
const colors = {
  blue: { icon:'bg-brand-100 text-brand-700', edge:'border-l-brand-500', label:'bg-brand-50 text-brand-700' },
  green: { icon:'bg-teal-100 text-teal-700', edge:'border-l-teal-500', label:'bg-teal-50 text-teal-700' },
  gold: { icon:'bg-amber-100 text-amber-700', edge:'border-l-amber-500', label:'bg-amber-50 text-amber-700' },
  purple: { icon:'bg-violet-100 text-violet-700', edge:'border-l-violet-500', label:'bg-violet-50 text-violet-700' },
};
function memoStyle(m) {
  return colors[m.id==='M04'?'green':m.id==='M05'?'gold':m.id==='M06'?'purple':m.module==='comm'||m.module==='hyg'?'green':m.module==='reun'?'gold':m.module==='parole'?'purple':'blue'];
}
function Shortcut({ item }) {
  const Icon = item.icon;
  const contents = <><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}><Icon className="h-6 w-6"/></div><div className="min-w-0 flex-1"><h2 className="font-bold text-navy-900">{item.title}</h2><p className="mt-1 text-xs leading-relaxed text-slate-600">{item.text}</p></div>{item.to && <ChevronRight className="h-5 w-5 shrink-0 text-brand-600"/>}</>;
  const cls = 'flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card';
  return item.to ? <Link to={item.to} className={`${cls} transition hover:border-brand-300 hover:shadow-lift`}>{contents}</Link> : <div className={cls}>{contents}</div>;
}
function LibraryBanner() {
  return <section className="relative isolate overflow-hidden rounded-2xl bg-navy-900 px-5 py-6 text-white shadow-card sm:px-7">
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-900 via-navy-800 to-brand-800"/>
    <svg aria-hidden="true" viewBox="0 0 1000 150" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 left-0 -z-10 h-24 w-full opacity-40"><path d="M0 100 Q180 15 400 105 T1000 50 V150H0Z" fill="#186898"/><path d="M0 110 Q200 30 440 120 T1000 70" fill="none" stroke="#4FB4E8" strokeWidth="2"/></svg>
    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex items-center gap-4"><div aria-hidden="true" className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:flex"><BookOpen className="h-11 w-11 text-brand-200" strokeWidth={1.4}/></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-200">La méthode MCE</p><h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Bibliothèque C.L.E.F.</h2><p className="mt-1 text-lg font-semibold text-brand-200">{MEMOS.length} mémos pédagogiques</p><p className="mt-2 text-xs text-navy-100">Contenus de référence en lecture seule.</p></div></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[
        ['C','Clarté','border-brand-400 bg-brand-500/20'],
        ['L','Lucidité & écoute','border-teal-400 bg-teal-500/20'],
        ['E','Équité & équilibre','border-amber-400 bg-amber-500/20'],
        ['F','Faire grandir','border-violet-400 bg-violet-500/20'],
      ].map(([letter,label,tone])=><div key={letter} className={`flex min-h-[86px] min-w-0 flex-col items-center justify-center rounded-xl border p-2 text-center sm:w-24 ${tone}`}><span className="font-display text-3xl font-bold">{letter}</span><span className="mt-1 text-[11px] font-medium leading-tight text-white">{label}</span></div>)}</div>
    </div>
  </section>;
}
export default function Activities() {
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('all');
  const [selected, setSelected] = useState(null);
  const memos = useMemo(() => MEMOS.filter(m => (theme === 'all' || m.module === theme) && `${m.titre} ${m.mantra} ${m.tag}`.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr'))), [search,theme]);
  return <div className="space-y-5">
    <header className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700"><CalendarClock className="h-8 w-8"/></div><div><p className="eyebrow">Animation pédagogique</p><h1 className="page-title">Séances &amp; activités</h1><p className="page-subtitle">Préparez le déroulement des séances, les déblocages et les ressources MCE C.L.E.F.</p></div></header>
    <div className="grid gap-3 xl:grid-cols-3">{shortcuts.map(item=><Shortcut key={item.title} item={item}/>)}</div>
    <LibraryBanner/>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-700"/><input className="input pl-10" aria-label="Chercher un mémo" placeholder="Rechercher un mémo…" value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="relative sm:w-64"><Layers className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-700"/><select className="input pl-10" aria-label="Filtrer par module" value={theme} onChange={e=>setTheme(e.target.value)}><option value="all">Tous les modules</option>{THEMES.map(t=><option key={t.id} value={t.id}>{t.short}</option>)}</select></label></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-navy-700">{memos.length} mémo{memos.length!==1?'s':''} sur {MEMOS.length}</p><a className="btn-secondary btn-sm" href="/documents/MCE_Livret_20_Memos.pdf" target="_blank" rel="noreferrer"><FileText className="h-4 w-4"/> Consulter le livret PDF</a></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{memos.map(m=>{const Icon=icons[Number(m.id.slice(1))-1]||BookOpen;const tone=memoStyle(m);return <button type="button" key={m.id} onClick={()=>setSelected(m)} className={`group flex min-w-0 flex-col rounded-2xl border border-l-4 border-slate-200 ${tone.edge} bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400`}><div className="flex items-start gap-3"><div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}><Icon className="h-7 w-7" strokeWidth={1.7}/></div><div className="min-w-0 flex-1"><span className={`inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone.label}`}>Mémo {m.id.slice(1)}</span><h3 className="mt-2 break-words text-sm font-bold leading-snug text-navy-900 sm:text-base">{m.titre}</h3></div></div><span className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-brand-700">Consulter le mémo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></button>;})}</div>
    {!memos.length&&<div className="card p-10 text-center text-sm text-slate-500">Aucun mémo trouvé.</div>}
    <p className="text-xs text-slate-500">Contenus de référence en lecture seule, sans création de table ni publication automatique.</p>
    <p className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-500"><Info className="h-4 w-4 shrink-0 text-brand-600"/> Les présences, vidéos individuelles et échéances J+30 nécessitent des règles de stockage et de confidentialité à valider. Aucune fonctionnalité fictive n’est activée.</p>
    <Modal open={Boolean(selected)} onClose={()=>setSelected(null)} title={selected?.titre} description={selected?`${selected.id} · ${selected.tag}`:undefined} size="lg" footer={<button className="btn-primary" type="button" onClick={()=>setSelected(null)}>Fermer</button>}>
      {selected&&<div className="space-y-5"><blockquote className="rounded-xl border-l-4 border-brand-500 bg-brand-50 p-5 text-base font-semibold italic leading-relaxed text-navy-800">{selected.mantra}</blockquote><section><h3 className="mb-3 font-bold text-navy-900">Points essentiels</h3><ul className="space-y-3">{selected.points.map((point,i)=><li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i+1}</span>{point}</li>)}</ul></section><section className="rounded-xl border border-brand-100 bg-brand-50 p-4"><h3 className="flex items-center gap-2 font-bold text-navy-900"><Target className="h-5 w-5 text-brand-700"/> Action</h3><p className="mt-2 text-sm leading-relaxed text-navy-800">{selected.action}</p></section></div>}
    </Modal>
  </div>;
}
