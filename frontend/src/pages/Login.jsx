import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, Lock, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/layout/Logo';
import { Spinner } from '../components/ui';
import { useAuth, homePathForRole } from '../contexts/AuthContext';
import { db } from '../lib/db';
import { BRAND } from '../config';
import { confirmRedirect, linkErrorMessage, RESEND_DELAY } from '../lib/authLinks';

export default function Login() {
  const { signIn, session, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const created = location.state?.created; // arrivée depuis l'inscription
  const [email, setEmail] = useState(created?.email || location.state?.pendingEmail || '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Retour depuis un lien e-mail : adresse confirmée, ou lien invalide / expiré.
  const [confirmed] = useState(() => new URLSearchParams(location.search).get('confirme') === '1');
  const [linkError] = useState(() => linkErrorMessage(window.location));

  useEffect(() => {
    if (!cooldown) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (!email.trim() || cooldown) return;
    const { error: err } = await db.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: confirmRedirect() } });
    setCooldown(RESEND_DELAY);
    if (err) return toast.error(/rate|seconds/i.test(err.message) ? 'Patientez un peu avant de redemander un lien.' : err.message);
    toast.success('Nouveau lien de confirmation envoyé.');
  };

  useEffect(() => {
    if (session && profile) {
      const from = location.state?.from;
      navigate(from && from !== '/login' ? from : homePathForRole(profile.role), { replace: true });
    }
  }, [session, profile, navigate, location.state]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotConfirmed(false);
    setLoading(true);
    try {
      if (forgot) {
        const { error: err } = await db.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reinitialiser`,
        });
        if (err) throw err;
        // Message neutre : on ne révèle pas si un compte existe pour cette adresse.
        toast.success('Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.');
        setForgot(false);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
      if (err.code === 'email_not_confirmed') setNotConfirmed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-auth public-auth-login">
      {/* Formulaire */}
      <div className="public-auth-form">
        <Logo />
        <div className="public-auth-card">
          <div>
          <h1>{forgot ? 'Mot de passe oublié' : 'Bon retour.'}</h1>
          <p className="public-auth-intro">
            {forgot ? 'Recevez un lien pour choisir un nouveau mot de passe.' : 'Connectez-vous à votre espace de formation.'}
          </p>

          {confirmed && !forgot && (
            <div role="status" className="mt-6 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <p><b>Adresse e-mail confirmée.</b> Connectez-vous pour accéder à votre espace.</p>
            </div>
          )}
          {linkError && !forgot && (
            <div role="alert" className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <p><b>{linkError}</b> Saisissez votre adresse puis connectez-vous : vous pourrez demander un nouveau lien.</p>
            </div>
          )}
          {created && !forgot && (
            <div className="mt-6 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p>
                <b>Votre compte a bien été créé{created.company ? ` chez ${created.company}` : ''} !</b>{' '}
                {created.confirmEmail
                  ? <>Cliquez d’abord sur le lien envoyé à <b>{created.email}</b>, puis connectez-vous.</>
                  : 'Connectez-vous avec votre mot de passe pour passer votre test de profil.'}
              </p>
            </div>
          )}
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="email">Email professionnel</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input id="email" type="email" required autoComplete="email" className="input pl-10" placeholder="prenom.nom@entreprise.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {!forgot && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="label" htmlFor="password">Mot de passe</label>
                  <button type="button" onClick={() => setForgot(true)} className="mb-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input id="password" type={show ? 'text' : 'password'} required autoComplete="current-password" className="input px-10" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-2.5 text-slate-400 hover:text-navy-700" aria-label="Afficher le mot de passe">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{error}</p>
                {notConfirmed && (
                  <button type="button" onClick={resend} disabled={!!cooldown} className="mt-2 font-semibold text-brand-700 underline underline-offset-2 disabled:text-slate-400 disabled:no-underline">
                    {cooldown ? `Nouveau lien possible dans ${cooldown} s` : 'Renvoyer le lien de confirmation'}
                  </button>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="public-button public-auth-submit">
              {loading ? <Spinner className="text-white" /> : forgot ? 'Envoyer le lien' : 'Se connecter'}
            </button>
            {forgot && (
              <button type="button" onClick={() => setForgot(false)} className="btn-ghost w-full">Retour à la connexion</button>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Pas encore de compte ? <Link to="/inscription" className="font-semibold text-brand-600">Inscrivez-vous avec le code de votre entreprise</Link>
          </p>
          <p className="mt-2 text-center text-xs text-slate-400">
            Un souci d’accès ? <a className="font-semibold text-brand-600" href={`mailto:${BRAND.contactEmail}`}>Contactez-nous</a>
          </p>
          </div>
        </div>
        <Link to="/" className="public-auth-return">Retour au site</Link>
      </div>

      {/* Visuel */}
      <div className="public-auth-visual">
        <div>
          <h2 className="public-display">
            Se découvrir.<br /> S’exprimer.<br /> Agir.<br /><em>Progresser.</em>
          </h2>
          <ul>
            {['Vos cours et exercices au même endroit', 'Votre progression en temps réel', 'Les retours de votre formateur'].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
