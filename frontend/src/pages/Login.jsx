import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/layout/Logo';
import { Spinner } from '../components/ui';
import { useAuth, homePathForRole } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BRAND } from '../config';

export default function Login() {
  const { signIn, session, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (session && profile) {
      const from = location.state?.from;
      navigate(from && from !== '/login' ? from : homePathForRole(profile.role), { replace: true });
    }
  }, [session, profile, navigate, location.state]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (forgot) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reinitialiser`,
        });
        if (err) throw err;
        toast.success('Email de réinitialisation envoyé.');
        setForgot(false);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Formulaire */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-bold text-navy-900">{forgot ? 'Mot de passe oublié' : 'Bon retour 👋'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {forgot ? 'Recevez un lien pour choisir un nouveau mot de passe.' : 'Connectez-vous à votre espace de formation.'}
          </p>

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

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Spinner className="text-white" /> : forgot ? 'Envoyer le lien' : <>Se connecter <ArrowRight className="h-4 w-4" /></>}
            </button>
            {forgot && (
              <button type="button" onClick={() => setForgot(false)} className="btn-ghost w-full">Retour à la connexion</button>
            )}
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Votre compte est créé par votre formateur ou par MCE Academy.<br />
            Pas encore d’accès ? <a className="font-semibold text-brand-600" href={`mailto:${BRAND.contactEmail}`}>Contactez-nous</a>
          </p>
        </div>
        <Link to="/" className="text-center text-xs text-slate-400 hover:text-navy-700">← Retour au site</Link>
      </div>

      {/* Visuel */}
      <div className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #2B9FDC 0, transparent 45%), radial-gradient(circle at 70% 80%, #186898 0, transparent 40%)' }} />
        <div className="relative flex h-full flex-col justify-center px-16">
          <img src="/logo.png" alt="" className="mb-10 h-24 w-24 rounded-3xl bg-white p-2" />
          <h2 className="max-w-md text-4xl font-extrabold leading-tight text-white">
            Se découvrir.<br /> S’exprimer.<br /> Agir. <span className="text-brand-400">Progresser.</span>
          </h2>
          <ul className="mt-10 space-y-4 text-navy-100">
            {['Vos cours et exercices au même endroit', 'Votre progression en temps réel', 'Les retours de votre formateur'].map((t) => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-brand-400" /> {t}</li>
            ))}
          </ul>
          <div className="mt-12 h-1 w-16 rounded-full bg-gold-500" />
        </div>
      </div>
    </div>
  );
}
