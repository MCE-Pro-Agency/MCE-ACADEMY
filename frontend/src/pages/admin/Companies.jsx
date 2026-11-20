import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Plus, Search, ArrowRight, Pencil, Trash2, Users, GraduationCap, Clock, Power } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { Badge, CredentialBox, EmptyState, Field, Modal, PageLoader, Spinner } from '../../components/ui';
import { timeAgo } from '../../lib/utils';

export default function Companies() {
  const { setActiveCompanyId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'new' | company

  const load = async () => {
    const [{ data: c }, { data: o }] = await Promise.all([
      supabase.from('companies').select('*').order('name'),
      supabase.rpc('companies_overview'),
    ]);
    const ov = Object.fromEntries((o || []).map((r) => [r.company_id, r]));
    setItems((c || []).map((x) => ({ ...x, stats: ov[x.id] || {} })));
  };
  useEffect(() => {
    load();
    if (location.state?.needCompany) toast('Choisissez l’entreprise dont vous voulez gérer l’espace.', { icon: '🏢' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openSpace = (c) => {
    setActiveCompanyId(c.id);
    navigate('/formateur');
  };

  const toggleActive = async (c) => {
    const { error } = await supabase.from('companies').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (c) => {
    const typed = prompt(`Cette action supprime l’entreprise, ses cours ET les comptes de tous ses utilisateurs.\nTapez le nom de l’entreprise pour confirmer : ${c.name}`);
    if (typed !== c.name) return;
    try {
      const res = await api(`/companies/${c.id}`, { method: 'DELETE' });
      toast.success(`Entreprise supprimée (${res.deleted_users} comptes)`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!items) return <PageLoader />;
  const filtered = items.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-title">Entreprises</h1>
          <p className="page-subtitle">Chaque entreprise dispose de son espace : cours, modules, formateurs et apprenants.</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle entreprise</button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-10" placeholder="Rechercher une entreprise…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune entreprise" description="Créez le premier espace entreprise." action={<button onClick={() => setModal('new')} className="btn-primary"><Plus className="h-4 w-4" /> Créer</button>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className={`card flex flex-col p-5 ${!c.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
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
                <div className="rounded-xl bg-slate-50 py-2"><p className="font-bold text-navy-900">{c.stats.learners ?? 0}{c.max_learners ? <span className="text-xs font-normal text-slate-400">/{c.max_learners}</span> : null}</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><Users className="h-3 w-3" /> apprenants</p></div>
                <div className="rounded-xl bg-slate-50 py-2"><p className="font-bold text-navy-900">{c.stats.courses ?? 0}</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><GraduationCap className="h-3 w-3" /> cours</p></div>
                <div className="rounded-xl bg-slate-50 py-2"><p className="font-bold text-navy-900">{c.stats.total_hours ?? 0} h</p><p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> formation</p></div>
              </div>
              <p className="mt-3 text-xs text-slate-400">{c.stats.trainers ?? 0} formateur(s) · dernière activité {timeAgo(c.stats.last_activity).toLowerCase()}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                <div className="flex">
                  <button onClick={() => setModal(c)} className="btn-ghost btn-sm" title="Modifier"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => toggleActive(c)} className="btn-ghost btn-sm" title={c.is_active ? 'Suspendre' : 'Réactiver'}><Power className="h-4 w-4" /></button>
                  <button onClick={() => remove(c)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
                <button onClick={() => openSpace(c)} className="btn-primary btn-sm">Ouvrir l’espace <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <CompanyModal company={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={load} />}
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
  });
  const [trainer, setTrainer] = useState({ full_name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const res = await api('/companies', {
          method: 'POST',
          body: { ...form, max_learners: Number(form.max_learners) || null, trainer: trainer.email ? trainer : undefined },
        });
        toast.success('Entreprise créée');
        onSaved();
        if (res.trainer?.error) toast.error(`Formateur : ${res.trainer.error}`);
        if (res.trainer?.profile) setResult({ email: res.trainer.profile.email, password: res.trainer.temporary_password || trainer.password });
        else onClose();
      } else {
        const { error } = await supabase.from('companies').update({ ...form, max_learners: Number(form.max_learners) || null }).eq('id', company.id);
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
          <p className="text-sm text-navy-800">L’espace et le compte formateur sont prêts.</p>
          <CredentialBox email={result.email} password={result.password} />
          <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>Terminer</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nom de l’entreprise *"><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Secteur"><input className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></Field>
            <Field label="Nombre max. d’apprenants"><input type="number" min={0} className="input" value={form.max_learners} onChange={(e) => setForm({ ...form, max_learners: e.target.value })} /></Field>
          </div>
          <Field label="Email de contact"><input type="email" className="input" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></Field>

          {isNew && (
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-sm font-bold text-navy-900">Formateur référent <span className="font-normal text-slate-400">(optionnel)</span></p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Nom complet" value={trainer.full_name} onChange={(e) => setTrainer({ ...trainer, full_name: e.target.value })} />
                <input type="email" className="input" placeholder="Email" value={trainer.email} onChange={(e) => setTrainer({ ...trainer, email: e.target.value })} />
                <input className="input sm:col-span-2" placeholder="Mot de passe (vide = généré)" value={trainer.password} onChange={(e) => setTrainer({ ...trainer, password: e.target.value })} />
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
