'use strict';
// Installation ciblée — aucun changement du test de profil, du formateur ou de Supabase.
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const f = (r) => path.join(root, ...r.split('/'));
const target = 'frontend/src/pages/learner/LearnerTab.jsx';
const app = 'frontend/src/App.jsx';
const menu = 'frontend/src/components/layout/AppLayout.jsx';
const payload = 'frontend/src/pages/learner/LearnerTabV7.jsx';
const needed = [target,app,menu,payload,'frontend/src/lib/learnerTabs.js'];
const missing = needed.filter(x => !fs.existsSync(f(x)));
function stop(message){console.error('INSTALLATION NON EFFECTUEE : '+message);process.exit(1);}
if(missing.length)stop('Fichiers manquants : '+missing.join(', '));
const appText = fs.readFileSync(f(app),'utf8');
const menuText = fs.readFileSync(f(menu),'utf8');
const tabs = ['parcours','cours','quiz','exercices','documents','annonces'];
for(const tab of tabs){if(!appText.includes(`path="/app/${tab}"`)) stop('Route manquante /app/'+tab+' ; ne pas installer avant correction du menu.');}
if(!menuText.includes('LEARNER_TABS.map')) stop('Les onglets apprenant ne sont pas raccordes au menu.');
if(!menuText.includes('/formateur/acces')) stop('Onglet Gestion des acces non trouve, abandon pour proteger le formateur.');
if(!appText.includes("import LearnerTab from './pages/learner/LearnerTab';"))stop('Import LearnerTab inattendu, abandon.');
const source = fs.readFileSync(f(payload),'utf8');
if(!source.includes('export default function LearnerTab'))stop('Fichier V7 invalide.');
const previous = fs.readFileSync(f(target),'utf8');
if(previous === source){console.log('V7 deja installee. Aucun changement.');process.exit(0);}
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
fs.copyFileSync(f(target), f(target)+'.bak-v7-'+stamp);
fs.writeFileSync(f(target),source,'utf8');
console.log('SUCCES : onglets Apprenant relies aux formations, cours, quiz, exercices, documents et annonces.');
console.log('Test de profil, App.jsx, AppLayout.jsx, Formateur et SQL : INCHANGES.');
console.log('Sauvegarde : '+target+'.bak-v7-'+stamp);
