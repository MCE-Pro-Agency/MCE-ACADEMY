import { Link } from 'react-router-dom';
import Logo from '../components/layout/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-6 text-center">
      <Logo />
      <p className="font-display text-7xl font-extrabold text-brand-500">404</p>
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Page introuvable</h1>
        <p className="mt-1 text-slate-500">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      </div>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  );
}
