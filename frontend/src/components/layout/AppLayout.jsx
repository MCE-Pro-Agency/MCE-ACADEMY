import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, UserCircle, Users, GraduationCap, ClipboardCheck,
  Megaphone, Building2, ShieldCheck, LogOut, Menu, X, Eye, Settings, ChevronDown, Brain, BookMarked, UserCog, CalendarDays, FolderOpen, CalendarClock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { cn, ROLE_LABELS } from '../../lib/utils';
import { Avatar } from '../ui';
import Logo from './Logo';
import { isTestOnly } from '../../lib/learnerSpace';

/* Menus par espace, regroupés en rubriques explicites */
const NAV = {
  learner: [
    { title: 'Mon espace', items: [{ to: '/app', label: 'Tableau de bord', icon: LayoutDashboard, end: true }] },
    { title: 'Apprendre', items: [
      { to: '/app/programme', label: 'Mon programme', icon: CalendarDays },
      { to: '/app/catalogue', label: 'Mes modules', icon: BookOpen },
      { to: '/app/documents', label: 'Mes documents', icon: FolderOpen },
      { to: '/app/memos', label: 'Mes mémos', icon: BookMarked },
    ] },
    { title: 'Mon évolution', items: [
      { to: '/app/mon-profil', label: 'Mon profil professionnel', icon: Brain },
      { to: '/app/notes', label: 'Mes notes & certificats', icon: Award },
    ] },
  ],
  trainer: [
    { title: 'Pilotage', items: [{ to: '/formateur', label: 'Tableau de bord', icon: LayoutDashboard, end: true }] },
    { title: 'Mes apprenants', items: [
      { to: '/formateur/programme', label: 'Programme & déblocage', icon: CalendarClock },
      { to: '/formateur/apprenants', label: 'Suivi des apprenants', icon: Users },
      { to: '/formateur/profils', label: 'Profils professionnels', icon: Brain },
      { to: '/formateur/corrections', label: 'Corrections', icon: ClipboardCheck },
    ] },
    { title: 'Mes contenus', items: [
      { to: '/formateur/cours', label: 'Cours & modules', icon: GraduationCap },
      { to: '/formateur/documents', label: 'Documents', icon: FolderOpen },
      { to: '/formateur/annonces', label: 'Annonces', icon: Megaphone },
    ] },
    { title: 'Paramètres', items: [{ to: '/formateur/entreprise', label: 'Mon entreprise', icon: Settings }] },
  ],
  admin: [
    { title: 'Pilotage', items: [{ to: '/admin', label: "Vue d'ensemble", icon: LayoutDashboard, end: true }] },
    { title: 'Organisation', items: [
      { to: '/admin/entreprises', label: 'Entreprises clientes', icon: Building2 },
      { to: '/admin/formateurs', label: 'Formateurs', icon: UserCog },
      { to: '/admin/apprenants', label: 'Apprenants', icon: Users },
      { to: '/admin/utilisateurs', label: 'Tous les comptes', icon: ShieldCheck },
    ] },
    { title: 'Suivi pédagogique', items: [
      { to: '/admin/programme', label: 'Programme & évolution', icon: CalendarClock },
      { to: '/admin/profils', label: 'Profils professionnels', icon: Brain },
      { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
    ] },
  ],
};

/* Espace apprenant en mode « test uniquement » : seul le test est proposé */
const LEARNER_TEST_NAV = [
  { title: 'Mon espace', items: [{ to: '/app/mon-profil', label: 'Mon test de profil', icon: Brain }] },
];

const AREA_TITLES = { learner: 'Espace apprenant', trainer: 'Espace formateur', admin: 'Administration MCE' };

export default function AppLayout({ area }) {
  const { profile, company, isAdmin, isTrainer, signOut, activeCompanyId, setActiveCompanyId } = useAuth();
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (isAdmin) db.from('companies').select('id, name').order('name').then(({ data }) => setCompanies(data || []));
  }, [isAdmin]);

  const items = area === 'learner' && profile?.role === 'learner' && isTestOnly(company) ? LEARNER_TEST_NAV : NAV[area] || [];
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
        {items.map((group) => (
          <div key={group.title} className="pb-2">
            <p className="px-3.5 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-400">{group.title}</p>
            {group.items.map(({ to, label, icon: Icon, end }) => (
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
                {label}
              </NavLink>
            ))}
          </div>
        ))}

        {(isAdmin || isTrainer) && (
          <div className="mt-3 border-t border-navy-800 pt-3">
            <p className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-400">Raccourcis</p>
            {isAdmin && area !== 'admin' && (
              <NavLink to="/admin" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><ShieldCheck className="h-4 w-4" /> Retour à l’administration</NavLink>
            )}
            {isAdmin && area === 'admin' && (
              <NavLink to="/formateur" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><GraduationCap className="h-4 w-4" /> Gérer les cours d’une entreprise</NavLink>
            )}
            {area !== 'learner' && (
              <NavLink to="/app" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><Eye className="h-4 w-4" /> Voir comme un apprenant</NavLink>
            )}
            {area === 'learner' && (
              <NavLink to={isAdmin ? '/admin' : '/formateur'} className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"><ShieldCheck className="h-4 w-4" /> Quitter l’aperçu apprenant</NavLink>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-navy-800 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={profile?.full_name} src={profile?.avatar_url} size="sm" />
          <NavLink to={area === 'admin' ? '/admin/profil' : area === 'trainer' ? '/formateur/profil' : '/app/profil'} className="min-w-0 flex-1 hover:opacity-90">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="truncate text-xs text-navy-300">{ROLE_LABELS[profile?.role]} · Mon compte</p>
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
