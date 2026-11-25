// MCE Academy Admin V2.1 - correctif du composant recursif Users.
// Ne touche ni Supabase ni au test de profil.
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const file = path.join(root, 'frontend', 'src', 'pages', 'admin', 'Users.jsx');
if (!fs.existsSync(file)) throw new Error('Fichier introuvable : frontend/src/pages/admin/Users.jsx');
const before = fs.readFileSync(file, 'utf8');
const oldImport = "import { UserPlus, Search, Pencil, Trash2, KeyRound, ShieldCheck, Building2, AlertTriangle, RefreshCcw } from 'lucide-react';";
const newImport = "import { Users as UsersIcon, UserPlus, Search, Pencil, Trash2, KeyRound, ShieldCheck, Building2, AlertTriangle, RefreshCcw } from 'lucide-react';";
const oldTag = '<Users className="h-5 w-5" />';
const newTag = '<UsersIcon className="h-5 w-5" />';
if (before.includes(newImport) && before.includes(newTag) && !before.includes(oldTag)) {
  console.log('DEJA CORRIGE : aucune modification necessaire.');
  process.exit(0);
}
if (!before.includes(oldImport) || !before.includes(oldTag)) {
  throw new Error('Version de Users.jsx differente : aucune modification appliquee. Contactez-moi avec le fichier actuel.');
}
const count = before.split(oldTag).length-1;
if (count !== 1) throw new Error('Nombre de balises a remplacer inattendu : '+count);
const after=before.replace(oldImport,newImport).replace(oldTag,newTag);
const backupDir=path.join(root,'admin_v2_sauvegardes');
fs.mkdirSync(backupDir,{recursive:true});
const backup=path.join(backupDir,'Users.jsx.avant-correctif-v2-1-'+new Date().toISOString().replace(/[:.]/g,'-')+'.bak');
fs.writeFileSync(backup,before,'utf8');
fs.writeFileSync(file,after,'utf8');
console.log('SUCCES : recursion des cartes Tous les comptes corrigee.');
console.log('Sauvegarde : '+backup);
console.log('Aucun autre fichier, aucun SQL, aucun test de profil modifie.');
