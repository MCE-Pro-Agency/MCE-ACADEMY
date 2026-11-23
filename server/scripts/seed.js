/**
 * Initialisation de MCE Academy
 *  - crée le premier administrateur (ADMIN_EMAIL / ADMIN_PASSWORD)
 *  - si SEED_DEMO=true : entreprise VIGILUS + formateur + 3 apprenants + 2 cours complets
 *
 * Usage : cd server && npm run seed
 *         npm run seed:content   → remplace le contenu des cours de démonstration
 */
import 'dotenv/config';
import { pool, one, query, uuid, toSqlDate } from '../src/db.js';
import { createAccount } from '../src/services/accounts.js';

/** Insère une ligne et la renvoie (JSON et dates convertis) */
async function ins(table, row) {
  const data = { id: uuid(), ...row };
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && !(v instanceof Date)) data[k] = JSON.stringify(v);
    else if (typeof v === 'boolean') data[k] = Number(v);
    else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) data[k] = toSqlDate(v);
  }
  await query(`INSERT INTO ${table} SET ?`, [data]);
  return one(`SELECT * FROM ${table} WHERE id = ?`, [data.id]);
}
import { demoCompany, demoTrainer, demoLearners, demoCourses, demoAnnouncements, demoDocuments } from './seed-data.js';

/* --replace-content : remplace les cours de démonstration (les comptes, profils et documents sont conservés) */
const REPLACE = process.argv.includes('--replace-content');
/* Nombre de modules ouverts au départ (jour 1 et jour 2 en démo) ; les suivants restent fermés
   et sont ouverts jour après jour par le formateur. */
const OPEN_AT_START = 2;

const log = (...a) => console.log('•', ...a);

async function findProfileByEmail(email) {
  return one('SELECT id, email, role, company_id FROM profiles WHERE email = ?', [email.toLowerCase()]);
}

async function ensureAccount(input) {
  const existing = await findProfileByEmail(input.email);
  if (existing) {
    log(`Compte déjà présent : ${input.email}`);
    return existing;
  }
  const { profile } = await createAccount(input);
  log(`Compte créé : ${input.email} (${input.role})`);
  return profile;
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD non définis : administrateur non créé.');
    return null;
  }
  return ensureAccount({ email, password, full_name: process.env.ADMIN_NAME || 'Administrateur', role: 'admin' });
}

