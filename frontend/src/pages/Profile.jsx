import { useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, KeyRound, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, uploadMedia } from '../lib/db';
import { Avatar, Badge, Field } from '../components/ui';
import { ROLE_LABELS, formatDate } from '../lib/utils';

export default function Profile() {
  const { profile, company, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: profile?.full_name || '', job_title: profile?.job_title || '' });
  const [pwd, setPwd] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await db.from('profiles').update(form).eq('id', profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Profil mis à jour');
    refreshProfile();
  };

  const changeAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadMedia(file, 'avatars');
      await db.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
      toast.success('Photo mise à jour');
      refreshProfile();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.password.length < 8) return toast.error('8 caractères minimum.');
    if (pwd.password !== pwd.confirm) return toast.error('Les mots de passe ne correspondent pas.');
    const { error } = await db.auth.updateUser({ password: pwd.password });
    if (error) return toast.error(error.message);
    setPwd({ password: '', confirm: '' });
    toast.success('Mot de passe modifié');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Mon profil</h1>
        <p className="page-subtitle">Gérez vos informations personnelles et votre mot de passe.</p>
      </div>

      <div className="card flex flex-col items-center gap-5 p-6 sm:flex-row">
        <label className="group relative cursor-pointer">
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size="xl" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy-900/50 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-6 w-6 text-white" />
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={changeAvatar} />
        </label>
        <div className="text-center sm:text-left">
          <p className="text-xl font-bold text-navy-900">{profile?.full_name}</p>
          <p className="text-sm text-slate-500">{profile?.email}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge tone="navy">{ROLE_LABELS[profile?.role]}</Badge>
            {company && <Badge tone="brand">{company.name}</Badge>}
            <Badge>Membre depuis {formatDate(profile?.created_at, { month: 'long', year: 'numeric' })}</Badge>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h2 className="font-bold text-navy-900">Informations</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet">
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label="Poste / fonction">
            <input className="input" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={saving}><Save className="h-4 w-4" /> Enregistrer</button>
        </div>
      </form>

      <form onSubmit={changePassword} className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-bold text-navy-900"><KeyRound className="h-4 w-4" /> Mot de passe</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nouveau mot de passe">
            <input type="password" className="input" value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} />
          </Field>
          <Field label="Confirmation">
            <input type="password" className="input" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end">
          <button className="btn-secondary">Changer le mot de passe</button>
        </div>
      </form>
    </div>
  );
}
