/* Installation non destructive de l'espace Administration par entreprise. */
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const app = path.join(root, 'frontend/src/App.jsx');
const nav = path.join(root, 'frontend/src/components/layout/AppLayout.jsx');
const page = path.join(root, 'frontend/src/pages/admin/AdminCompanyHubV1.jsx');
function fail(x){console.error('STOP : '+x);process.exit(1);}
if(!fs.existsSync(app)||!fs.existsSync(nav)||!fs.existsSync(page)) fail('Executer dans le dossier racine MCE-ACADEMY apres extraction du ZIP.');
const utf8='utf8';
const a0=fs.readFileSync(app,utf8), n0=fs.readFileSync(nav,utf8);
let a=a0, n=n0;
const imp="import AdminCompanyHubV1 from './pages/admin/AdminCompanyHubV1';";
if(!a.includes(imp)) {
  const anchor="import Companies from './pages/admin/Companies';";
  if(!a.includes(anchor)) fail('Point insertion App.jsx introuvable. Rien modifie.');
  a=a.replace(anchor, anchor+'\n'+imp);
}
const route='<Route path="/admin/gestion-entreprises" element={<AdminCompanyHubV1 />} />';
if(!a.includes(route)){
 const anchor='<Route path="/admin/entreprises" element={<Companies />} />';
 if(!a.includes(anchor)) fail('Route Admin introuvable. Rien modifie.');
 a=a.replace(anchor,anchor+'\n          '+route);
}
const navItem="{ to: '/admin/gestion-entreprises', label: 'Gestion par entreprise', icon: Building2 },";
if(!n.includes("'/admin/gestion-entreprises'")) {
 const match=n.match(/\{\s*to:\s*['"]\/admin\/entreprises['"][^\n]*\},/);
 if(!match) fail('Menu Entreprises introuvable. Rien modifie.');
 n=n.replace(match[0],match[0]+'\n        '+navItem);
}
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
for(const [file,old,newText] of [[app,a0,a],[nav,n0,n]]){
 if(old!==newText){fs.copyFileSync(file,file+'.bak-admin-v1-'+stamp);fs.writeFileSync(file,newText,utf8);}
}
console.log('SUCCES : onglet Admin Gestion par entreprise installe.');
console.log('App et menu uniquement, sauvegardes automatiques. Test de profil INCHANGE.');
console.log('Ensuite : npm --prefix .\\frontend run build');
