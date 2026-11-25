-- MCE Academy V4 : entreprises multiples / autorisations par formateur.
-- A lancer UNE FOIS dans Supabase SQL Editor, apres schema.sql + 002 + 003.
-- Prévoir une sauvegarde de la base avant migration.
BEGIN;

CREATE TABLE IF NOT EXISTS public.trainer_companies (
  trainer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trainer_id, company_id)
);
CREATE INDEX IF NOT EXISTS trainer_companies_company_idx ON public.trainer_companies(company_id);
ALTER TABLE public.trainer_companies ENABLE ROW LEVEL SECURITY;

-- Conserver tous les rattachements deja existants.
INSERT INTO public.trainer_companies (trainer_id, company_id)
SELECT id, company_id FROM public.profiles
WHERE role = 'trainer' AND company_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Liste des affectations : administration complete, formateurs seulement leurs propres lignes.
DROP POLICY IF EXISTS trainer_companies_select ON public.trainer_companies;
CREATE POLICY trainer_companies_select ON public.trainer_companies FOR SELECT TO authenticated
USING (public.is_admin() OR trainer_id = auth.uid());
DROP POLICY IF EXISTS trainer_companies_insert ON public.trainer_companies;
CREATE POLICY trainer_companies_insert ON public.trainer_companies FOR INSERT TO authenticated
WITH CHECK (public.is_admin() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=trainer_id AND p.role='trainer'));
DROP POLICY IF EXISTS trainer_companies_delete ON public.trainer_companies;
CREATE POLICY trainer_companies_delete ON public.trainer_companies FOR DELETE TO authenticated
USING (public.is_admin());
GRANT SELECT,INSERT,DELETE ON public.trainer_companies TO authenticated;

-- Inclut les affectations supplémentaires, sans retirer l'entreprise historique du formateur.
CREATE OR REPLACE FUNCTION public.is_trainer_of(p_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT coalesce((SELECT p.role='trainer' AND p.is_active AND (
    p.company_id=p_company OR EXISTS (
      SELECT 1 FROM public.trainer_companies tc
      WHERE tc.trainer_id=p.id AND tc.company_id=p_company
    )
 ) FROM public.profiles p WHERE p.id=auth.uid()), false)
$$;

CREATE OR REPLACE FUNCTION public.can_manage_company(p_company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.is_admin() OR public.is_trainer_of(p_company)
$$;

-- IMPORTANT : les droits de lecture des cours ne doivent pas rester limités a profiles.company_id.
CREATE OR REPLACE FUNCTION public.can_view_course(p_course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.courses c
  JOIN public.companies co ON co.id=c.company_id
  JOIN public.profiles p ON p.id=auth.uid()
  WHERE c.id=p_course AND p.is_active
  AND (p.role='admin' OR (co.is_active AND (
    (p.role='trainer' AND public.is_trainer_of(c.company_id))
    OR (p.role='learner' AND p.company_id=c.company_id AND c.is_published)
  )))
 )
$$;

DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated
USING (public.is_admin() OR id=public.auth_company() OR public.is_trainer_of(id));
-- Le formateur peut conserver les réglages courants de sa société comme en V3,
-- mais seul le Super Admin peut modifier le code, le statut et les paramètres structurels.
DROP POLICY IF EXISTS companies_update ON public.companies;
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated
USING (public.can_manage_company(id)) WITH CHECK (public.can_manage_company(id));
CREATE OR REPLACE FUNCTION public.v4_protect_company_admin_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
   IF NEW.join_code IS DISTINCT FROM OLD.join_code
      OR NEW.is_active IS DISTINCT FROM OLD.is_active
      OR NEW.max_learners IS DISTINCT FROM OLD.max_learners
      OR NEW.slug IS DISTINCT FROM OLD.slug THEN
     RAISE EXCEPTION 'Ces paramètres de l’entreprise sont réservés au Super Admin';
   END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS v4_protect_company_admin_fields ON public.companies;
CREATE TRIGGER v4_protect_company_admin_fields BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.v4_protect_company_admin_fields();


-- Annonces : les formateurs attribués voient celles de leur entreprise secondaire.
DROP POLICY IF EXISTS announcements_select ON public.announcements;
CREATE POLICY announcements_select ON public.announcements FOR SELECT TO authenticated
USING (public.is_admin() OR company_id=public.auth_company() OR public.is_trainer_of(company_id));

-- Les apprenants sont consultables uniquement par le formateur affecté à leur entreprise.
-- Leurs profils et évaluations utilisent deja is_trainer_of/can_manage_company.
-- Empêche qu'une modification directe de profil n'accorde un rôle ou un rattachement non autorisé.
CREATE OR REPLACE FUNCTION public.v4_protect_profile_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
   IF NEW.role IS DISTINCT FROM OLD.role OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
     RAISE EXCEPTION 'Rôle et entreprise modifiables uniquement par le Super Admin';
   END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS v4_protect_profile_identity ON public.profiles;
CREATE TRIGGER v4_protect_profile_identity BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.v4_protect_profile_identity();

-- Toutes les entreprises actives sont sélectionnables à l'inscription (aucun code révélé).
CREATE OR REPLACE FUNCTION public.public_signup_companies()
RETURNS TABLE (id uuid, name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT c.id,c.name FROM public.companies c WHERE c.is_active ORDER BY c.name
$$;
REVOKE ALL ON FUNCTION public.public_signup_companies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_signup_companies() TO anon, authenticated;

-- Vérifie explicitement la correspondance entre l'entreprise choisie et son code.
CREATE OR REPLACE FUNCTION public.company_code_matches(p_company uuid,p_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id=p_company AND c.is_active AND c.join_code IS NOT NULL
    AND upper(c.join_code)=upper(trim(p_code))
 )
$$;
REVOKE ALL ON FUNCTION public.company_code_matches(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_code_matches(uuid,text) TO anon,authenticated;

-- Code automatiquement généré pour toute nouvelle entreprise sans code.
CREATE OR REPLACE FUNCTION public.v4_generate_company_code()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF nullif(trim(NEW.join_code),'') IS NULL THEN
   NEW.join_code := upper(substr(md5(gen_random_uuid()::text || clock_timestamp()::text),1,12));
 ELSE
   NEW.join_code := upper(trim(NEW.join_code));
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS v4_generate_company_code ON public.companies;
CREATE TRIGGER v4_generate_company_code BEFORE INSERT ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.v4_generate_company_code();

COMMIT;

-- Validation manuelle :
-- SELECT count(*) AS nb_affectations FROM public.trainer_companies;
-- SELECT name,join_code FROM public.companies ORDER BY name;
