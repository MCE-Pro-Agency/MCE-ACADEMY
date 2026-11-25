-- =============================================================================
--  MCE Academy — 005 : sécurité de l'authentification
--  À exécuter dans Supabase > SQL Editor APRÈS validation par MCE (ne supprime aucune donnée).
--  Prérequis : schema.sql, 002_test_profil.sql et 004_multi_entreprises_v4.sql déjà appliqués.
--
--  1. Inscription publique : refuse un code entreprise invalide (plus de comptes « orphelins »).
--  2. Profils : un utilisateur ne peut plus modifier lui-même son e-mail dans public.profiles.
--  3. Synchronisation : quand l'e-mail change dans Supabase Auth, public.profiles suit.
--  4. Contrôle : liste des entreprises dont le code d'inscription est trop court.
-- =============================================================================
begin;

-- 1. Création d'un compte -------------------------------------------------------------
--   * compte créé par l'API (admin / formateur) : rôle et entreprise dans app_metadata ;
--   * invitation envoyée par l'API : marqueur mce_invite (le rôle est posé juste après) ;
--   * inscription publique : le code entreprise est obligatoire et doit être valide.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role     public.user_role := coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'learner');
  v_company  uuid := nullif(new.raw_app_meta_data ->> 'company_id', '')::uuid;
  v_code     text := nullif(trim(new.raw_user_meta_data ->> 'join_code'), '');
  v_by_api   boolean := (new.raw_app_meta_data ? 'role') or (new.raw_user_meta_data ->> 'mce_invite') = '1';
begin
  if v_company is null and v_code is not null then
    select id into v_company from public.companies
    where upper(join_code) = upper(v_code) and is_active
    limit 1;
    if v_company is null then
      raise exception 'Code entreprise invalide.' using errcode = 'P0001';
    end if;
    v_role := 'learner';
  elsif v_company is null and not v_by_api then
    raise exception 'Un code entreprise est nécessaire pour créer un compte.' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, email, full_name, role, company_id, job_title)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    v_role,
    v_company,
    nullif(new.raw_user_meta_data ->> 'job_title', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- 2. Champs protégés du profil ------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() est NULL pour la clé service_role (API) et le SQL Editor : autorisé
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.company_id is distinct from old.company_id then
      raise exception 'Seul un administrateur peut modifier le rôle ou l''entreprise.';
    end if;
    if new.email is distinct from old.email then
      raise exception 'L''adresse e-mail se modifie depuis le compte de connexion.';
    end if;
    if new.is_active is distinct from old.is_active and not public.is_trainer_of(old.company_id) then
      raise exception 'Action non autorisée.';
    end if;
  end if;
  return new;
end $$;

-- 3. E-mail : Supabase Auth -> public.profiles ----------------------------------------------
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

commit;

-- 4. Contrôle (lecture seule) : codes d'inscription trop courts ou faciles à deviner -------------
--    Le code est vérifié par la fonction publique company_code_matches : un code court peut être
--    trouvé par essais successifs. Remplacer ces codes par 10 caractères aléatoires ou plus.
select name, join_code, length(join_code) as longueur
from public.companies
where join_code is not null and length(join_code) < 10
order by name;
