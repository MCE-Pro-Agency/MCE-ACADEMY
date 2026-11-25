'use strict';
// MCE Academy V6 - ajout des 6 onglets apprenant avec verrous visibles.
// À lancer depuis la racine du projet : node .\scripts\installer_V6_APPRENANT_FINAL.cjs
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const file = p => path.join(root, ...p.split('/'));
const menuRel = 'frontend/src/components/layout/AppLayout.jsx';
const appRel = 'frontend/src/App.jsx';
const dependencyRel = ['frontend/src/lib/learnerTabs.js','frontend/src/pages/learner/LearnerTab.jsx'];
const missing = [menuRel,appRel,...dependencyRel].filter(x => !fs.existsSync(file(x)));
function error(message) { console.error('ARRÊT SANS MODIFICATION : ' + message);process.exit(1); }
if (missing.length) error('Fichiers absents : '+missing.join(', '));
let menu = fs.readFileSync(file(menuRel),'utf8');
let app = fs.readFileSync(file(appRel),'utf8');
const newPaths = ['parcours','cours','quiz','exercices','documents','annonces'];
const alreadyMenu = menu.includes("title: 'Ma formation'") && menu.includes('LEARNER_TABS.map');
const alreadyRoutes = app.includes('LearnerTab tabKey=');
if (alreadyMenu && alreadyRoutes) {console.log('V6 APPRENANT : les six onglets et les routes sont déjà présents. Aucun fichier modifié.');process.exit(0);}
// Contrôles stricts avant toute écriture.
const navPattern = /(^[ \t]*learner:\s*\[[\s\S]*?^[ \t]*\],)(?=\s*trainer\s*:)/m;
const navMatch = menu.match(navPattern);
if (!navMatch && !alreadyMenu) error('Impossible de trouver le bloc NAV.learner suivi de NAV.trainer.');
const menuImport = "import Logo from './Logo';";
if (!menu.includes(menuImport)) error('Point insertion import AppLayout introuvable.');
if (!menu.includes("import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';") && !menu.includes('NavLink as RouterNavLink')) error('Import React Router non reconnu.');
const routeAnchor = '<Route path="/app/mon-profil" element={<ProfilPro />} />';
if (!app.includes(routeAnchor) && !alreadyRoutes) error('Route /app/mon-profil introuvable.');
if (!app.includes("import ProfilPro from './pages/learner/ProfilPro';")) error('Import ProfilPro introuvable.');
if (!menu.includes('LockKeyhole')) error('Icône LockKeyhole absente : adaptation manuelle nécessaire.');
if (!alreadyMenu) {
  const replacement = `  learner: [
    { title: 'Mon espace', items: [{ to: '/app/mon-profil', label: 'Mon test de profil', icon: Brain }] },
    { title: 'Ma formation', items: LEARNER_TABS.map(tab => ({ to: tab.to, label: tab.label, icon: tab.icon })) },
  ],`;
  menu = menu.replace(navPattern,replacement);
}
if (!menu.includes("import { LEARNER_TABS, isTabOpen } from '../../lib/learnerTabs';")) {
  menu = menu.replace(menuImport,menuImport+"\nimport { LEARNER_TABS, isTabOpen } from '../../lib/learnerTabs';");
}
if (!menu.includes('NavLink as RouterNavLink')) {
  menu = menu.replace('import { NavLink, Outlet, useLocation, useNavigate } from \'react-router-dom\';',
    'import { NavLink as RouterNavLink, Outlet, useLocation, useNavigate } from \'react-router-dom\';');
}
if (!menu.includes('function NavLink({ to, className, children, onClick, ...props })')) {
  const guard = `// Les onglets ferment dans Supabase restent visibles et non cliquables pour l'apprenant.
// Les liens Formateur et Administration restent inchangés.
function NavLink({ to, className, children, onClick, ...props }) {
  const { company, isLearner } = useAuth();
  const tab = typeof to === 'string' ? LEARNER_TABS.find(x => x.to === to) : null;
  const locked = Boolean(isLearner && tab && !isTabOpen(company, tab.key));
  const styled = (state) => {
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

`;
  if (!menu.includes('const NAV = {')) error('Déclaration NAV absente : arrêt.');
  menu = menu.replace('const NAV = {',guard+'const NAV = {');
}
if (!app.includes("import LearnerTab from './pages/learner/LearnerTab';")) {
  app = app.replace("import ProfilPro from './pages/learner/ProfilPro';",
    "import ProfilPro from './pages/learner/ProfilPro';\nimport LearnerTab from './pages/learner/LearnerTab';");
}
for (const name of newPaths) {
  const r = `<Route path="/app/${name}" element={<LearnerTab tabKey="${name}" />} />`;
  if (!app.includes(r)) app = app.replace(routeAnchor,routeAnchor+'\n          '+r);
}
// Vérifier que les fichiers finaux contiennent les 6 routes et le 7e onglet formateur.
for (const name of newPaths) if (!app.includes(`path="/app/${name}"`)) error('Route manquante après préparation : '+name);
if (!menu.includes("'/formateur/acces'")) error('Le 7e onglet Formateur semble absent. Aucun changement effectué.');
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
for (const f of [menuRel,appRel]) fs.copyFileSync(file(f),file(f)+'.bak-v6-final-'+stamp);
fs.writeFileSync(file(menuRel),menu,'utf8');
fs.writeFileSync(file(appRel),app,'utf8');
console.log('SUCCÈS : 7 onglets apprenant visibles, six contrôlés par Supabase.');
console.log('SUCCÈS : Gestion des accès Formateur conservée.');
console.log('Sauvegardes .bak-v6-final créées. Aucun SQL ni commande Git exécutés.');
console.log('Vérification : npm --prefix .\\frontend run build');
