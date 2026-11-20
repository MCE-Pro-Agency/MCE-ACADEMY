import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, UserCircle, Users, GraduationCap, ClipboardCheck,
  Megaphone, Building2, ShieldCheck, LogOut, Menu, X, Eye, Settings, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn, ROLE_LABELS } from '../../lib/utils';
import { Avatar } from '../ui';
import Logo from './Logo';

const NAV = {
  learner: [
    { to: '/app', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/app/catalogue', label: 'Mes formations', icon: BookOpen },
    { to: '/app/notes', label: 'Mes notes', icon: Award },
    { to: '/app/profil', label: 'Mon profil', icon: UserCircle },
  ],
  trainer: [
    { to: '/formateur', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
    { to: '/formateur/apprenants', label: 'Apprenants', icon: Users },
    { to: '/formateur/cours', label: 'Cours & modules', icon: GraduationCap },
    { to: '/formateur/corrections', label: 'Corrections', icon: ClipboardCheck },
    { to: '/formateur/annonces', label: 'Annonces', icon: Megaphone },
    { to: '/formateur/entreprise', label: 'Mon entreprise', icon: Settings },
  ],
  admin: [
    { to: '/admin', label: "Vue d'ensemble", icon: LayoutDashboard, end: true },
    { to: '/admin/entreprises', label: 'Entreprises', icon: Building2 },
    { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: ShieldCheck },
  ],
};

const AREA_TITLES = { learner: 'Espace apprenant', trainer: 'Espace formateur', admin: 'Administration' };

export default function AppLayout({ area }) {
  const { profile, company, isAdmin, isTrainer, signOut, activeCompanyId, setActiveCompanyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (isAdmin) supabase.from('companies').select('id, name').order('name').then(({ data }) => setCompanies(data || []));
  }, [isAdmin]);

  const items = NAV[area] || [];
  const activeCompanyName = isAdmin ? companies.find((c) => c.id === activeCompanyId)?.name : company?.name;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const Sidebar = (
    <aside className="flex h-full w-72 flex-col bg-navy-900 text-navy-100">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo to="/" dark />
        <button className="rounded-lg p-1 text-navy-200 hover:bg-navy-800 lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-navy-800/70 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-300">{AREA_TITLES[area]}</p>
        {area === 'trainer' && isAdmin ? (
          <div className="relative mt-1.5">
            <select
              value={activeCompanyId || ''}
              onChange={(e) => setActiveCompanyId(e.target.value || null)}
              className="w-full appearance-none rounded-lg border-0 bg-navy-700 py-1.5 pl-2.5 pr-8 text-sm font-semibold text-white focus:ring-2 focus:ring-brand-400"
            >
              <option value="">— Choisir une entreprise —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-navy-200" />
          </div>
        ) : (
          <p className="mt-0.5 truncate text-sm font-semibold text-white">{area === 'admin' ? 'Plateforme MCE' : activeCompanyName || company?.name || 'MCE Academy'}</p>
        )}
      </div>

      <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-brand-500 text-white shadow-sm' : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}

        {(isAdmin || isTrainer) && (
          <div className="pt-5">
            <p className="px-3.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-400">Changer d'espace</p>
            {isAdmin && area !== 'admin' && (
              <NavLink to="/admin" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white">
                <ShieldCheck className="h-4 w-4" /> Administration
              </NavLink>
            )}
            {area !== 'trainer' && (
              <NavLink to="/formateur" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white">
                <GraduationCap className="h-4 w-4" /> Espace formateur
              </NavLink>
            )}
            {area !== 'learner' && isTrainer && (
              <NavLink to="/app/catalogue" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white">
                <Eye className="h-4 w-4" /> Aperçu apprenant
              </NavLink>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-navy-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size="sm" />
          <NavLink to={area === 'admin' ? '/admin/profil' : area === 'trainer' ? '/formateur/profil' : '/app/profil'} className="min-w-0 flex-1 hover:opacity-90">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="truncate text-xs text-navy-300">{ROLE_LABELS[profile?.role]} · Mon profil</p>
          </NavLink>
          <button onClick={handleLogout} title="Se déconnecter" className="rounded-lg p-2 text-navy-300 hover:bg-navy-800 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 h-0.5 w-10 rounded-full bg-gold-500/70" />
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{Sidebar}</div>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <div className="relative h-full animate-fade-in">{Sidebar}</div>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur sm:px-8 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-navy-800 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <Logo to="/" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
