-- Correctif V6 ciblé : rétablit le verrou de l'onglet Annonces supprimé par le SQL 004.
-- À exécuter UNE FOIS dans Supabase SQL Editor après sauvegarde des politiques existantes.
-- Ne pas relancer la migration 004 entière.
BEGIN;
DROP POLICY IF EXISTS announcements_select ON public.announcements;
CREATE POLICY announcements_select ON public.announcements
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR public.is_trainer_of(company_id)
  OR (company_id = public.auth_company() AND public.learner_tab_open('annonces'))
);
COMMIT;
