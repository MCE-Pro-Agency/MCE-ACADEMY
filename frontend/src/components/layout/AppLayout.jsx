import AdminConfirm from './AdminConfirm';
import { useEffect, useState } from 'react';
import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, UserCircle, Users, GraduationCap, ClipboardCheck,
  Megaphone, Building2, ShieldCheck, LogOut, Menu, X, Eye, Settings, ChevronDown, Brain, BookMarked, UserCog, CalendarDays, FolderOpen, CalendarClock, Lock, LockKeyhole,
} from 'lucide-react';
import { LEARNER_TABS, isTabOpen } from '../../lib/learnerTabs';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { cn, ROLE_LABELS } from '../../lib/utils';
import { Avatar } from '../ui';
import Logo from './Logo';
import './workspace-responsive.css';

/* Menus par espace, regroupÃ©s en rubriques explicites */
// Les onglets ferment dans Supabase restent visibles et non cliquables pour l'apprenant.
// Les liens Formateur et Administration restent inchangés.
function NavLink({ to, className, children, onClick, ...props }) {
  const { company, isLearner } = useAuth();
  const tab = typeof to === 'string' ? LEARNER_TABS.find(x => x.to === to) : null;
  const locked = Boolean(isLearner && tab && tab.key !== 'parcours' && !isTabOpen(company, tab.key));
  const location = useLocation();
  const aliases = {'/admin/programme':['/admin/cours','/admin/studio'], '/admin/utilisateurs':['/admin/affectations','/admin/apprenants'], '/admin/exercices':['/admin/corrections','/admin/activites'], '/admin/documents':['/admin/annonces'], '/admin/performances':['/admin/rapports'], '/admin/acces':['/admin/parametres']};
  const styled = (state) => {
    if (aliases[to]?.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) state = {...state,isActive:true};
    const base = typeof className === 'function' ? className(state) : (className || '');
    return locked ? base + ' opacity-50 cursor-not-allowed' : base;
  };
  const icon = locked ? <LockKeyhole className="ml-auto h-4 w-4 shrink-0" aria-label="Verrouillé" /> : null;
  const contents = typeof children === 'function'
    ? (state) => <>{children(state)}{icon}</>
    : <>{children}{icon}</>;
  return (
    <RouterNavLink {...props} to={to} className={styled}
      aria-disabled={locked || undefined} tabIndex={locked ? -1 : props.tabIndex}
      onClick={(event) => {
        if (locked) { event.preventDefault(); return; }
        if (onClick) onClick(event);
      }}>
      {contents}
    </RouterNavLink>
  );
}

