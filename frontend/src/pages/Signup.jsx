/* Inscription d'un apprenant avec le code de son entreprise.
   Le rôle « apprenant » et l'entreprise sont fixés par la base (trigger handle_new_user,
   supabase/002_test_profil.sql) : le code est vérifié côté serveur, jamais côté navigateur. */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Building2, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../lib/db';
import { Spinner } from '../components/ui';
import Logo from '../components/layout/Logo';

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', join_code: (params.get('code') || '').toUpperCase() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'join_code' ? e.target.value.toUpperCase() : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (form.password !== form.confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    // Vérifie le code avant de créer le compte (fonction publique, ne révèle que le nom de l'entreprise)
    const { data: companyName, error: codeErr } = await db.rpc('company_for_join_code', { p_code: form.join_code.trim() });
    if (codeErr || !companyName) {
      setLoading(false);
      return setError('Code d’entreprise inconnu. Vérifiez-le auprès de votre formateur.');
    }
    const { data, error: err } = await db.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.full_name.trim(), join_code: form.join_code.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setLoading(false);
    if (err) return setError(err.message.includes('registered') ? 'Un compte existe déjà avec cet email : connectez-vous.' : err.message);
    if (!data.session) return setCheckEmail(true); // confirmation par email activée dans Supabase
    toast.success(`Bienvenue chez ${companyName} !`);
    navigate('/app/mon-profil', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-6 py-8">
      <Logo />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        {checkEmail ? (
          <div className="card p-8 text-center">
            <p className="text-4xl">📬</p>
            <h1 className="mt-3 text-2xl font-bold text-navy-900">Vérifiez votre boîte mail</h1>
            <p className="mt-2 text-sm text-slate-500">Un lien de confirmation a été envoyé à <b>{form.email}</b>. Cliquez dessus, puis connectez-vous pour passer votre test de profil.</p>
            <Link to="/login" className="btn-primary mt-6">Aller à la connexion</Link>
          </div>
        ) : (
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-navy-900">Créer mon compte</h1>
            <p className="mt-1 text-sm text-slate-500">Inscrivez-vous, puis passez votre <b>test de profil professionnel</b> (environ 25 minutes).</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field icon={Building2} label="Code de votre entreprise" hint="Donné par votre formateur">
                <input required className="input pl-10 font-mono tracking-widest" placeholder="EX. VIGILUS2026" value={form.join_code} onChange={set('join_code')} />
              </Field>
              <Field icon={User} label="Prénom et nom">
                <input required className="input pl-10" autoComplete="name" value={form.full_name} onChange={set('full_name')} />
              </Field>
              <Field icon={Mail} label="Email professionnel">
                <input required type="email" className="input pl-10" autoComplete="email" placeholder="prenom.nom@entreprise.com" value={form.email} onChange={set('email')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={Lock} label="Mot de passe">
                  <input required type="password" className="input pl-10" autoComplete="new-password" value={form.password} onChange={set('password')} />
                </Field>
                <Field icon={Lock} label="Confirmation">
                  <input required type="password" className="input pl-10" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
                </Field>
              </div>
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <Spinner className="text-white" /> : <>Créer mon compte <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">Déjà inscrit ? <Link to="/login" className="font-semibold text-brand-600">Se connecter</Link></p>
          </div>
        )}
      </div>
      <Link to="/" className="text-center text-xs text-slate-400 hover:text-navy-700">← Retour au site</Link>
    </div>
  );
}

function Field({ icon: Icon, label, hint, children }) {
  return (
    <div>
      <label className="label">{label}{hint && <span className="ml-1 font-normal text-slate-400">· {hint}</span>}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        {children}
      </div>
    </div>
  );
}
