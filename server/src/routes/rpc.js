/* Fonctions métier (anciennes fonctions RPC PostgreSQL), portées en MySQL */
import { Router } from 'express';
import { query, one, uuid } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { canManageCompany, canViewCourse, lessonLocked } from '../policies.js';
import { refreshEnrollment } from '../query.js';
import { ah, HttpError } from '../utils.js';

const router = Router();
router.use(requireAuth);

const FN = {
  /** Correction d'un quiz côté serveur (les bonnes réponses ne quittent jamais le serveur) */
  async submit_quiz(me, { p_lesson_id, p_answers = {} }) {
    const lesson = await one("SELECT course_id, passing_score FROM lessons WHERE id = ? AND type = 'quiz'", [p_lesson_id]);
    if (!lesson || !(await canViewCourse(me, lesson.course_id))) throw new HttpError(403, 'Accès refusé.');
    if (me.role === 'learner' && (await lessonLocked(p_lesson_id))) throw new HttpError(403, 'Ce module n’est pas encore ouvert par votre formateur.');
    const qs = await query(
      'SELECT q.id, a.correct_index, a.explanation FROM quiz_questions q LEFT JOIN quiz_answers a ON a.question_id = q.id WHERE q.lesson_id = ? ORDER BY q.position',
      [p_lesson_id]
    );
    let correct = 0;
    const details = qs.map((q) => {
      const raw = p_answers[q.id];
      const given = raw === undefined || raw === null || raw === '' ? null : Number(raw);
      const ok = given !== null && given === q.correct_index;
      if (ok) correct++;
      return { question_id: q.id, given, correct_index: q.correct_index, is_correct: ok, explanation: q.explanation };
    });
    const total = qs.length;
    const pass = lesson.passing_score ?? 70;
    const score = total ? Math.round((correct * 10000) / total) / 100 : 0;
    const passed = score >= pass;
    await query(
      'INSERT INTO quiz_attempts (id, user_id, lesson_id, course_id, score, correct_count, total_questions, passed, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid(), me.id, p_lesson_id, lesson.course_id, score, correct, total, Number(passed), JSON.stringify(p_answers)]
    );
    if (passed) {
      await query(
        `INSERT INTO lesson_progress (user_id, lesson_id, course_id, completed, completed_at, last_viewed_at)
         VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
         ON DUPLICATE KEY UPDATE completed = 1, completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP(3)), last_viewed_at = CURRENT_TIMESTAMP(3)`,
        [me.id, p_lesson_id, lesson.course_id]
      );
      await refreshEnrollment(me.id, lesson.course_id);
    }
    return { score, correct, total, passed, passing_score: pass, details };
  },

  /** Battement de cœur : temps de connexion + temps passé sur la leçon ouverte */
  async heartbeat(me, { p_lesson_id = null, p_seconds = 60 }) {
    const secs = Math.min(Math.max(Number(p_seconds) || 0, 0), 120);
    await query('UPDATE profiles SET last_seen_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [me.id]);
    const s = await one('SELECT id FROM user_sessions WHERE user_id = ? AND last_ping_at > (CURRENT_TIMESTAMP(3) - INTERVAL 3 MINUTE) ORDER BY last_ping_at DESC LIMIT 1', [me.id]);
    if (!s) await query('INSERT INTO user_sessions (id, user_id, company_id) VALUES (?, ?, ?)', [uuid(), me.id, me.company_id]);
    else await query('UPDATE user_sessions SET last_ping_at = CURRENT_TIMESTAMP(3), duration_seconds = duration_seconds + ? WHERE id = ?', [secs, s.id]);
    if (p_lesson_id && secs > 0) {
      const l = await one('SELECT id, course_id FROM lessons WHERE id = ?', [p_lesson_id]);
      if (l && (await canViewCourse(me, l.course_id))) {
        await query(
          `INSERT INTO lesson_progress (user_id, lesson_id, course_id, time_spent_seconds, last_viewed_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3))
           ON DUPLICATE KEY UPDATE time_spent_seconds = time_spent_seconds + VALUES(time_spent_seconds), last_viewed_at = CURRENT_TIMESTAMP(3)`,
          [me.id, l.id, l.course_id, secs]
        );
      }
    }
    return null;
  },

  /** Progression par cours d'un utilisateur (soi-même, ou un apprenant géré) */
  async course_progress_for_user(me, { p_user = null }) {
    const uid = p_user || me.id;
    if (uid !== me.id) {
      const target = await one('SELECT company_id FROM profiles WHERE id = ?', [uid]);
      if (!target || !canManageCompany(me, target.company_id)) return [];
    }
    return query(
      `SELECT e.course_id,
        (SELECT COUNT(*) FROM lessons l WHERE l.course_id = e.course_id) AS total_lessons,
        (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.course_id = e.course_id AND lp.user_id = e.user_id AND lp.completed = 1) AS completed_lessons,
        COALESCE(ROUND(100 * (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.course_id = e.course_id AND lp.user_id = e.user_id AND lp.completed = 1)
          / NULLIF((SELECT COUNT(*) FROM lessons l WHERE l.course_id = e.course_id), 0)), 0) AS progress_pct,
        COALESCE((SELECT SUM(lp.time_spent_seconds) FROM lesson_progress lp WHERE lp.course_id = e.course_id AND lp.user_id = e.user_id), 0) AS time_spent_seconds,
        (SELECT MAX(lp.last_viewed_at) FROM lesson_progress lp WHERE lp.course_id = e.course_id AND lp.user_id = e.user_id) AS last_viewed_at,
        e.enrolled_at, e.completed_at
       FROM enrollments e WHERE e.user_id = ?`,
      [uid]
    );
  },

  /** Progression module par module (leçons, missions, quiz) — tous les inscrits d'un cours, ou un apprenant */
  async module_progress(me, { p_course, p_user = null }) {
    const course = await one('SELECT company_id FROM courses WHERE id = ?', [p_course]);
    if (!course) return [];
    const manager = canManageCompany(me, course.company_id);
    if (!manager && (p_user ?? me.id) !== me.id) return [];
    const uid = manager ? p_user : me.id;
    return query(
      `SELECT e.user_id, m.id AS module_id, m.position,
        (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id) AS total_lessons,
        (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
           WHERE l.module_id = m.id AND lp.user_id = e.user_id AND lp.completed = 1) AS completed_lessons,
        (SELECT MAX(lp.completed_at) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
           WHERE l.module_id = m.id AND lp.user_id = e.user_id AND lp.completed = 1) AS last_completed_at,
        (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id AND l.type = 'exercise') AS total_exercises,
        (SELECT COUNT(*) FROM exercise_submissions s JOIN lessons l ON l.id = s.lesson_id
           WHERE l.module_id = m.id AND s.user_id = e.user_id) AS submitted_exercises,
        (SELECT ROUND(AVG(s.grade), 1) FROM exercise_submissions s JOIN lessons l ON l.id = s.lesson_id
           WHERE l.module_id = m.id AND s.user_id = e.user_id AND s.grade IS NOT NULL) AS avg_grade,
        (SELECT MAX(qa.score) FROM quiz_attempts qa JOIN lessons l ON l.id = qa.lesson_id
           WHERE l.module_id = m.id AND qa.user_id = e.user_id) AS best_quiz
       FROM enrollments e JOIN modules m ON m.course_id = e.course_id
       WHERE e.course_id = ? ${uid ? 'AND e.user_id = ?' : ''}
       ORDER BY m.position`,
      uid ? [p_course, uid] : [p_course]
    );
  },

  /** Statistiques par apprenant d'une entreprise (formateur / admin) */
  async company_learner_stats(me, { p_company }) {
    if (!canManageCompany(me, p_company)) return [];
    return query(
      `SELECT p.id AS user_id, p.full_name, p.email, p.job_title, p.is_active, p.last_seen_at, p.created_at,
        COALESCE((SELECT SUM(duration_seconds) FROM user_sessions WHERE user_id = p.id), 0) AS total_seconds,
        (SELECT COUNT(*) FROM user_sessions WHERE user_id = p.id) AS sessions_count,
        (SELECT COUNT(*) FROM enrollments WHERE user_id = p.id) AS enrolled_courses,
        (SELECT COUNT(completed_at) FROM enrollments WHERE user_id = p.id) AS completed_courses,
        (SELECT COUNT(*) FROM lesson_progress lp JOIN enrollments en ON en.user_id = lp.user_id AND en.course_id = lp.course_id WHERE lp.user_id = p.id AND lp.completed = 1) AS lessons_completed,
        (SELECT COUNT(*) FROM lessons l JOIN enrollments en ON en.course_id = l.course_id WHERE en.user_id = p.id) AS total_lessons,
        (SELECT ROUND(AVG(grade), 1) FROM exercise_submissions WHERE user_id = p.id AND grade IS NOT NULL) AS avg_exercise_grade
       FROM profiles p WHERE p.company_id = ? AND p.role = 'learner' ORDER BY p.full_name`,
      [p_company]
    ).then(async (rows) => {
      // moyenne des meilleurs scores de quiz par apprenant
      const avg = await query(
        `SELECT b.user_id, ROUND(AVG(b.best), 1) AS avg_quiz_score
         FROM (SELECT qa.user_id, qa.lesson_id, MAX(qa.score) AS best FROM quiz_attempts qa
               JOIN profiles p ON p.id = qa.user_id WHERE p.company_id = ? GROUP BY qa.user_id, qa.lesson_id) b
         GROUP BY b.user_id`,
        [p_company]
      );
      const byUser = Object.fromEntries(avg.map((a) => [a.user_id, a.avg_quiz_score]));
      return rows.map((r) => ({
        ...r,
        avg_quiz_score: byUser[r.user_id] ?? null,
        progress_pct: Number(r.total_lessons) ? Math.round((100 * Number(r.lessons_completed)) / Number(r.total_lessons)) : 0,
      }));
    });
  },

  /** Statistiques par cours d'une entreprise */
  async company_course_stats(me, { p_company }) {
    if (!canManageCompany(me, p_company)) return [];
    const courses = await query(
      `SELECT c.id AS course_id, c.title, c.is_published,
        (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS total_lessons,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolled,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.completed_at IS NOT NULL) AS completed,
        (SELECT ROUND(AVG(score), 1) FROM quiz_attempts qa WHERE qa.course_id = c.id) AS avg_quiz_score
       FROM courses c WHERE c.company_id = ? ORDER BY c.created_at DESC`,
      [p_company]
    );
    for (const c of courses) {
      const rows = await query(
        `SELECT e.user_id, (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = e.user_id AND lp.course_id = e.course_id AND lp.completed = 1) AS done
         FROM enrollments e WHERE e.course_id = ?`,
        [c.course_id]
      );
      c.avg_progress = rows.length && c.total_lessons ? Math.round(rows.reduce((a, r) => a + (100 * r.done) / c.total_lessons, 0) / rows.length) : 0;
    }
    return courses;
  },

  /** Activité quotidienne. p_company null = toute la plateforme (admin) */
  async activity_by_day(me, { p_company = null, p_days = 14 }) {
    const days = Math.max(1, Math.min(Number(p_days) || 14, 365));
    if (p_company ? !canManageCompany(me, p_company) : me.role !== 'admin') return [];
    const rows = await query(
      `SELECT DATE(started_at) AS day, ROUND(SUM(duration_seconds) / 60, 1) AS minutes, COUNT(DISTINCT user_id) AS active_users
       FROM user_sessions WHERE started_at >= (CURRENT_DATE - INTERVAL ? DAY) ${p_company ? 'AND company_id = ?' : ''}
       GROUP BY DATE(started_at)`,
      p_company ? [days - 1, p_company] : [days - 1]
    );
    const byDay = Object.fromEntries(rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r]));
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out.push({ day: d, minutes: Number(byDay[d]?.minutes || 0), active_users: Number(byDay[d]?.active_users || 0) });
    }
    return out;
  },

  /** Statistiques globales (admin) */
  async platform_stats(me) {
    if (me.role !== 'admin') return null;
    return one(
      `SELECT
        (SELECT COUNT(*) FROM companies) AS companies,
        (SELECT COUNT(*) FROM profiles WHERE role = 'admin') AS admins,
        (SELECT COUNT(*) FROM profiles WHERE role = 'trainer') AS trainers,
        (SELECT COUNT(*) FROM profiles WHERE role = 'learner') AS learners,
        (SELECT COUNT(*) FROM courses) AS courses,
        (SELECT COUNT(*) FROM courses WHERE is_published = 1) AS published,
        (SELECT COUNT(*) FROM lessons) AS lessons,
        (SELECT COUNT(*) FROM enrollments) AS enrollments,
        (SELECT COUNT(*) FROM enrollments WHERE completed_at IS NOT NULL) AS completions,
        (SELECT COALESCE(ROUND(SUM(duration_seconds) / 3600, 1), 0) FROM user_sessions) AS hours,
        (SELECT COUNT(*) FROM profiles WHERE last_seen_at > (CURRENT_TIMESTAMP(3) - INTERVAL 7 DAY)) AS active_7d`
    );
  },

  /** Résumé par entreprise (admin) */
  async companies_overview(me) {
    if (me.role !== 'admin') return [];
    return query(
      `SELECT c.id AS company_id,
        (SELECT COUNT(*) FROM profiles p WHERE p.company_id = c.id AND p.role = 'learner') AS learners,
        (SELECT COUNT(*) FROM profiles p WHERE p.company_id = c.id AND p.role = 'trainer') AS trainers,
        (SELECT COUNT(*) FROM courses co WHERE co.company_id = c.id) AS courses,
        (SELECT COALESCE(ROUND(SUM(s.duration_seconds) / 3600, 1), 0) FROM user_sessions s WHERE s.company_id = c.id) AS total_hours,
        (SELECT MAX(p.last_seen_at) FROM profiles p WHERE p.company_id = c.id) AS last_activity
       FROM companies c`
    );
  },
};

// POST /api/rpc/:name
router.post(
  '/:name',
  ah(async (req, res) => {
    const fn = FN[req.params.name];
    if (!fn) throw new HttpError(404, `Fonction inconnue : ${req.params.name}`);
    res.json({ data: await fn(req.profile, req.body || {}) });
  })
);

export default router;
