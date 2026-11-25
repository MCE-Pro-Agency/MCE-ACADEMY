/**
 * Initialisation de MCE Academy
 *  - crée le premier administrateur (ADMIN_EMAIL / ADMIN_PASSWORD)
 *  - si SEED_DEMO=true : entreprise VIGILUS + formateur + 3 apprenants + 2 cours complets
 *
 * Usage : cd server && npm run seed
 */
import 'dotenv/config';
import { supabaseAdmin } from '../src/supabase.js';
import { createAccount } from '../src/services/accounts.js';
import { demoCompany, demoTrainer, demoLearners, demoCourses, demoAnnouncements } from './seed-data.js';

const log = (...a) => console.log('•', ...a);

async function findProfileByEmail(email) {
  const { data } = await supabaseAdmin.from('profiles').select('*').eq('email', email.toLowerCase()).maybeSingle();
  return data;
}

async function ensureAccount(input) {
  const existing = await findProfileByEmail(input.email);
  if (existing) {
    log(`Compte déjà présent : ${input.email}`);
    return existing;
  }
  // Script interne : comptes créés avec le mot de passe fourni, sans e-mail d'invitation.
  const { profile } = await createAccount({ ...input, invite: false });
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
  let { data: company } = await supabaseAdmin.from('companies').select('*').eq('slug', demoCompany.slug).maybeSingle();
  if (!company) {
    const res = await supabaseAdmin.from('companies').insert(demoCompany).select().single();
    if (res.error) throw res.error;
    company = res.data;
    log(`Entreprise créée : ${company.name}`);
  } else {
    log(`Entreprise déjà présente : ${company.name}`);
  }

  const trainer = await ensureAccount({ ...demoTrainer, role: 'trainer', company_id: company.id });
  const learners = [];
  for (const l of demoLearners) learners.push(await ensureAccount({ ...l, role: 'learner', company_id: company.id }));

  // Cours
  const { count } = await supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }).eq('company_id', company.id);
  if (count > 0) {
    log('Des cours existent déjà pour cette entreprise : contenu non dupliqué.');
    return;
  }

  const createdCourses = [];
  for (const course of demoCourses) {
    const { modules, ...courseData } = course;
    const { data: c, error } = await supabaseAdmin
      .from('courses')
      .insert({ ...courseData, company_id: company.id, created_by: trainer.id || adminId })
      .select()
      .single();
    if (error) throw error;
    createdCourses.push({ course: c, lessons: [] });
    log(`Cours créé : ${c.title}`);

    for (const [mi, mod] of modules.entries()) {
      const { data: m, error: mErr } = await supabaseAdmin
        .from('modules')
        .insert({ course_id: c.id, title: mod.title, description: mod.description || null, position: mi })
        .select()
        .single();
      if (mErr) throw mErr;

      for (const [li, lesson] of mod.lessons.entries()) {
        const { questions, ...lessonData } = lesson;
        const { data: l, error: lErr } = await supabaseAdmin
          .from('lessons')
          .insert({ ...lessonData, module_id: m.id, course_id: c.id, position: li })
          .select()
          .single();
        if (lErr) throw lErr;
        createdCourses.at(-1).lessons.push(l);

        for (const [qi, qq] of (questions || []).entries()) {
          const { data: qRow, error: qErr } = await supabaseAdmin
            .from('quiz_questions')
            .insert({ lesson_id: l.id, question: qq.question, options: qq.options, position: qi })
            .select()
            .single();
          if (qErr) throw qErr;
          await supabaseAdmin
            .from('quiz_answers')
            .insert({ question_id: qRow.id, correct_index: qq.correct, explanation: qq.explanation });
        }
      }
    }
  }

  // Inscriptions : tous les apprenants à tous les cours
  const enrollRows = [];
  for (const l of learners) for (const { course } of createdCourses) enrollRows.push({ user_id: l.id, course_id: course.id });
  await supabaseAdmin.from('enrollments').upsert(enrollRows, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
  log(`${enrollRows.length} inscriptions créées`);

  // Un peu d'activité de démo pour que les tableaux de bord soient parlants
  const main = createdCourses[0];
  const progressPlan = [8, 4, 1]; // nb de leçons terminées par apprenant
  for (const [i, learner] of learners.entries()) {
    const done = main.lessons.slice(0, progressPlan[i] || 0);
    if (done.length) {
      await supabaseAdmin.from('lesson_progress').upsert(
        done.map((l) => ({
          user_id: learner.id,
          lesson_id: l.id,
          course_id: main.course.id,
          completed: true,
          completed_at: new Date().toISOString(),
          time_spent_seconds: 240 + Math.floor(Math.random() * 400),
        })),
        { onConflict: 'user_id,lesson_id' }
      );
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
    if (sessions.length) await supabaseAdmin.from('user_sessions').insert(sessions);
    await supabaseAdmin.from('profiles').update({ last_seen_at: new Date(Date.now() - i * 86400000).toISOString() }).eq('id', learner.id);
  }

  // Une note de quiz et un exercice corrigé pour le premier apprenant
  const quiz = main.lessons.find((l) => l.type === 'quiz');
  const exercise = main.lessons.find((l) => l.type === 'exercise');
  if (quiz) {
    await supabaseAdmin.from('quiz_attempts').insert({
      user_id: learners[0].id, lesson_id: quiz.id, course_id: main.course.id,
      score: 75, correct_count: 3, total_questions: 4, passed: true, answers: {},
    });
  }
  if (exercise) {
    await supabaseAdmin.from('exercise_submissions').insert({
      user_id: learners[0].id, lesson_id: exercise.id, course_id: main.course.id,
      content: "1. Je comprends votre agacement, c'est légitime.\n2. Si je résume : retard de 5 jours et commande incomplète.\n3. Je vous fais livrer les articles manquants sous 48h, frais offerts.\n4. Est-ce que cette solution vous convient ?",
      status: 'graded', grade: 16, feedback: 'Très bonne structure ! Pensez à donner votre nom et un contact direct pour rassurer le client.',
      graded_by: trainer.id, graded_at: new Date().toISOString(),
    });
  }

  await supabaseAdmin.from('announcements').insert(
    demoAnnouncements.map((a) => ({ ...a, company_id: company.id, author_id: trainer.id }))
  );

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

main().catch((e) => {
  console.error('❌ Erreur :', e.message || e);
  process.exit(1);
});
