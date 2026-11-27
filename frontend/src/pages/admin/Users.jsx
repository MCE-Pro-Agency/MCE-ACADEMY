import {useAdminConfirm} from '../../components/layout/AdminConfirm';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { Users as UsersIcon, UserPlus, Search, Pencil, Trash2, KeyRound, ShieldCheck, Building2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { api } from '../../lib/api';
import { Avatar, Badge, Field, Modal, PageLoader, Spinner, Toggle } from '../../components/ui';
import { AccountStatusBadge, ResendInviteButton, useAccountStatuses } from '../../components/AccountStatus';
import { ROLE_LABELS, timeAgo } from '../../lib/utils';

const ROLE_TONES = { admin: 'navy', trainer: 'brand', learner: 'slate' };

const PAGE = {
  trainer: { title: 'Formateurs', subtitle: 'Les formateurs de chaque entreprise cliente : ils créent les cours et suivent leurs apprenants', button: 'Nouveau formateur' },
  learner: { title: 'Apprenants', subtitle: 'Tous les apprenants de la plateforme, toutes entreprises confondues', button: 'Nouvel apprenant' },
  '': { title: 'Utilisateurs', subtitle: 'Administrateurs, formateurs et apprenants', button: 'Nouvel utilisateur' },
};

export default function Users({ fixedRole = '' }) {
  const ask=useAdminConfirm();
  const { profile: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [params]=useSearchParams();
  const roleParam=params.get('role');
  const [role,setRole]=useState(fixedRole);
  useEffect(()=>setRole(fixedRole || (['trainer','learner','admin'].includes(roleParam)?roleParam:'')),[fixedRole,roleParam]);
  const [statusFilter,setStatusFilter]=useState('');
  const page = PAGE[fixedRole];
  const [companyId, setCompanyId] = useState('');
  const [modal, setModal] = useState(null);
  const { statuses, statusError, reloadStatuses } = useAccountStatuses();

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [u, c] = await Promise.all([
        db.from('profiles').select('*, company:companies!profiles_company_id_fkey(name)').order('created_at', { ascending: false }),
        db.from('companies').select('id, name').order('name'),
      ]);
      const problems = [];
      if (u.error) problems.push('Comptes : ' + u.error.message);
      if (c.error) problems.push('Entreprises : ' + c.error.message);
      setLoadError(problems.join(' | '));
      setUsers(u.error ? null : (u.data || []));
      setCompanies(c.error ? [] : (c.data || []));
    } catch (err) {
      setLoadError(err.message || String(err));
      setUsers(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      (users || []).filter((u) => {
        if (role && u.role !== role) return false;
        if(statusFilter && u.is_active !== (statusFilter==='active')) return false;
        if (companyId && u.company_id !== companyId) return false;
        const s = search.toLowerCase();
        return !s || `${u.full_name} ${u.email}`.toLowerCase().includes(s);
      }),
    [users, search, role, companyId,statusFilter]
  );

  const remove = async (u) => {
    if (!await ask(`Supprimer définitivement le compte de ${u.full_name} ?`)) return;
    try {
      await api(`/users/${u.id}`, { method: 'DELETE' });
      toast.success('Compte supprimé');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const reset = async (u) => {
    if (!await ask(`Envoyer à ${u.email} un e-mail pour choisir un nouveau mot de passe ?`)) return;
    try {
      await api(`/users/${u.id}/reset-password`, { method: 'POST' });
      toast.success(`E-mail de réinitialisation envoyé à ${u.email}.`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading && !users) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Organisation</p>
          <h1 className="page-title admin-page-title">{page.title}</h1>
          <p className="page-subtitle">{page.subtitle} · {filtered.length} compte(s).</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary"><UserPlus className="h-4 w-4" /> {page.button}</button>
      </div>

      {loadError && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex gap-2 font-bold"><AlertTriangle className="h-5 w-5" /> Erreur de chargement Supabase</div><p className="mt-1 break-words">{loadError}</p><p className="mt-2">Si une erreur CORS mentionne localhost:5174, redémarrez le frontend sur localhost:5173.</p><button className="btn-secondary mt-3" onClick={load}><RefreshCcw className="h-4 w-4" /> Réessayer</button></div>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-10" placeholder="Nom ou email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!fixedRole && <select className="input sm:w-44" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>}
        <select aria-label="Statut du compte" className="input sm:w-40" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">Tous les statuts</option><option value="active">Activés</option><option value="inactive">Désactivés</option></select>
        <select className="input sm:w-56" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="">Toutes les entreprises</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <section aria-label="Entreprises et comptes" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <button type="button" onClick={() => setCompanyId('')} className={`rounded-2xl border p-4 text-left ${!companyId ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-100' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2 font-semibold"><UsersIcon className="h-5 w-5" /> Toutes les entreprises</div>
          <p className="mt-2 text-sm text-slate-500">{(users || []).filter(u => !role || u.role === role).length} compte(s)</p>
        </button>
        {companies.map(c => <button key={c.id} type="button" onClick={() => setCompanyId(c.id)} className={`rounded-2xl border p-4 text-left ${companyId === c.id ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-100' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2 font-semibold"><Building2 className="h-5 w-5" /> {c.name}</div>
          <p className="mt-2 text-sm text-slate-500">{(users || []).filter(u => u.company_id === c.id && (!role || u.role === role)).length} compte(s) {role ? 'dans ce rôle' : 'rattachés'}</p>
        </button>)}
      </section>
      {!loading && !loadError && !filtered.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Aucun compte ne correspond aux filtres sélectionnés.</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className="table-th">Utilisateur</th>
              <th className="table-th">Rôle</th>
              <th className="table-th">Entreprise</th>
              <th className="table-th">Statut</th>
              <th className="table-th">Dernière connexion</th>
              <th className="table-th w-36" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50/60 ${!u.is_active ? 'opacity-60' : ''}`}>
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-900">
                        {u.role === 'learner' ? <Link to={`/admin/apprenants/${u.id}`} className="hover:text-brand-600 hover:underline">{u.full_name}</Link> : u.full_name}{' '}
                        {u.id === me.id && <span className="text-xs font-normal text-slate-400">(vous)</span>}
                      </p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td"><Badge tone={ROLE_TONES[u.role]} icon={u.role === 'admin' ? ShieldCheck : undefined}>{ROLE_LABELS[u.role]}</Badge></td>
                <td className="table-td text-slate-600">{u.company?.name || '—'}</td>
                <td className="table-td"><AccountStatusBadge status={statuses[u.id]} /></td>
                <td className="table-td text-slate-500">{timeAgo(u.last_seen_at)}</td>
                <td className="table-td">
                  <div className="flex justify-end">
                    <button onClick={() => setModal(u)} className="btn-ghost btn-sm" title="Modifier"><Pencil className="h-4 w-4" /></button>
                    <ResendInviteButton userId={u.id} status={statuses[u.id]} onDone={reloadStatuses} />
                    <button onClick={() => reset(u)} className="btn-ghost btn-sm" title="Envoyer un lien de réinitialisation du mot de passe" aria-label="Envoyer un lien de réinitialisation du mot de passe"><KeyRound className="h-4 w-4" /></button>
                    {u.id !== me.id && <button onClick={() => remove(u)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {statusError && <p className="text-xs text-slate-500">Statuts des comptes indisponibles : {statusError}</p>}
      {modal && <UserModal user={modal === 'new' ? null : modal} defaultRole={role} companies={companies} isSelf={modal?.id === me.id} onClose={() => setModal(null)} onSaved={() => { load(); reloadStatuses(); }} />}
    </div>
  );
}

function UserModal({ user, defaultRole, companies, isSelf, onClose, onSaved }) {
  const isNew = !user;
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    job_title: user?.job_title || '',
    role: user?.role || defaultRole || 'learner',
    company_id: user?.company_id || companies[0]?.id || '',
    is_active: user?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, company_id: form.role === 'admin' ? null : form.company_id };
      if (isNew) {
        const res = await api('/users', { method: 'POST', body });
        toast.success(`Invitation envoyée à ${res.profile.email}. La personne choisira son mot de passe en ouvrant le lien.`, { duration: 6000 });
      } else {
        if (isSelf) {
          delete body.role;
          delete body.is_active;
          delete body.company_id;
        }
        await api(`/users/${user.id}`, { method: 'PATCH', body });
        toast.success('Compte mis à jour');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? 'Nouvel utilisateur' : `Modifier ${user.full_name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet *"><input required className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} /></Field>
          <Field label="Email *"><input required type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Rôle">
            <select className="input" value={form.role} disabled={isSelf} onChange={(e) => set('role', e.target.value)}>
              <option value="learner">Apprenant — suit les cours de son entreprise</option>
              <option value="trainer">Formateur — gère l’espace de son entreprise</option>
              <option value="admin">Administrateur — gère toute la plateforme</option>
            </select>
          </Field>
          {form.role !== 'admin' && (
            <Field label="Entreprise">
              <select className="input" required value={form.company_id} disabled={isSelf} onChange={(e) => set('company_id', e.target.value)}>
                <option value="">— Choisir —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Poste / fonction"><input className="input" value={form.job_title} onChange={(e) => set('job_title', e.target.value)} /></Field>
        </div>
        {isNew && <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">Un e-mail d’invitation sera envoyé à cette adresse. La personne confirmera son adresse et choisira elle-même son mot de passe.</p>}
        {!isNew && !isSelf && <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label={form.is_active ? 'Compte actif' : 'Compte désactivé'} />}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
          <button className="btn-primary" disabled={saving}>{saving ? <Spinner className="text-white" /> : isNew ? 'Envoyer l’invitation' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  );
}
