/* =====================================================================
   Règles d'accès par rôle (équivalent des « Row Level Security » Supabase)
   - read(me)  → fragment SQL WHERE (alias de table : t) + paramètres
   - write(me, op, next, prev) → true / false (+ nettoyage des champs protégés)
   Rôles : admin (tout), trainer (son entreprise), learner (ses données).
   ===================================================================== */
import { one } from './db.js';

const isAdmin = (me) => me.role === 'admin';
const isTrainer = (me) => me.role === 'trainer';
const ALL = { sql: '1=1', params: [] };
const NONE = { sql: '1=0', params: [] };

/* ---------- Sous-requêtes réutilisables ---------- */

/** Cours visibles : admin → tous ; formateur → ceux de son entreprise ; apprenant → publiés de son entreprise */
function visibleCourses(me) {
  if (isAdmin(me)) return null; // pas de restriction
  return {
    sql: `SELECT c.id FROM courses c JOIN companies co ON co.id = c.company_id
          WHERE c.company_id = ? AND co.is_active = 1 ${isTrainer(me) ? '' : "AND c.is_published = 1 AND co.learner_space = 'complet'"}`,
    params: [me.company_id],
  };
}
const courseVisible = (me, col) => {
  const v = visibleCourses(me);
  return v ? { sql: `${col} IN (${v.sql})`, params: v.params } : ALL;
};
/** Cours gérés : admin → tous ; formateur → son entreprise ; apprenant → aucun */
const courseManaged = (me, col) =>
  isAdmin(me) ? ALL : isTrainer(me) ? { sql: `${col} IN (SELECT id FROM courses WHERE company_id = ?)`, params: [me.company_id] } : NONE;
const or = (...parts) => {
  const p = parts.filter((x) => x !== NONE);
  if (p.some((x) => x === ALL)) return ALL;
  if (!p.length) return NONE;
  return { sql: p.map((x) => `(${x.sql})`).join(' OR '), params: p.flatMap((x) => x.params) };
};
const own = (me, col = 't.user_id') => ({ sql: `${col} = ?`, params: [me.id] });
const and = (a, b) => (a === NONE || b === NONE ? NONE : a === ALL ? b : b === ALL ? a : { sql: `(${a.sql}) AND (${b.sql})`, params: [...a.params, ...b.params] });

/** Modules verrouillés par le formateur (fermés, ou date d'ouverture non atteinte) :
    leur contenu n'est jamais envoyé à un apprenant, même en appelant l'API directement. */
const LOCKED_MODULES = `SELECT module_id FROM module_settings WHERE mode = 'closed' OR (mode = 'date' AND opens_at IS NOT NULL AND opens_at > CURRENT_DATE())`;
/** Une leçon est-elle dans un module verrouillé ? */
export async function lessonLocked(lessonId) {
  return !!(await one(`SELECT 1 AS x FROM lessons WHERE id = ? AND module_id IN (${LOCKED_MODULES})`, [lessonId]));
}
const unlockedFor = (me, col) => (me.role === 'learner' ? { sql: `${col} NOT IN (${LOCKED_MODULES})`, params: [] } : ALL);

/* ---------- Vérifications d'écriture ---------- */
export const canManageCompany = (me, companyId) => isAdmin(me) || (isTrainer(me) && !!companyId && me.company_id === companyId);

export async function courseCompany(courseId) {
  return (await one('SELECT company_id FROM courses WHERE id = ?', [courseId]))?.company_id;
}
async function moduleCourse(moduleId) {
  return (await one('SELECT course_id FROM modules WHERE id = ?', [moduleId]))?.course_id;
}
async function lessonCourse(lessonId) {
  return (await one('SELECT course_id FROM lessons WHERE id = ?', [lessonId]))?.course_id;
}
async function questionCourse(questionId) {
  return (await one('SELECT l.course_id FROM quiz_questions q JOIN lessons l ON l.id = q.lesson_id WHERE q.id = ?', [questionId]))?.course_id;
}
const manageCourse = async (me, courseId) => !!courseId && canManageCompany(me, await courseCompany(courseId));
export async function canViewCourse(me, courseId) {
  if (!courseId) return false;
  if (isAdmin(me)) return true;
  const v = visibleCourses(me);
  return !!(await one(`SELECT 1 AS ok FROM (${v.sql}) x WHERE x.id = ?`, [...v.params, courseId]));
}
async function userCompany(userId) {
  return (await one('SELECT company_id, role FROM profiles WHERE id = ?', [userId])) || {};
}

