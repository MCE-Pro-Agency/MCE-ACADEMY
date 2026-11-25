// MCE Academy Admin V2. Installation locale, sûre et ciblée.
// Exécuter depuis la racine du projet : node .\scripts\installer_ADMIN_V2.cjs
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=process.cwd();
const files=[
  'frontend/src/pages/admin/Users.jsx',
  'frontend/src/pages/admin/TrainerAssignments.jsx',
  'frontend/src/pages/admin/AdminCompanyHubV1.jsx',
];
function sha(s){return crypto.createHash('sha256').update(s).digest('hex');}
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const source=path.join(root,'admin_v2_payload');
if(!fs.existsSync(path.join(root,'frontend','package.json'))) throw new Error('Lancez le script depuis C:\\Users\\LENOVO\\MCE-ACADEMY');
for(const f of files) {
  const sourceFile=path.join(source,f);
  const target=path.join(root,f);
  if(!fs.existsSync(sourceFile)) throw new Error('Fichier V2 manquant : '+sourceFile+' ; décompressez TOUT le ZIP à la racine du projet.');
  if(!fs.existsSync(target)) throw new Error('Fichier existant introuvable : '+target);
}
const backup=path.join(root,'admin_v2_sauvegardes',stamp);
fs.mkdirSync(backup,{recursive:true});
const manifest=[];
for(const f of files){
  const oldPath=path.join(root,f),sourceFile=path.join(source,f);
  const before=fs.readFileSync(oldPath),after=fs.readFileSync(sourceFile);
  const dst=path.join(backup,f);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,before);
  manifest.push({file:f,old_sha256:sha(before),new_sha256:sha(after)});
}
fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify(manifest,null,2));
for(const f of files){fs.copyFileSync(path.join(source,f),path.join(root,f));}
console.log('SUCCES : Admin V2 installée (Comptes, Affectations, Cartes par entreprise).');
console.log('Sauvegardes : '+backup);
console.log('Test de profil, Formateur, Apprenant, AuthContext, routes et données Supabase : INCHANGES.');
console.log('Puis exécutez : npm --prefix .\\frontend run build');
