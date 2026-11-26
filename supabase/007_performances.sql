BEGIN;
-- Lecture seule, limitée aux entreprises autorisées. Aucun accès direct à auth.users.
CREATE OR REPLACE FUNCTION public.mce_performance_auth(p_company uuid)
RETURNS TABLE(user_id uuid, last_sign_in_at timestamptz, email_confirmed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT p.id, u.last_sign_in_at, u.email_confirmed_at
 FROM public.profiles p JOIN auth.users u ON u.id=p.id
 WHERE p.company_id=p_company AND p.role='learner'
 AND public.can_manage_company(p_company) AND auth.uid() IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.mce_performance_auth(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mce_performance_auth(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
