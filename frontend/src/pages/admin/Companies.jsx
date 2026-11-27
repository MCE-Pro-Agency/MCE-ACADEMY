import {useAdminConfirm} from '../../components/layout/AdminConfirm';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Plus, Search, ArrowRight, Pencil, Trash2, Users, GraduationCap, Clock, Power } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { api } from '../../lib/api';
import { Badge, EmptyState, Field, Modal, PageLoader, Spinner } from '../../components/ui';
import { timeAgo } from '../../lib/utils';

export default function Companies() {
  const ask=useAdminConfirm();
  const { setActiveCompanyId, authorizedCompanies, refreshCompanies } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState('');
  const [status,setStatus]=useState(''); const [selected,setSelected]=useState([]); const [busy,setBusy]=useState(false); const [loadError,setLoadError]=useState('');
  const [modal, setModal] = useState(null); // 'new' | company

  const load = async () => {
    const [{ data: c, error }, { data: o, error: statsError }] = await Promise.all([
      db.from('companies').select('*').order('name'),
      db.rpc('companies_overview'),
    ]);
    if(error){setLoadError(error.message);setItems([]);return;}
    setLoadError(statsError ? `Statistiques indisponibles : ${statsError.message}` : '');
    const ov = Object.fromEntries((o || []).map((r) => [r.company_id, r]));
    setItems((c || []).map((x) => ({ ...x, stats: ov[x.id] || {} })));
  };
  useEffect(() => {
    load();
    if (location.state?.needCompany) toast('Choisissez l’entreprise dont vous voulez gérer l’espace.', { icon: '🏢' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openSpace = (c) => {
    
    
    navigate(`/admin/entreprises/${c.id}`);
  };

  const changeStatus = async (ids, active) => {
    if (!ids.length || busy || !await ask(`${active?'Réactiver':'Suspendre'} ${ids.length} entreprise(s) ? Les données sont conservées.`)) return;
    setBusy(true);
    try {
      const {data,error}=await db.from('companies').update({is_active:active}).in('id',ids).select('id');
      if(error) throw error;
      if(data?.length!==ids.length) throw new Error('Certaines entreprises n’ont pas été modifiées. Vérifiez les droits.');
      toast.success('Statut mis à jour'); setSelected([]); refreshCompanies();
    } catch(e){toast.error(e.message);} finally {await load();setBusy(false);}
  };
  const toggleActive = c => changeStatus([c.id],!c.is_active);

  const remove = async (c) => {
    if (busy || !await ask(`Suppression définitive : l’entreprise, ses cours et les comptes rattachés peuvent être supprimés. Pour préserver les historiques, utilisez plutôt la suspension.`,c.name)) return;
    setBusy(true);
    try {
      const checks=await Promise.all([db.from('profiles').select('id',{count:'exact',head:true}).eq('company_id',c.id),db.from('courses').select('id',{count:'exact',head:true}).eq('company_id',c.id),db.from('trainer_companies').select('trainer_id',{count:'exact',head:true}).eq('company_id',c.id)]);
      if(checks.some(x=>x.error||x.count==null)) throw new Error('Impossible de vérifier les données associées. Suppression annulée.');
      if(checks.some(x=>x.count>0)) throw new Error('Cette entreprise contient des comptes, formations ou affectations. Suspendez-la pour conserver ses données.');
      const res = await api(`/companies/${c.id}`, { method: 'DELETE' });
      toast.success(`Entreprise supprimée (${res.deleted_users} comptes)`);
      refreshCompanies(); load();
    } catch (e) {
      toast.error(e.message);
    } finally {setBusy(false);}
  };

  if (!items) return <PageLoader />;
  const filtered = items.filter(c => `${c.name} ${c.sector||''}`.toLowerCase().includes(search.toLowerCase()) && (!status || c.is_active === (status==='active')));
  const visibleIds=filtered.map(c=>c.id); const chosen=selected.filter(id=>visibleIds.includes(id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title admin-page-title">Entreprises clientes</h1>
          <p className="page-subtitle">Chaque entreprise dispose de son espace : cours, modules, formateurs et apprenants.</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle entreprise</button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">{[[items.length,'Entreprises'],[items.filter(c=>c.is_active).length,'Actives'],[items.filter(c=>!c.is_active).length,'Suspendues']].map(([n,label])=><div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-5"><p className="text-2xl font-extrabold text-navy-900">{n}</p><p className="break-words text-xs text-slate-500">{label}</p></div>)}</div>
      {loadError&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{loadError} <button onClick={load} className="underline">Réessayer</button></p>}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visibleIds.length>0&&chosen.length===visibleIds.length} onChange={e=>setSelected(e.target.checked?visibleIds:[])} /> Tout sélectionner ({chosen.length})</label>
        <button className="btn-secondary btn-sm" disabled={busy||!chosen.length} onClick={()=>changeStatus(chosen,false)}>Suspendre</button><button className="btn-secondary btn-sm" disabled={busy||!chosen.length} onClick={()=>changeStatus(chosen,true)}>Réactiver</button>
        <select aria-label="Filtrer par statut" className="input sm:w-auto" value={status} onChange={e=>{setStatus(e.target.value);setSelected([])}}><option value="">Tous les statuts</option><option value="active">Actives</option><option value="inactive">Suspendues</option></select>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-10" placeholder="Rechercher une entreprise…" value={search} onChange={(e) => {setSearch(e.target.value);setSelected([])}} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune entreprise" description="Créez le premier espace entreprise." action={<button onClick={() => setModal('new')} className="btn-primary"><Plus className="h-4 w-4" /> Créer</button>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className={`card flex flex-col p-5 ${!c.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-2">
                <input type="checkbox" aria-label={`Sélectionner ${c.name}`} checked={selected.includes(c.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,c.id]:old.filter(id=>id!==c.id))} className="mt-4 shrink-0"/>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navy-800 text-lg font-bold text-white">
                  {c.logo_url ? <img src={c.logo_url} alt="" className="h-full w-full bg-white object-contain" /> : c.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-navy-900">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">{c.sector || '—'} · /{c.slug}</p>
                </div>
                {c.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspendue</Badge>}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 py-2"><p className="font-bold text-navy-900">{c.stats.learners ?? '—'}{c.max_learners ? <span className="text-xs font-normal text-slate-400">/{c.max_learners}</span> : null}</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><Users className="h-3 w-3" /> apprenants</p></div>
                <div className="rounded-xl bg-slate-50 py-2"><p className="font-bold text-navy-900">{c.stats.courses ?? '—'}</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><GraduationCap className="h-3 w-3" /> cours</p></div>
                <div className="rounded-xl bg-slate-50 py-2"><p className="font-bold text-navy-900">{c.stats.total_hours ?? '—'} h</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> formation</p></div>
              </div>
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Code d’inscription : <span className="font-mono font-semibold">{c.join_code || 'Non défini'}</span></p>
              <p className="mt-3 text-xs text-slate-400">{c.stats.trainers ?? '—'} formateur(s) · dernière activité {timeAgo(c.stats.last_activity).toLowerCase()}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
                <div className="flex">
                  <button onClick={() => setModal(c)} className="btn-ghost btn-sm" title="Modifier"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => toggleActive(c)} className="btn-ghost btn-sm" title={c.is_active ? 'Suspendre' : 'Réactiver'}><Power className="h-4 w-4" /></button>
                  <button onClick={() => remove(c)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
                <button onClick={() => openSpace(c)} className="btn-primary btn-sm">Voir la fiche <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <CompanyModal company={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={()=>{refreshCompanies();load();}} />}
    </div>
  );
}

function CompanyModal({ company, onClose, onSaved }) {
  const isNew = !company;
  const [form, setForm] = useState({
    name: company?.name || '',
    sector: company?.sector || '',
    contact_email: company?.contact_email || '',
    max_learners: company?.max_learners || '',
    join_code: company?.join_code || '',
  });
  const [trainer, setTrainer] = useState({ full_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const name=form.name.trim(); if(!name) throw new Error('Le nom est obligatoire.');
        const slugBase=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'entreprise';
        const slug=`${slugBase}-${crypto.randomUUID().slice(0,8)}`;
        const join_code=Array.from(crypto.getRandomValues(new Uint8Array(12)), b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
        const {data:created,error}=await db.from('companies').insert({name,slug,join_code,sector:form.sector.trim()||null,contact_email:form.contact_email.trim()||null,max_learners:Number(form.max_learners)||null}).select('id,name').single();
        if(error) throw error;
        toast.success('Entreprise créée'); onSaved();
        if(trainer.email){
          try {await api('/users',{method:'POST',body:{full_name:trainer.full_name.trim(),email:trainer.email.trim(),role:'trainer',company_id:created.id,is_active:true}});setResult({email:trainer.email});}
          catch(e){toast.error(`Entreprise créée. Invitation non confirmée : ${e.message}`);setResult({error:e.message});}
        } else onClose();
      } else {
        if (!/^[A-Z0-9_-]{10,32}$/.test(form.join_code.trim().toUpperCase())) throw new Error('Le code doit contenir 10 à 32 caractères (lettres, chiffres, _ ou -).');
        const { error } = await db.from('companies').update({ ...form, join_code:form.join_code.trim().toUpperCase(), max_learners: Number(form.max_learners) || null }).eq('id', company.id);
        if (error) throw error;
        toast.success('Entreprise mise à jour');
        onSaved();
        onClose();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? 'Nouvelle entreprise' : `Modifier ${company.name}`}>
      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-navy-800">L’espace de l’entreprise est prêt.</p>
          {result.error ? <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm">Invitation non confirmée : {result.error}. Vérifiez les utilisateurs avant de réessayer.</p> : <p className="rounded-xl bg-sky-50 p-3 text-sm">Invitation demandée pour {result.email}.</p>}
          <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Terminer</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nom de l’entreprise *"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Secteur"><input className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></Field>
            <Field label="Nombre max. d’apprenants"><input type="number" min={0} className="input" value={form.max_learners} onChange={(e) => setForm({ ...form, max_learners: e.target.value })} /></Field>
          </div>
          {!isNew && <Field label="Code unique d’inscription" hint="10 caractères ou plus, difficile à deviner"><input className="input font-mono" minLength={10} maxLength={32} value={form.join_code} onChange={e=>setForm({...form,join_code:e.target.value.toUpperCase()})}/></Field>}
          <Field label="Email de contact"><input type="email" className="input" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Field>

          {isNew && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-sm font-bold text-navy-900">Formateur référent <span className="font-normal text-slate-400">(optionnel)</span></p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Nom complet" value={trainer.full_name} onChange={(e) => setTrainer({ ...trainer, full_name: e.target.value })} />
                <input type="email" className="input" placeholder="Email" value={trainer.email} onChange={(e) => setTrainer({ ...trainer, email: e.target.value })} />
                <p className="text-xs text-slate-500 sm:col-span-2">Le formateur recevra une invitation par e-mail pour activer son compte.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
            <button className="btn-primary" disabled={saving}>{saving ? <Spinner className="text-white" /> : isNew ? 'Créer l’entreprise' : 'Enregistrer'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
