import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { UserPlus, Search, Pencil, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { api } from '../../lib/api';
import { Avatar, Badge, CredentialBox, Field, Modal, PageLoader, Spinner, Toggle } from '../../components/ui';
import { ROLE_LABELS, timeAgo } from '../../lib/utils';

const ROLE_TONES = { admin: 'navy', trainer: 'brand', learner: 'slate' };

const PAGE = {
  trainer: { title: 'Formateurs', subtitle: 'Les formateurs de chaque entreprise cliente : ils créent les cours et suivent leurs apprenants', button: 'Nouveau formateur' },
  learner: { title: 'Apprenants', subtitle: 'Tous les apprenants de la plateforme, toutes entreprises confondues', button: 'Nouvel apprenant' },
  '': { title: 'Tous les comptes', subtitle: 'Administrateurs, formateurs et apprenants', button: 'Nouvel utilisateur' },
};

export default function Users({ fixedRole = '' }) {
  const { profile: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(fixedRole);
  useEffect(() => setRole(fixedRole), [fixedRole]);
  const page = PAGE[fixedRole];
  const [companyId, setCompanyId] = useState('');
  const [modal, setModal] = useState(null);
  const [credentials, setCredentials] = useState(null);

  const load = async () => {
    const [{ data: u }, { data: c }] = await Promise.all([
      db.from('profiles').select('*, company:companies!profiles_company_id_fkey(name)').order('created_at', { ascending: false }),
      db.from('companies').select('id, name').order('name'),
    ]);
    setUsers(u || []);
    setCompanies(c || []);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      (users || []).filter((u) => {
        if (role && u.role !== role) return false;
        if (companyId && u.company_id !== companyId) return false;
        const s = search.toLowerCase();
        return !s || `${u.full_name} ${u.email}`.toLowerCase().includes(s);
      }),
    [users, search, role, companyId]
  );

  const remove = async (u) => {
    if (!confirm(`Supprimer définitivement le compte de ${u.full_name} ?`)) return;
    try {
      await api(`/users/${u.id}`, { method: 'DELETE' });
      toast.success('Compte supprimé');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const reset = async (u) => {
    try {
      const res = await api(`/users/${u.id}/reset-password`, { method: 'POST' });
      setCredentials({ email: u.email, password: res.temporary_password });
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!users) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Organisation</p>
          <h1 className="page-title">{page.title}</h1>
          <p className="page-subtitle">{page.subtitle} · {filtered.length} compte(s).</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary"><UserPlus className="h-4 w-4" /> {page.button}</button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-10" placeholder="Nom ou email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!fixedRole && <select className="input sm:w-44" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>}
        <select className="input sm:w-56" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          <option value="">Toutes les entreprises</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className="table-th">Utilisateur</th>
              <th className="table-th">Rôle</th>
              <th className="table-th">Entreprise</th>
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
                <td className="table-td text-slate-500">{timeAgo(u.last_seen_at)}</td>
                <td className="table-td">
                  <div className="flex justify-end">
                    <button onClick={() => setModal(u)} className="btn-ghost btn-sm" title="Modifier"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => reset(u)} className="btn-ghost btn-sm" title="Nouveau mot de passe"><KeyRound className="h-4 w-4" /></button>
                    {u.id !== me.id && <button onClick={() => remove(u)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <UserModal user={modal === 'new' ? null : modal} defaultRole={fixedRole} companies={companies} isSelf={modal?.id === me.id} onClose={() => setModal(null)} onSaved={load} onCredentials={setCredentials} />}
      <Modal open={!!credentials} onClose={() => setCredentials(null)} title="Identifiants" size="sm">
        {credentials && <CredentialBox email={credentials.email} password={credentials.password} />}
      </Modal>
    </div>
  );
}

function UserModal({ user, defaultRole, companies, isSelf, onClose, onSaved, onCredentials }) {
  const isNew = !user;
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    job_title: user?.job_title || '',
    role: user?.role || defaultRole || 'learner',
    company_id: user?.company_id || companies[0]?.id || '',
    password: '',
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
        toast.success('Compte créé');
        onCredentials({ email: res.profile.email, password: res.temporary_password || form.password });
      } else {
        if (!body.password) delete body.password;
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
          <Field label={isNew ? 'Mot de passe' : 'Nouveau mot de passe'} hint={isNew ? 'Vide = généré automatiquement' : 'Laisser vide pour ne pas changer'}>
            <input className="input" minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} />
          </Field>
        </div>
        {!isNew && !isSelf && <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label={form.is_active ? 'Compte actif' : 'Compte désactivé'} />}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
          <button className="btn-primary" disabled={saving}>{saving ? <Spinner className="text-white" /> : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  );
}
