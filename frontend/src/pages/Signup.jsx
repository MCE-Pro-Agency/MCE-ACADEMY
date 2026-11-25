/* Inscription d'un apprenant avec le code de son entreprise.
   Le rôle « apprenant » et l'entreprise sont fixés par la base (trigger handle_new_user,
   supabase/002_test_profil.sql) : le code est vérifié côté serveur, jamais côté navigateur. */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Lock, Mail, MailCheck, User } from 'lucide-react';
import { db } from '../lib/db';
import { Spinner } from '../components/ui';
import Logo from '../components/layout/Logo';

const NETWORK_MSG = 'Impossible de joindre le serveur. Vérifiez votre connexion internet, rechargez la page (Ctrl + F5) et réessayez.';
const isNetwork = (e) => e && (/failed to fetch|network|load failed/i.test(e.message || '') || e.name === 'AuthRetryableFetchError');

const STEPS = [
  ['Créez votre compte', 'Avec le code transmis par votre entreprise.'],
  ['Confirmez votre adresse e-mail', 'Un lien personnel vous est envoyé.'],
  ['Passez votre test de profil', '20 minutes pour révéler vos forces.'],
];

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '', join_code: (params.get('code') || '').toUpperCase() });
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: k === 'join_code' ? e.target.value.toUpperCase() : e.target.value });

  useEffect(() => {
    let active = true;
    db.rpc('public_signup_companies').then(({ data, error: err }) => {
      if (!active) return;
      setCompanies(err ? [] : (data || []));
      setLoadingCompanies(false);
    }).catch(() => { if (active) { setCompanies([]); setLoadingCompanies(false); } });
    return () => { active = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!companyId) return setError('Sélectionnez votre entreprise.');
    if (form.password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (form.password !== form.confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    // La base valide la paire entreprise + code ; le trigger conserve l'autorité finale.
    const { data: match, error: codeErr } = await db.rpc('company_code_matches', { p_company: companyId, p_code: form.join_code.trim() }).catch((err) => ({ error: err }));
    if (isNetwork(codeErr)) { setLoading(false); return setError(NETWORK_MSG); }
    if (codeErr || !match) {
      setLoading(false);
      return setError('Le code ne correspond pas à l’entreprise sélectionnée. Vérifiez-le auprès de votre formateur.');
    }
    const { data, error: err } = await db.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.full_name.trim(), join_code: form.join_code.trim() },
        emailRedirectTo: `${window.location.origin}/login?confirme=1`,
      },
    }).catch((e2) => ({ error: e2 }));
    if (err) {
      setLoading(false);
      if (isNetwork(err)) return setError(NETWORK_MSG);
      return setError(/registered|already/i.test(err.message) ? 'Un compte existe déjà avec cet email : connectez-vous.' : err.message);
    }
    setLoading(false);
    // Confirmation par e-mail obligatoire : pas de session tant que le lien n'a pas été ouvert.
    if (!data.session) return setCheckEmail(true);
    // Si la confirmation est désactivée dans Supabase : retour à la connexion avec un message.
    await db.auth.signOut();
    const companyName = companies.find((c) => c.id === companyId)?.name;
    navigate('/login', { replace: true, state: { created: { email: form.email.trim(), company: companyName, confirmEmail: false } } });
  };

  return (
    <div className="public-auth public-auth-login public-auth-signup">
      <div className="public-auth-form">
        <Logo />
        <div className="public-auth-card">
          {checkEmail ? (
            <div role="status">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><MailCheck className="h-7 w-7" aria-hidden="true" /></span>
              <h1 className="mt-6">Vérifiez votre boîte mail.</h1>
              <p className="public-auth-intro">Un lien de confirmation a été envoyé à <b>{form.email}</b>. Cliquez dessus pour activer votre compte, puis connectez-vous pour passer votre test de profil.</p>
              <p className="mt-4 text-sm text-slate-500">Rien reçu ? Regardez dans les courriers indésirables. Vous pourrez demander un nouveau lien depuis la page de connexion.</p>
              <Link to="/login" state={{ pendingEmail: form.email.trim() }} className="public-button public-auth-submit mt-8">Aller à la connexion</Link>
            </div>
          ) : (
            <div>
              <h1>Créer mon compte.</h1>
              <p className="public-auth-intro">Inscrivez-vous, confirmez votre adresse e-mail, puis passez votre <b>test de profil professionnel</b> (20 minutes chronométrées).</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="label" htmlFor="signup-company">Votre entreprise</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <select id="signup-company" required className="input pl-10" value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={loadingCompanies}>
                      <option value="">{loadingCompanies ? 'Chargement des entreprises…' : 'Sélectionnez votre entreprise'}</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {!loadingCompanies && !companies.length && <p className="mt-1 text-xs text-red-700">Aucune entreprise disponible pour le moment. Contactez MCE Academy.</p>}
                </div>
                <Field icon={Lock} id="signup-code" label="Code de votre entreprise" hint="Donné par votre formateur">
                  <input id="signup-code" required className="input pl-10 tracking-wide" autoComplete="off" placeholder="Saisissez votre code" value={form.join_code} onChange={set('join_code')} />
                </Field>
                <Field icon={User} id="signup-name" label="Prénom et nom">
                  <input id="signup-name" required className="input pl-10" autoComplete="name" value={form.full_name} onChange={set('full_name')} />
                </Field>
                <Field icon={Mail} id="signup-email" label="Email professionnel">
                  <input id="signup-email" required type="email" className="input pl-10" autoComplete="email" placeholder="prenom.nom@entreprise.com" value={form.email} onChange={set('email')} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field icon={Lock} id="signup-password" label="Mot de passe" hint="8 caractères min.">
                    <input id="signup-password" required minLength={8} type="password" className="input pl-10" autoComplete="new-password" value={form.password} onChange={set('password')} />
                  </Field>
                  <Field icon={Lock} id="signup-confirm" label="Confirmation">
                    <input id="signup-confirm" required type="password" className="input pl-10" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
                  </Field>
                </div>
                {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
                <button type="submit" disabled={loading} className="public-button public-auth-submit">
                  {loading ? <Spinner className="text-white" /> : 'Créer mon compte'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500">Déjà inscrit ? <Link to="/login" className="font-semibold text-brand-600">Se connecter</Link></p>
            </div>
          )}
        </div>
        <Link to="/" className="public-auth-return">Retour au site</Link>
      </div>

      {/* Visuel */}
      <div className="public-auth-visual">
        <div>
          <h2 className="public-display">Votre parcours<br /> commence<br /><em>ici.</em></h2>
          <ol className="public-auth-steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}><span>{i + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, id, label, hint, children }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}{hint && <span className="ml-1 font-normal text-slate-400">· {hint}</span>}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
