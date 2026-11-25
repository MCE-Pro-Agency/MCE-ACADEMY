-- MCE Academy Admin V2 : responsables pédagogiques par formation.
-- À exécuter une fois dans Supabase SQL Editor APRÈS sauvegarde.
-- Aucune modification des profils professionnels, tests, leçons ou notes.
-- Il s'agit d'une table de responsabilité, pas d'une nouvelle politique d'accès aux cours.
BEGIN;
CREATE TABLE IF NOT EXISTS public.trainer_courses (
  trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trainer_id, course_id)
);
CREATE INDEX IF NOT EXISTS trainer_courses_course_idx ON public.trainer_courses(course_id);
ALTER TABLE public.trainer_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trainer_courses_select ON public.trainer_courses;
CREATE POLICY trainer_courses_select ON public.trainer_courses FOR SELECT TO authenticated
USING (public.is_admin() OR trainer_id = auth.uid());
DROP POLICY IF EXISTS trainer_courses_insert ON public.trainer_courses;
CREATE POLICY trainer_courses_insert ON public.trainer_courses FOR INSERT TO authenticated
WITH CHECK (public.is_admin()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = trainer_id AND p.role='trainer' AND p.is_active)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.profiles p ON p.id = trainer_id
    WHERE c.id = course_id AND
      (p.company_id=c.company_id OR EXISTS (
        SELECT 1 FROM public.trainer_companies tc WHERE tc.trainer_id=p.id AND tc.company_id=c.company_id
      ))
  )
);
DROP POLICY IF EXISTS trainer_courses_delete ON public.trainer_courses;
CREATE POLICY trainer_courses_delete ON public.trainer_courses FOR DELETE TO authenticated USING (public.is_admin());
GRANT SELECT,INSERT,DELETE ON public.trainer_courses TO authenticated;
COMMIT;
-- Vérification : SELECT * FROM public.trainer_courses LIMIT 20;
