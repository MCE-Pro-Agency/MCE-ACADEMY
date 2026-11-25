-- MCE Academy V7 — appliquer SEULEMENT si la politique announcements_select
-- actuelle ne controle pas encore public.learner_tab_open('annonces').
-- A lancer manuellement dans Supabase SQL Editor apres verification de la version de la politique.
DROP POLICY IF EXISTS announcements_select ON public.announcements;
CREATE POLICY announcements_select ON public.announcements FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.is_trainer_of(company_id)
  OR (company_id = public.auth_company() AND public.learner_tab_open('annonces'))
);
