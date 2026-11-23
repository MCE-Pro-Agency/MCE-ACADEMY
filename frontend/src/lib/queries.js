import { db } from './db';

/** Cours + modules + leçons, triés */
export async function fetchCourseTree(courseId) {
  const { data, error } = await db
    .from('courses')
    .select('*, modules(*, lessons(id, title, type, duration_minutes, position, module_id))')
    .eq('id', courseId)
    .single();
  if (error) throw error;
  data.modules = (data.modules || [])
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: (m.lessons || []).sort((a, b) => a.position - b.position) }));
  return data;
}

export const flattenLessons = (course) => (course?.modules || []).flatMap((m) => m.lessons);

/** Progression de l'utilisateur courant (ou d'un apprenant pour un formateur) par cours */
export async function fetchProgressMap(userId = null) {
  const { data, error } = await db.rpc('course_progress_for_user', { p_user: userId });
  if (error) throw error;
  return Object.fromEntries((data || []).map((r) => [r.course_id, { ...r, progress_pct: Number(r.progress_pct) }]));
}

/** Leçons terminées par l'utilisateur dans un cours */
export async function fetchLessonProgress(courseId, userId) {
  const { data } = await db
    .from('lesson_progress')
    .select('lesson_id, completed, time_spent_seconds, last_viewed_at')
    .eq('course_id', courseId)
    .eq('user_id', userId);
  return Object.fromEntries((data || []).map((r) => [r.lesson_id, r]));
}
