'use strict';
// Correction ciblee du rendu Markdown, sans modification des donnees ou du profil.
const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'frontend', 'src', 'pages', 'learner', 'LearnerTab.jsx');
if (!fs.existsSync(file)) { console.error('ERREUR : ouvrez le terminal dans le dossier MCE-ACADEMY.'); process.exit(1); }
const previous = fs.readFileSync(file, 'utf8');
if (!previous.includes("import { Markdown } from '../../components/ui';")) { console.error('ERREUR : version V7 attendue non trouvee. Aucun changement effectue.'); process.exit(1); }
const replacements = [
  [
    '{c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}',
    '{c.description && <div className="mt-2 text-sm text-slate-600"><Markdown>{c.description}</Markdown></div>}'
  ],
  [
    '{m.description && <p className="mt-1 text-xs text-slate-500">{m.description}</p>}',
    '{m.description && <div className="mt-2 text-sm text-slate-500"><Markdown>{m.description}</Markdown></div>}'
  ],
];
let next = previous;
for (const [before, after] of replacements) {
  if (next.includes(before)) next = next.replace(before, after);
  else if (!next.includes(after)) { console.error('ERREUR : format inattendu ; fichier non modifie.'); process.exit(1); }
}
if (next === previous) { console.log('Deja corrige : aucune modification necessaire.'); process.exit(0); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = file + '.bak-affichage-' + stamp;
fs.copyFileSync(file, backup);
fs.writeFileSync(file, next, 'utf8');
console.log('SUCCES : descriptions des formations et modules affichees avec mise en forme Markdown.');
console.log('Mon test de profil, Formateur, acces et Supabase : INCHANGES.');
console.log('Sauvegarde : ' + backup);