const NAV = {
  // Espace apprenant : le test de profil (toujours ouvert) + les onglets ouverts par le formateur
  learner: [
    { title: 'Mon espace', items: [{ to: '/app/mon-profil', label: 'Mon test de profil', icon: Brain }] },
    { title: 'Ma formation', items: LEARNER_TABS.map(({ key, to, label, icon }) => ({ key, to, label: key === 'parcours' ? 'Mes formations' : label, icon })) },
  ],
  trainer: [
    { title: 'Espace formateur', items: [
      { to: '/formateur', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
      { to: '/formateur/cours', label: 'Mes formations', icon: GraduationCap },
      { to: '/formateur/exercices', label: 'Exercices & Evaluations', icon: ClipboardCheck },
      { to: '/formateur/apprenants', label: 'Mes apprenants', icon: Users },
      // { to: '/formateur/activites', label: 'Séances & activités', icon: CalendarClock },
      { to: '/formateur/performances', label: 'Performances', icon: LayoutDashboard },
      { to: '/formateur/rapports', label: 'Résultats & rapports', icon: Award },
      { to: '/formateur/acces', label: 'Gestion des accès', icon: LockKeyhole },
    ] },
  ],
  admin: [
    { title: 'Pilotage', items: [{ to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true }] },
    { title: 'Organisation', items: [{ to: '/admin/entreprises', label: 'Entreprises clientes', icon: Building2 }, { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users }] },
    { title: 'Gestion pédagogique', items: [{ to: '/admin/programme', label: 'Formations & programmes', icon: GraduationCap }, { to: '/admin/exercices', label: 'Exercices & évaluations', icon: ClipboardCheck }, { to: '/admin/documents', label: 'Documents & annonces', icon: FolderOpen }] },
    { title: 'Analyse & contrôle', items: [{ to: '/admin/performances', label: 'Performances & rapports', icon: Award }, { to: '/admin/profils', label: 'Profils professionnels', icon: Brain }] },
    { title: 'Configuration', items: [{ to: '/admin/acces', label: 'Paramètres & accès', icon: ShieldCheck }] },
  ],
};

const AREA_TITLES = { learner: 'Espace apprenant', trainer: 'Espace formateur', admin: 'Administration MCE' };

export default function AppLayout({ area }) {
  const { profile, company, isAdmin, isTrainer, signOut, activeCompanyId, setActiveCompanyId, authorizedCompanies } = useAuth();
  const [open, setOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);


  const items = NAV[area] || [];
  const activeCompanyName = authorizedCompanies.find((c) => c.id === activeCompanyId)?.name || company?.name;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const Sidebar = (
    <aside className="flex h-full w-72 max-w-[85vw] flex-col bg-navy-900 text-navy-100">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo to="/" dark />
        <button className="rounded-lg p-1 text-navy-200 hover:bg-navy-800 lg:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 mb-4 rounded-xl bg-navy-800/70 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-300">{AREA_TITLES[area]}</p>
        {area === 'trainer' && (isAdmin || isTrainer) ? (
          <div className="relative mt-1.5">
            <select
              value={activeCompanyId || ''}
              onChange={(e) => { setActiveCompanyId(e.target.value || null); if (location.pathname.match(/\/formateur\/(cours|apprenants)\/[^/]+/)) navigate('/formateur'); }}
              className="w-full appearance-none rounded-lg border-0 bg-navy-700 py-1.5 pl-2.5 pr-8 text-sm font-semibold text-white focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Choisir une entreprise </option>
              {authorizedCompanies.map((c) => (
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
        {items.map((group) => (
          <div key={group.title} className="pb-2">
            <p className="px-3.5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-400">{group.title}</p>
            {group.items.map(({ key, to, label, icon: Icon, end }) => {
              const locked = area === 'learner' && key && key !== 'parcours' && !isTabOpen(company, key);
              return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group mb-0.5 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                    isActive ? 'bg-brand-500 text-white shadow-sm' : 'text-navy-200 hover:bg-navy-800 hover:text-white'
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{label}</span>
                {locked && <Lock className="h-3.5 w-3.5 text-navy-400" title="Ouvert par votre formateur" />}
              </NavLink>
              );
            })}
          </div>
        ))}

        {!isAdmin && isTrainer && (
          <div className="mt-3 border-t border-navy-800 pt-3">
            <p className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-400">Raccourcis</p>
            {isAdmin && area !== 'admin' && (
              <NavLink to="/admin" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><ShieldCheck className="h-4 w-4" /> Retour à l'administration</NavLink>
            )}
            {isAdmin && area === 'admin' && (
              <NavLink to="/formateur" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><GraduationCap className="h-4 w-4" /> Gérer les cours d'une entreprise</NavLink>
            )}
            {area !== 'learner' && (
              <NavLink to="/app" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><Eye className="h-4 w-4" /> Voir comme un apprenant</NavLink>
            )}
            {area === 'learner' && (
              <NavLink to={isAdmin ? '/admin' : '/formateur'} className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><ShieldCheck className="h-4 w-4" /> Quitter l'apercu apprenant</NavLink>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-navy-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size="sm" />
          <NavLink to={area === 'admin' ? '/admin/profil' : area === 'trainer' ? '/formateur/profil' : '/app/profil'} className="min-w-0 flex-1 hover:opacity-90">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="truncate text-xs text-navy-300">{ROLE_LABELS[profile?.role]} Â· Mon compte</p>
          </NavLink>
          <button onClick={handleLogout} title="Se dÃ©connecter" className="rounded-lg p-2 text-navy-300 hover:bg-navy-800 hover:text-white">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 h-0.5 w-10 rounded-full bg-gold-500/70" />
      </div>
    </aside>
  );

  return (
    <div className={`min-h-screen mce-workspace mce-workspace-${area}`}>
      {/* Sidebar desktop */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{Sidebar}</div>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-fit max-w-full animate-fade-in">{Sidebar}</div>
        </div>
      )}

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur sm:px-8 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-navy-800 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <Logo to="/" />
        </header>
        <main className="mce-workspace-main mx-auto min-w-0 max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
          {area==='admin'?<AdminConfirm><Outlet /></AdminConfirm>:<Outlet key={area === 'trainer' ? (activeCompanyId || 'no-company') : area} />}
        </main>
      </div>
    </div>
  );
}
