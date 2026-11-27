import { useEffect, useMemo, useState } from 'react';
import { Building2, Users, GraduationCap, UserPlus, RefreshCcw, Search, FileText, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/db';
import { Link, useParams } from 'react-router-dom';

// Admin V2 : vues par entreprise. Ne modifie ni les profils professionnels ni les contenus pedagogiques.
const TABS = [
  ['overview', 'Vue entreprise'], ['users', 'Tous les comptes'], ['learners', 'Apprenants'],
  ['trainers', 'Formateurs'], ['assign', 'Affectations'], ['courses', 'Formations'], ['documents', 'Documents'],
];
const displayName = (p) => p?.full_name || p?.name || p?.email || p?.id || 'Compte sans nom';
const message = (e) => e?.message || String(e || 'Erreur inconnue');

export default function AdminCompanyHubV1() {
  const [companies, setCompanies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const { companyId } = useParams();
  const [selected, setSelected] = useState(companyId || '');
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true); setNotice('');
    const calls = await Promise.allSettled([
      db.from('companies').select('*').order('name'),
      db.from('profiles').select('*').order('created_at', { ascending: false }),
      db.from('trainer_companies').select('*'),
      db.from('courses').select('*'),
      db.from('documents').select('*'),
    ]);
    const setters = [setCompanies, setProfiles, setAssignments, setCourses, setDocuments];
    const names = ['Entreprises', 'Comptes', 'Affectations', 'Formations', 'Documents'];
    const failures = [];
    calls.forEach((result, i) => {
      if (result.status === 'rejected') { setters[i]([]); failures.push(names[i] + ' : ' + message(result.reason)); return; }
      const { data, error } = result.value;
      setters[i](error ? [] : (data || []));
      if (error) failures.push(names[i] + ' : ' + message(error));
    });
    setErrors(failures);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (companies.length && !companies.some(c => String(c.id) === selected)) setSelected(String(companies[0].id));
  }, [companies, selected]);

  const current = companies.find(c => String(c.id) === selected);
  const members = useMemo(() => profiles.filter(p => String(p.company_id) === selected), [profiles, selected]);
  const allTrainers = useMemo(() => profiles.filter(p => p.role === 'trainer'), [profiles]);
  const assignedIds = useMemo(() => new Set([...assignments.filter(a => String(a.company_id) === selected).map(a => String(a.trainer_id)), ...allTrainers.filter(p => String(p.company_id) === selected).map(p => String(p.id))]), [assignments, allTrainers, selected]);
  const trainers = useMemo(() => allTrainers.filter(p => assignedIds.has(String(p.id)) || String(p.company_id) === selected), [allTrainers, assignedIds, selected]);
  const learners = useMemo(() => members.filter(p => p.role === 'learner'), [members]);
  const companyCourses = useMemo(() => courses.filter(c => String(c.company_id) === selected), [courses, selected]);
  const companyDocs = useMemo(() => documents.filter(d => String(d.company_id) === selected), [documents, selected]);
  const filtered = items => items.filter(p => [displayName(p), p.email, p.role].some(v => String(v || '').toLowerCase().includes(search.toLowerCase())));
  const roleName = role => ({ admin: 'Administrateur', trainer: 'Formateur', learner: 'Apprenant' }[role] || role || 'Non defini');

  async function addTrainer(e) {
    e.preventDefault();
    if (!selected || !trainerId) return;
    if (assignedIds.has(String(trainerId))) { setNotice('Ce formateur est deja affecte a cette entreprise.'); return; }
    setBusy(true); setNotice('');
    const { error } = await db.from('trainer_companies').insert({ trainer_id: trainerId, company_id: selected });
    setBusy(false);
    if (error) { setNotice('Affectation non enregistree : ' + message(error)); return; }
    setTrainerId('');
    await load();
    setNotice('Formateur ajoute a cette entreprise.');
  }

  const panel = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200';
  const mini = 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3';
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <header className="admin-hero"><div><p className="text-xs font-bold uppercase tracking-widest text-sky-200">Administration MCE Academy</p><h1 className="mt-2 text-3xl font-extrabold">Fiche entreprise</h1><p className="mt-2 text-sm text-sky-100">Comptes, formations, affectations et documents.</p></div></header>
      <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"><RefreshCcw size={16}/> Actualiser</button>
    </div>
    {errors.length > 0 && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><div className="mb-2 flex items-center gap-2 font-bold"><AlertCircle size={17}/> Certaines donnees ne sont pas accessibles</div>{errors.map((x,i) => <p key={i}>{x}</p>)}<p className="mt-2">Verifier les droits Supabase/RLS avant de conclure qu'une entreprise n'a pas de comptes.</p></div>}
    {notice && <div role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-slate-800">{notice}</div>}
    <div className={panel}>
      <h2 className="mb-3 font-bold text-slate-900">Entreprises clientes ({companies.length})</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{companies.map(c => {
        const ps = profiles.filter(p => String(p.company_id) === String(c.id));
        const assigned = new Set(assignments.filter(a => String(a.company_id) === String(c.id)).map(a => String(a.trainer_id)));
        const nbTrainers = allTrainers.filter(p => assigned.has(String(p.id)) || String(p.company_id) === String(c.id)).length;
        return <button type="button" key={c.id} onClick={() => { setSelected(String(c.id)); setTab('overview'); setSearch(''); }} aria-pressed={selected === String(c.id)} className={'rounded-2xl border p-4 text-left transition ' + (selected === String(c.id) ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-100' : 'border-slate-200 bg-white hover:border-sky-300')}>
          <div className="flex items-center gap-2 font-bold text-slate-900"><Building2 size={19}/>{c.name}</div><p className="mt-2 text-xs text-slate-500">{ps.filter(p=>p.role==='learner').length} apprenant(s) · {nbTrainers} formateur(s)</p><p className="mt-1 text-xs text-slate-500">{courses.filter(x=>String(x.company_id)===String(c.id)).length} formation(s) · {documents.filter(x=>String(x.company_id)===String(c.id)).length} document(s)</p>
        </button>;
      })}</div>
      {!companies.length && <p className="text-sm text-slate-500">{loading ? 'Chargement...' : 'Aucune entreprise visible avec les autorisations actuelles.'}</p>}
    </div>
    {current && <section className={panel}>
      <div className="mb-4 flex flex-wrap gap-2"><Link className="btn-secondary" to="/admin/entreprises">Retour aux entreprises</Link><Link className="btn-secondary" to={`/admin/cours?company=${current.id}`}>Formations</Link><Link className="btn-secondary" to={`/admin/acces?company=${current.id}`}>Accès</Link><Link className="btn-secondary" to={`/admin/performances?company=${current.id}`}>Performances</Link></div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-slate-500">Entreprise selectionnee</p><h2 className="text-xl font-bold">{current.name}</h2></div><div className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={15}/> Donnees filtrees par entreprise</div></div>
      <div role="tablist" aria-label="Informations entreprise" className="mb-5 flex flex-wrap gap-2">{TABS.map(([k,label])=><button key={k} role="tab" aria-selected={tab===k} onClick={()=>setTab(k)} className={'rounded-xl px-3 py-2 text-sm font-semibold '+(tab===k?'bg-sky-600 text-white':'bg-slate-100 text-slate-700 hover:bg-slate-200')}>{label}</button>)}</div>
      {tab==='overview' && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[[Users,'Comptes rattaches',members.length], [GraduationCap,'Formateurs affectes',trainers.length],[BookOpen,'Formations',companyCourses.length],[FileText,'Documents',companyDocs.length]].map(([Icon,label,n])=><div key={label} className={mini}><Icon size={19} className="mb-2 text-sky-600"/><p className="text-3xl font-bold">{n}</p><p className="text-xs text-slate-500">{label}</p></div>)}</div>}
      {['users','learners','trainers'].includes(tab) && <div><label className="mb-3 flex max-w-md items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"><Search size={16}/><input className="w-full bg-transparent outline-none" placeholder="Chercher par nom, email ou role" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered(tab==='learners'?learners:tab==='trainers'?trainers:members).map(p=><div key={p.id} className={mini}><p className="break-words font-bold">{displayName(p)}</p><p className="break-all text-sm text-slate-600">{p.email || 'Email non renseigne'}</p><p className="mt-2 text-xs font-semibold text-sky-700">{roleName(p.role)}</p>{p.role==='learner'&&<Link className="mt-2 inline-block text-sm font-semibold text-sky-700 underline" to={'/admin/apprenants/'+p.id}>Voir le dossier apprenant</Link>}</div>)}</div>{!filtered(tab==='learners'?learners:tab==='trainers'?trainers:members).length && <p className="text-sm text-slate-500">Aucun resultat dans cette entreprise avec les criteres actuels.</p>}</div>}
      {tab==='assign' && <div className="space-y-4"><p className="text-sm text-slate-600">Plusieurs formateurs peuvent etre affectes a une meme entreprise. Les affectations existantes sont conservees.</p><form onSubmit={addTrainer} className="flex flex-wrap items-end gap-3"><label className="min-w-64 flex-1 text-sm font-semibold">Ajouter un formateur<select required value={trainerId} onChange={e=>setTrainerId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"><option value="">Choisir un compte formateur</option>{allTrainers.filter(p=>!assignedIds.has(String(p.id))).map(p=><option key={p.id} value={p.id}>{displayName(p)} — {p.email || p.id}</option>)}</select></label><button disabled={busy || !trainerId} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"><UserPlus size={17}/>{busy?'Enregistrement...':'Affecter'}</button></form><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{trainers.map(p=><div key={p.id} className={mini}><p className="font-semibold">{displayName(p)}</p><p className="text-xs text-slate-500">{p.email || 'Compte formateur'}</p></div>)}</div>{!trainers.length && <p className="text-sm text-slate-500">Aucun formateur affecte visible.</p>}</div>}
      {tab==='courses' && <div className="grid gap-3 sm:grid-cols-2">{companyCourses.map(c=><div key={c.id} className={mini}><BookOpen size={18} className="mb-2 text-sky-600"/><p className="font-bold">{c.title || c.name || 'Formation'}</p><p className="mt-1 text-xs text-slate-500">{c.is_published ? 'Publiée' : 'Brouillon'}</p><Link className="mt-2 inline-block font-semibold text-sky-700" to={`/admin/cours/${c.id}`}>Gérer la formation →</Link></div>)}</div>}
      {tab==='documents' && <div className="grid gap-3 sm:grid-cols-2">{companyDocs.map(d=><div key={d.id} className={mini}><FileText size={18} className="mb-2 text-sky-600"/><p className="font-bold">{d.title || d.name || d.filename || 'Document'}</p><p className="mt-1 text-xs text-slate-500">{d.is_available ? 'Disponible' : 'Non publié'}</p><p className="mt-1 text-xs text-slate-500">Document rattache a {current.name}</p></div>)}</div>}
    </section>}
  </div>;
}
