/**
 * MCE Academy — import ciblé du programme VIGILUS IMPACT.
 * Prévisualisation par défaut. Application UNIQUEMENT avec --apply.
 * Ne crée aucun compte, aucune entreprise et aucun apprenant de démonstration.
 * Ne touche jamais aux tests professionnels / profile_assessments.
 * Exécuter depuis le dossier server/ : node scripts/import-vigilus-impact.js
 * Pour importer : node scripts/import-vigilus-impact.js --apply
 */
import 'dotenv/config';
import { supabaseAdmin } from '../src/supabase.js';
import { vigilusImpact } from './content/vigilus-impact.js';

const apply = process.argv.includes('--apply');
const slug = process.env.VIGILUS_COMPANY_SLUG || 'vigilus';
const programTitle = vigilusImpact.title;

function assert(response, context) {
  if (response.error) throw new Error(`${context}: ${response.error.message}`);
  return response.data;
}

async function main() {
  const modules = vigilusImpact.modules || [];
  const lessons = modules.flatMap(m => m.lessons || []);
  const questions = lessons.flatMap(l => l.questions || []);
  const tally = (type) => lessons.filter(l => l.type === type).length;
  console.log('\nMCE Academy — VIGILUS IMPACT / préparation de l’import');
  console.log(`Entreprise recherchée : ${slug}`);
  console.log(`Formation : ${programTitle}`);
  console.log(`Modules : ${modules.length} | Leçons : ${lessons.length} | Quiz : ${tally('quiz')} | Exercices : ${tally('exercise')} | Questions : ${questions.length}`);
  modules.forEach((m, i) => console.log(` ${i + 1}. ${m.title} — ${(m.lessons || []).length} éléments`));

  const company = assert(await supabaseAdmin.from('companies').select('id,name,slug').eq('slug', slug).maybeSingle(), 'Recherche entreprise');
  if (!company) throw new Error(`Entreprise « ${slug} » introuvable. Aucune donnée créée. Vérifier le slug dans Supabase.`);
  console.log(`\nEntreprise trouvée : ${company.name} (${company.id})`);
  const existing = assert(await supabaseAdmin.from('courses').select('id,title,is_published').eq('company_id',company.id), 'Lecture des formations');
  const matching = existing.find(c => c.title === programTitle);
  if (matching) {
    console.log(`La formation existe déjà : ${matching.id}. Import annulé pour éviter les doublons.`);
    return;
  }
  if (!apply) {
    console.log('\nPRÉVISUALISATION UNIQUEMENT — aucune donnée insérée.');
    console.log('Après validation du programme et sauvegarde Supabase : node scripts/import-vigilus-impact.js --apply');
    return;
  }
  const trainers = assert(await supabaseAdmin.from('profiles').select('id,full_name,role').eq('company_id',company.id).eq('role','trainer').limit(5), 'Recherche formateur');
  if (!trainers?.length) throw new Error('Aucun formateur rattaché à cette entreprise. Aucune donnée créée.');
  if (trainers.length > 1 && !process.env.VIGILUS_TRAINER_ID) throw new Error('Plusieurs formateurs trouvés. Définir VIGILUS_TRAINER_ID pour éviter une attribution incorrecte.');
  const trainer = process.env.VIGILUS_TRAINER_ID ? trainers.find(p=>p.id===process.env.VIGILUS_TRAINER_ID) : trainers[0];
  if (!trainer) throw new Error('Le VIGILUS_TRAINER_ID choisi ne correspond pas à un formateur de cette entreprise.');
  console.log(`Formateur : ${trainer.full_name || trainer.id}`);
  // Reste en brouillon jusqu'à validation pédagogique du contenu et des accès.
  const {modules: ignored, ...course} = vigilusImpact;
  const created = assert(await supabaseAdmin.from('courses').insert({...course, company_id:company.id,created_by:trainer.id,is_published:false}).select('id').single(), 'Création formation');
  console.log(`Formation brouillon créée : ${created.id}`);
  try {
    for (const [mi, mod] of modules.entries()) {
      const moduleRow = assert(await supabaseAdmin.from('modules').insert({course_id:created.id,title:mod.title,description:mod.description||null,position:mi}).select('id').single(),`Module ${mi+1}`);
      for (const [li,lesson] of (mod.lessons||[]).entries()) {
        const {questions:qq,...lessonData} = lesson;
        const row=assert(await supabaseAdmin.from('lessons').insert({...lessonData,course_id:created.id,module_id:moduleRow.id,position:li}).select('id').single(),`Leçon ${mi+1}.${li+1}`);
        for(const [qi,q] of (qq||[]).entries()) {
          const question=assert(await supabaseAdmin.from('quiz_questions').insert({lesson_id:row.id,question:q.question,options:q.options,position:qi}).select('id').single(),`Question ${qi+1}`);
          assert(await supabaseAdmin.from('quiz_answers').insert({question_id:question.id,correct_index:q.correct,explanation:q.explanation}),`Réponse ${qi+1}`);
        }
      }
      console.log(`Importé : ${mod.title}`);
    }
    console.log('\nImport terminé. Formation en BROUILLON. Aucun apprenant inscrit automatiquement.');
  } catch(e) {
    console.error(`\nIMPORT PARTIEL : cours ${created.id}. Ne pas relancer avant correction.`,e.message);
    process.exitCode=1;
  }
}
main().catch(e=>{console.error('\nImport non réalisé :',e.message);process.exitCode=1});
