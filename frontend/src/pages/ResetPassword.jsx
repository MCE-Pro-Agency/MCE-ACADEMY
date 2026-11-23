import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/layout/Logo';
import { db } from '../lib/db';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('8 caractères minimum.');
    if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas.');
    setLoading(true);
    const { error } = await db.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Mot de passe mis à jour !');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form onSubmit={submit} className="card w-full max-w-md space-y-5 p-8">
        <Logo />
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-slate-500">Choisissez un mot de passe d’au moins 8 caractères.</p>
        </div>
        <input type="password" className="input" placeholder="Nouveau mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" className="input" placeholder="Confirmer" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className="btn-primary w-full" disabled={loading}>Enregistrer</button>
      </form>
    </div>
  );
}