/* ---------- Règles par table ---------- */
export const POLICIES = {
  companies: {
    read: (me) => (isAdmin(me) ? ALL : { sql: 't.id = ?', params: [me.company_id] }),
    write: async (me, op, next, prev) => (op === 'update' ? canManageCompany(me, prev.id) : isAdmin(me)),
  },

  profiles: {
    hidden: ['password_hash'],
    read: (me) => (isAdmin(me) ? ALL : or(own(me, 't.id'), isTrainer(me) ? { sql: 't.company_id = ?', params: [me.company_id] } : NONE)),
    write: async (me, op, next, prev) => {
      if (op !== 'update') return false; // création / suppression : via /api/users
      delete next.password_hash;
      if (!isAdmin(me)) {
        if (next.role !== undefined && next.role !== prev.role) return false;
        if (next.company_id !== undefined && next.company_id !== prev.company_id) return false;
        if (next.is_active !== undefined && next.is_active !== prev.is_active && !(isTrainer(me) && prev.company_id === me.company_id)) return false;
      }
      return isAdmin(me) || prev.id === me.id || (isTrainer(me) && prev.company_id === me.company_id && prev.role === 'learner');
    },
  },

  courses: {
    read: (me) => courseVisible(me, 't.id'),
    write: async (me, op, next, prev) => canManageCompany(me, prev?.company_id ?? next.company_id) && (!next.company_id || canManageCompany(me, next.company_id)),
  },

  modules: {
    read: (me) => courseVisible(me, 't.course_id'),
    write: async (me, op, next, prev) => manageCourse(me, prev?.course_id ?? next.course_id),
  },

  module_settings: {
    read: (me) => {
      const v = visibleCourses(me);
      return v ? { sql: `t.module_id IN (SELECT id FROM modules WHERE course_id IN (${v.sql}))`, params: v.params } : ALL;
    },
    write: async (me, op, next, prev) => manageCourse(me, await moduleCourse(prev?.module_id ?? next.module_id)),
  },

  lessons: {
    read: (me) => and(courseVisible(me, 't.course_id'), unlockedFor(me, 't.module_id')),
    write: async (me, op, next, prev) => {
      if (next.module_id) next.course_id = await moduleCourse(next.module_id); // course_id toujours déduit du module
      return manageCourse(me, prev?.course_id ?? next.course_id) && (!next.course_id || (await manageCourse(me, next.course_id)));
    },
  },

  quiz_questions: {
    read: (me) => {
      const v = visibleCourses(me);
      if (!v) return ALL;
      const lock = me.role === 'learner' ? ` AND module_id NOT IN (${LOCKED_MODULES})` : '';
      return { sql: `t.lesson_id IN (SELECT id FROM lessons WHERE course_id IN (${v.sql})${lock})`, params: v.params };
    },
    write: async (me, op, next, prev) => manageCourse(me, await lessonCourse(prev?.lesson_id ?? next.lesson_id)),
  },

  quiz_answers: {
    read: (me) =>
      isAdmin(me) ? ALL : isTrainer(me)
        ? { sql: `t.question_id IN (SELECT q.id FROM quiz_questions q JOIN lessons l ON l.id = q.lesson_id JOIN courses c ON c.id = l.course_id WHERE c.company_id = ?)`, params: [me.company_id] }
        : NONE,
    write: async (me, op, next, prev) => manageCourse(me, await questionCourse(prev?.question_id ?? next.question_id)),
  },

  enrollments: {
    read: (me) => or(own(me), courseManaged(me, 't.course_id')),
    write: async (me, op, next, prev) => {
      const courseId = prev?.course_id ?? next.course_id;
      if (await manageCourse(me, courseId)) return true;
      return op === 'insert' && next.user_id === me.id && canViewCourse(me, courseId);
    },
  },

  lesson_progress: {
    read: (me) => or(own(me), courseManaged(me, 't.course_id')),
    write: async (me, op, next, prev) => {
      if (op === 'delete') return manageCourse(me, prev.course_id);
      if (op === 'update') return prev.user_id === me.id && (!next.user_id || next.user_id === me.id);
      return next.user_id === me.id && canViewCourse(me, next.course_id);
    },
  },

  quiz_attempts: {
    read: (me) => or(own(me), courseManaged(me, 't.course_id')),
    write: async (me, op, next, prev) => op === 'delete' && manageCourse(me, prev.course_id), // création via /api/rpc/submit_quiz
  },

  exercise_submissions: {
    read: (me) => or(own(me), courseManaged(me, 't.course_id')),
    write: async (me, op, next, prev) => {
      const courseId = prev?.course_id ?? next.course_id;
      const manager = await manageCourse(me, courseId);
      if (op === 'delete') return manager;
      if (!manager) {
        // Un apprenant ne peut pas se noter lui-même
        for (const k of ['grade', 'feedback', 'graded_by', 'graded_at']) delete next[k];
        next.status = 'submitted';
        if (op === 'update') {
          for (const k of ['user_id', 'lesson_id', 'course_id']) delete next[k];
          next.submitted_at = new Date();
          return prev.user_id === me.id;
        }
        if (await lessonLocked(next.lesson_id ?? prev?.lesson_id)) return false; // module fermé par le formateur
        return next.user_id === me.id && canViewCourse(me, courseId);
      }
      return true;
    },
  },

  user_sessions: {
    read: (me) => or(own(me), isAdmin(me) ? ALL : isTrainer(me) ? { sql: 't.company_id = ?', params: [me.company_id] } : NONE),
    write: async () => false, // écriture via /api/rpc/heartbeat
  },

  announcements: {
    read: (me) => (isAdmin(me) ? ALL : { sql: 't.company_id = ?', params: [me.company_id] }),
    write: async (me, op, next, prev) => canManageCompany(me, prev?.company_id ?? next.company_id),
  },

  documents: {
    // Apprenant : documents disponibles de son entreprise, communs ou à son nom. Formateur : son entreprise.
    read: (me) =>
      isAdmin(me) ? ALL
        : isTrainer(me) ? { sql: 't.company_id = ?', params: [me.company_id] }
        : {
            sql: "t.company_id = ? AND t.is_available = 1 AND (t.user_id IS NULL OR t.user_id = ?) AND t.company_id IN (SELECT id FROM companies WHERE learner_space = 'complet')",
            params: [me.company_id, me.id],
          },
    write: async (me, op, next, prev) => {
      const companyId = prev?.company_id ?? next.company_id;
      if (!canManageCompany(me, companyId) || (next.company_id && !canManageCompany(me, next.company_id))) return false;
      if (op === 'insert') next.created_by = me.id;
      const userId = next.user_id ?? prev?.user_id;
      return !userId || (await userCompany(userId)).company_id === (next.company_id ?? companyId);
    },
  },

  profile_assessments: {
    read: (me) => (isAdmin(me) ? ALL : or(own(me), isTrainer(me) ? { sql: 't.user_id IN (SELECT id FROM profiles WHERE company_id = ?)', params: [me.company_id] } : NONE)),
    write: async (me, op, next, prev) => {
      const userId = prev?.user_id ?? next.user_id;
      const target = await userCompany(userId);
      const manager = isAdmin(me) || (isTrainer(me) && target.company_id === me.company_id);
      if (manager) return true;
      if (userId !== me.id || op === 'delete') return false;
      // L'apprenant gère ses passations et son brouillon, pas les observations ni la réouverture
      delete next.comment;
      if (next.retake === true) delete next.retake;
      return true;
    },
  },
};
