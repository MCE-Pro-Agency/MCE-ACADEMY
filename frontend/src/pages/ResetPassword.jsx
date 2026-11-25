/* Choix du mot de passe après un lien reçu par e-mail.
   - /activer       : invitation envoyée par MCE Academy (l'adresse est confirmée en ouvrant le lien)
   - /reinitialiser : « Mot de passe oublié »
   Supabase ouvre une session à partir du lien ; si le lien est invalide ou expiré, on l'explique. */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/layout/Logo';
import { Spinner } from '../components/ui';
import { db } from '../lib/db';
import { linkErrorMessage } from '../lib/authLinks';

export default function ResetPassword({ mode = 'reset' }) {
  const activation = mode === 'activation';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fromLink = linkErrorMessage(window.location);
    if (fromLink) { setLinkError(fromLink); setChecking(false); return undefined; }
    let active = true;
    // Le client Supabase lit le jeton présent dans l'URL ; on attend la session qui en résulte.
    const { data: sub } = db.auth.onAuthStateChange((_event, session) => {
      if (active && session) { setHasSession(true); setChecking(false); }
    });
    db.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setHasSession(true);
      setTimeout(() => { if (active) setChecking(false); }, data.session ? 0 : 1500);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('8 caractères minimum.');
    if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas.');
    setLoading(true);
    const { error } = await db.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(activation ? 'Compte activé ! Bienvenue sur MCE Academy.' : 'Mot de passe mis à jour.');
    navigate(activation ? '/app' : '/login', { replace: true });
  };

  const invalid = !checking && (linkError || !hasSession);

  return (
    <div className="public-auth">
      <div className="public-auth-form">
        <Logo />
        <div className="public-auth-card">
          {checking ? (
            <p className="flex items-center gap-3 text-slate-500"><Spinner /> Vérification du lien…</p>
          ) : invalid ? (
            <div role="alert">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-7 w-7" aria-hidden="true" /></span>
              <h1 className="mt-6">Lien invalide ou expiré.</h1>
              <p className="public-auth-intro">{linkError || 'Ce lien a déjà été utilisé ou n’est plus valable.'}</p>
              <p className="mt-4 text-sm text-slate-500">
                {activation
                  ? 'Demandez à votre formateur ou à MCE Academy de vous renvoyer une invitation.'
                  : 'Demandez un nouveau lien depuis la page de connexion (« Mot de passe oublié »).'}
              </p>
              <Link to="/login" className="public-button public-auth-submit mt-8">Aller à la connexion</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h1>{activation ? 'Activez votre compte.' : 'Nouveau mot de passe.'}</h1>
              <p className="public-auth-intro">
                {activation
                  ? 'Votre adresse e-mail est confirmée. Choisissez votre mot de passe pour accéder à votre espace MCE Academy.'
                  : 'Choisissez un nouveau mot de passe d’au moins 8 caractères.'}
              </p>
              <div className="mt-8 space-y-5">
                <div>
                  <label className="label" htmlFor="new-password">Mot de passe</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input id="new-password" type="password" required minLength={8} autoComplete="new-password" className="input pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="confirm-password">Confirmation</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input id="confirm-password" type="password" required autoComplete="new-password" className="input pl-10" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  </div>
                </div>
                <button className="public-button public-auth-submit" disabled={loading}>
                  {loading ? <Spinner className="text-white" /> : activation ? 'Activer mon compte' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}
        </div>
        <Link to="/" className="public-auth-return">Retour au site</Link>
      </div>
    </div>
  );
}
