const fs = require('fs');
const path = require('path');
const root = process.cwd();
const target = path.join(root, 'server', 'src', 'services', 'accounts.js');
const replacement = path.join(root, 'admin_v2_2_payload', 'updateAccount.txt');
if (!fs.existsSync(target) || !fs.existsSync(replacement)) {
  console.error('ERREUR : fichier serveur ou correctif absent. Lancez le script depuis la racine MCE-ACADEMY.');
  process.exit(1);
}
const raw = fs.readFileSync(target, 'utf8');
const markerStart = 'export async function updateAccount(';
const markerEnd = 'export async function deleteAccount(';
const start = raw.indexOf(markerStart);
const end = raw.indexOf(markerEnd);
if (start === -1 || end <= start || raw.indexOf(markerStart, start + 1) !== -1) {
  console.error('ERREUR : version de accounts.js inattendue. Aucun fichier modifie.');
  process.exit(1);
}
if (!raw.slice(start, end).includes('supabaseAdmin.auth.admin.updateUserById')) {
  console.error('ERREUR : fonction source inattendue. Aucun fichier modifie.');
  process.exit(1);
}
const patch = fs.readFileSync(replacement, 'utf8');
if (!patch.startsWith(markerStart) || !patch.includes('return current;')) {
  console.error('ERREUR : contenu du correctif invalide.');
  process.exit(1);
}
const backup = target + '.bak-admin-v2-2-' + new Date().toISOString().replace(/[:.]/g, '-');
fs.copyFileSync(target, backup);
fs.writeFileSync(target, raw.slice(0, start) + patch + raw.slice(end), 'utf8');
console.log('SUCCES : updateAccount corrige dans server/src/services/accounts.js.');
console.log('Sauvegarde : ' + backup);
console.log('Routes, Admin, Formateur, Apprenant et test de profil : INCHANGES.');
