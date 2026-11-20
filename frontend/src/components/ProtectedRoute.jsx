import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homePathForRole } from '../contexts/AuthContext';
import { PageLoader } from './ui';

/**
 * Protège une zone de l'application.
 * @param roles  rôles autorisés
 * @param needsCompany  la zone nécessite une entreprise active (espace formateur pour un admin)
 */
export default function ProtectedRoute({ roles, needsCompany = false }) {
  const { session, profile, loading, activeCompanyId, isAdmin } = useAuth();
  const location = useLocation();

  if (loading || (session && !profile)) return <PageLoader label="Connexion à votre espace…" />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile.is_active) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to={homePathForRole(profile.role)} replace />;
  if (needsCompany && isAdmin && !activeCompanyId && location.pathname !== '/formateur/choisir') {
    return <Navigate to="/admin/entreprises" replace state={{ needCompany: true }} />;
  }
  return <Outlet />;
}