async function seedDemo(adminId) {
  // Entreprise
  let company = await one('SELECT * FROM companies WHERE slug = ?', [demoCompany.slug]);
  if (!company) {
    company = await ins('companies', demoCompany);
    log(`Entreprise créée : ${company.name}`);
  } else {
    log(`Entreprise déjà présente : ${company.name}`);
  }

  const trainer = await ensureAccount({ ...demoTrainer, role: 'trainer', company_id: company.id });
  const learners = [];
  for (const l of demoLearners) learners.push(await ensureAccount({ ...l, role: 'learner', company_id: company.id }));

  // Documents de l'espace « Mes documents »
  const docs = await one('SELECT COUNT(*) AS count FROM documents WHERE company_id = ? AND user_id IS NULL', [company.id]);
  if (!docs.count) {
    for (const d of demoDocuments) await ins('documents', { ...d, company_id: company.id, created_by: trainer.id });
    log(`${demoDocuments.length} documents ajoutés à « Mes documents »`);
  }

  // Cours
  if (REPLACE) {
    const r = await query('DELETE FROM courses WHERE company_id = ?', [company.id]);
    log(`${r.affectedRows} cours supprimé(s) avant réimport du contenu`);
  }
  const { count } = await one('SELECT COUNT(*) AS count FROM courses WHERE company_id = ?', [company.id]);
  if (count > 0) {
    log('Des cours existent déjà pour cette entreprise : contenu non dupliqué.');
    return;
  }

  const createdCourses = [];
  for (const course of demoCourses) {
    const { modules, ...courseData } = course;
    const c = await ins('courses', { ...courseData, company_id: company.id, created_by: trainer.id || adminId });
    createdCourses.push({ course: c, lessons: [] });
    log(`Cours créé : ${c.title}`);

    for (const [mi, mod] of modules.entries()) {
      const m = await ins('modules', { course_id: c.id, title: mod.title, description: mod.description || null, position: mi });
      // Déblocage jour après jour : seuls les premiers modules sont ouverts, le formateur ouvre les suivants
      await query('INSERT INTO module_settings (module_id, mode) VALUES (?, ?)', [m.id, mi < OPEN_AT_START ? 'open' : 'closed']);

      for (const [li, lesson] of mod.lessons.entries()) {
        const { questions, ...lessonData } = lesson;
        const l = await ins('lessons', { ...lessonData, module_id: m.id, course_id: c.id, position: li });
        createdCourses.at(-1).lessons.push(l);

        for (const [qi, qq] of (questions || []).entries()) {
          const qRow = await ins('quiz_questions', { lesson_id: l.id, question: qq.question, options: qq.options, position: qi });
          await query('INSERT INTO quiz_answers SET ?', [{ question_id: qRow.id, correct_index: qq.correct, explanation: qq.explanation || null }]);
        }
      }
    }
  }

  // Inscriptions : tous les apprenants à tous les cours
  const enrollRows = [];
  for (const l of learners) for (const { course } of createdCourses) enrollRows.push({ user_id: l.id, course_id: course.id });
  for (const r of enrollRows) await query('INSERT IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)', [uuid(), r.user_id, r.course_id]);
  log(`${enrollRows.length} inscriptions créées`);

  // Un peu d'activité de démo pour que les tableaux de bord soient parlants
  const main = createdCourses[0];
  const progressPlan = [9, 5, 2]; // nb de leçons terminées par apprenant
  for (const [i, learner] of learners.entries()) {
    const done = main.lessons.slice(0, progressPlan[i] || 0);
    if (done.length) {
      for (const l of done) {
        await query(
          'INSERT IGNORE INTO lesson_progress (user_id, lesson_id, course_id, completed, completed_at, time_spent_seconds) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP(3), ?)',
          [learner.id, l.id, main.course.id, 240 + Math.floor(Math.random() * 400)]
        );
      }
    }
    const sessions = [];
    for (let d = 0; d < 7; d++) {
      if (Math.random() < 0.35 + 0.15 * (3 - i)) {
        const start = new Date(Date.now() - d * 86400000 - Math.floor(Math.random() * 6) * 3600000);
        const dur = 600 + Math.floor(Math.random() * 2400);
        sessions.push({
          user_id: learner.id,
          company_id: company.id,
          started_at: start.toISOString(),
          last_ping_at: new Date(start.getTime() + dur * 1000).toISOString(),
          duration_seconds: dur,
        });
      }
    }
    for (const se of sessions) await ins('user_sessions', se);
    await query('UPDATE profiles SET last_seen_at = ? WHERE id = ?', [toSqlDate(new Date(Date.now() - i * 86400000)), learner.id]);
  }

  // Une note de quiz et un exercice corrigé pour le premier apprenant
  const quiz = main.lessons.find((l) => l.type === 'quiz');
  const exercise = main.lessons.find((l) => l.type === 'exercise');
  if (quiz) {
    await ins('quiz_attempts', {
      user_id: learners[0].id, lesson_id: quiz.id, course_id: main.course.id,
      score: 75, correct_count: 3, total_questions: 4, passed: true, answers: {},
    });
  }
  if (exercise) {
    await ins('exercise_submissions', {
      user_id: learners[0].id, lesson_id: exercise.id, course_id: main.course.id,
      content: "1. Je comprends votre agacement, c'est légitime.\n2. Si je résume : retard de 5 jours et commande incomplète.\n3. Je vous fais livrer les articles manquants sous 48h, frais offerts.\n4. Est-ce que cette solution vous convient ?",
      status: 'graded', grade: 16, feedback: 'Très bonne structure ! Pensez à donner votre nom et un contact direct pour rassurer le client.',
      graded_by: trainer.id, graded_at: new Date().toISOString(),
    });
  }

  const ann = await one('SELECT COUNT(*) AS count FROM announcements WHERE company_id = ?', [company.id]);
  if (!ann.count) for (const a of demoAnnouncements) await ins('announcements', { ...a, company_id: company.id, author_id: trainer.id });

  log('Données de démonstration prêtes ✅');
}

async function main() {
  console.log('\n🌱 Initialisation de MCE Academy…\n');
  const admin = await seedAdmin();
  if (String(process.env.SEED_DEMO).toLowerCase() === 'true') {
    await seedDemo(admin?.id);
  }
  console.log('\n✅ Terminé.\n');
  if (process.env.ADMIN_EMAIL) console.log(`   Admin      : ${process.env.ADMIN_EMAIL} / (mot de passe du .env)`);
  if (String(process.env.SEED_DEMO).toLowerCase() === 'true') {
    console.log(`   Formateur  : ${demoTrainer.email} / ${demoTrainer.password}`);
    console.log(`   Apprenants : ${demoLearners.map((l) => l.email).join(', ')} / ${demoLearners[0].password}\n`);
  }
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error('❌ Erreur :', e.message || e);
    process.exit(1);
  });
