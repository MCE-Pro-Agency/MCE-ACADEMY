-- =====================================================================
--  MCE ACADEMY — Migration 2b : droits d'accès de l'API Supabase
--  Constat du 23/11/2026 : sur ce projet, les rôles de l'API (authenticated,
--  service_role) n'ont aucun droit sur les tables MCE Academy (« permission denied »).
--  Ce script les rétablit pour les 14 tables MCE Academy uniquement.
--  La sécurité reste assurée par les politiques RLS : on les active d'abord.
--  Aucun droit n'est donné au rôle anon (visiteur non connecté) sur les tables.
--  Ne touche pas aux fonctions vigilus_* / mce_admin_* des autres applications.
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies', 'profiles', 'courses', 'modules', 'lessons', 'quiz_questions', 'quiz_answers',
    'enrollments', 'lesson_progress', 'quiz_attempts', 'exercise_submissions', 'user_sessions',
    'announcements', 'profile_assessments'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

grant usage on schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Fonctions MCE Academy appelées par l'application ou par les politiques RLS
do $$
declare
  f text;
begin
  foreach f in array array[
    'auth_role', 'auth_company', 'is_admin', 'is_trainer_of', 'can_manage_company', 'course_company',
    'lesson_course', 'question_company', 'can_view_course', 'submit_quiz', 'heartbeat',
    'course_progress_for_user', 'company_learner_stats', 'company_course_stats', 'activity_by_day',
    'platform_stats', 'companies_overview'
  ] loop
    execute format('grant execute on function public.%I to authenticated, service_role', f);
  end loop;
end $$;
