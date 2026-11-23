/* Redirige l'apprenant vers son test de profil tant que l'espace complet n'est pas ouvert */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isTestOnly, TEST_ONLY_PATHS } from '../lib/learnerSpace';

export default function LearnerGate() {
  const { company, isLearner } = useAuth();
  const { pathname } = useLocation();
  if (isLearner && isTestOnly(company) && !TEST_ONLY_PATHS.includes(pathname)) return <Navigate to="/app/mon-profil" replace />;
  return <Outlet />;
}
