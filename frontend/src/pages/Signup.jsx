/* Inscription d'un apprenant avec le code de son entreprise.
   Le rôle « apprenant » et l'entreprise sont fixés par la base (trigger handle_new_user,
   supabase/002_test_profil.sql) : le code est vérifié côté serveur, jamais côté navigateur. */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Lock, Mail, User } from 'lucide-react';
import { db } from '../lib/db';
import { Spinner } from '../components/ui';
import Logo from '../components/layout/Logo';

const NETWORK_MSG = 'Impossible de joindre le serveur. Vérifiez votre connexion internet, rechargez la page (Ctrl + F5) et réessayez.';
const isNetwork = (e) => e && (/failed to fetch|network|load failed/i.test(e.message || '') || e.name === 'AuthRetryableFetchError');

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', join_code: (params.get('code') || '').toUpperCase() });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'join_code' ? e.target.value.toUpperCase() : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (form.password !== form.confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    // Vérifie le code avant de créer le compte (fonction publique, ne révèle que le nom de l'entreprise)
    const { data: companyName, error: codeErr } = await db.rpc('company_for_join_code', { p_code: form.join_code.trim() }).catch((e) => ({ error: e }));
    if (isNetwork(codeErr)) {
      setLoading(false);
      return setError(NETWORK_MSG);
    }
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
    if (err) {
      setLoading(false);
      if (isNetwork(err)) return setError(NETWORK_MSG);
      return setError(err.message.includes('registered') ? 'Un compte existe déjà avec cet email : connectez-vous.' : err.message);
    }
    // Le compte est créé : retour à la page de connexion avec un message de confirmation
    if (data.session) await db.auth.signOut();
    setLoading(false);
    navigate('/login', { replace: true, state: { created: { email: form.email.trim(), company: companyName, confirmEmail: !data.session } } });
  };

  return (
    <div className="public-auth public-auth-signup">
      <Logo />
      <div className="public-auth-card">
          <div>
            <h1>Créer mon compte.</h1>
            <p className="public-auth-intro">Inscrivez-vous, puis passez votre <b>test de profil professionnel</b> (20 minutes chronométrées).</p>
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
              <button type="submit" disabled={loading} className="public-button public-auth-submit">
                {loading ? <Spinner className="text-white" /> : 'Créer mon compte'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">Déjà inscrit ? <Link to="/login" className="font-semibold text-brand-600">Se connecter</Link></p>
          </div>
      </div>
      <Link to="/" className="public-auth-return">Retour au site</Link>
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
