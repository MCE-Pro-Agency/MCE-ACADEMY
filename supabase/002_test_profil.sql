-- =====================================================================
--  MCE ACADEMY — Migration Supabase n° 2 : test de profil professionnel
--  À exécuter APRÈS supabase/schema.sql, dans Supabase > SQL Editor.
--  Ré-exécutable sans risque (if not exists / create or replace / drop … if exists).
--
--  1. Inscription des apprenants avec le code de leur entreprise
--  2. Table profile_assessments : passations du test, brouillon, observations
--  3. Droits : l'apprenant gère son test ; le formateur voit et commente ceux
--     de son entreprise ; l'admin voit tout
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Inscription avec un code d'entreprise
-- ---------------------------------------------------------------------
alter table public.companies add column if not exists join_code text;
create unique index if not exists companies_join_code_uq on public.companies (upper(join_code));

-- Un code pour chaque entreprise qui n'en a pas encore (8 caractères sans 0/O/1/I)
update public.companies
set join_code = upper(substr(md5(random()::text || id::text), 1, 8))
where join_code is null;

-- Vérification du code avant l'inscription (appelable sans être connecté).
-- Ne renvoie que le nom de l'entreprise, jamais son identifiant ni ses données.
create or replace function public.company_for_join_code(p_code text)
returns text language sql stable security definer set search_path = public as $$
  select name from public.companies
  where upper(join_code) = upper(trim(p_code)) and is_active
  limit 1
$$;
grant execute on function public.company_for_join_code(text) to anon, authenticated;

-- Création du profil à l'inscription (remplace la version de schema.sql).
--  · Comptes créés par le formateur ou l'admin (API Node) : rôle et entreprise dans app_metadata.
--  · Inscription libre : TOUJOURS « learner » ; l'entreprise est trouvée par le code saisi
--    (user_metadata.join_code). Le rôle n'est jamais lu dans user_metadata, modifiable par l'utilisateur.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role    public.user_role := coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'learner');
  v_company uuid := nullif(new.raw_app_meta_data ->> 'company_id', '')::uuid;
begin
  if v_company is null and nullif(new.raw_user_meta_data ->> 'join_code', '') is not null then
    select id into v_company from public.companies
    where upper(join_code) = upper(trim(new.raw_user_meta_data ->> 'join_code')) and is_active
    limit 1;
    v_role := 'learner';
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

-- ---------------------------------------------------------------------
-- 2. Test de profil professionnel
-- ---------------------------------------------------------------------
--  runs   : passations terminées (date, minutes, version, answers, result)
--  draft  : test en cours, enregistré à chaque réponse
--  retake : nouvelle passation ouverte par le formateur
--  comment: observation du formateur, ajoutée au rapport de l'apprenant
create table if not exists public.profile_assessments (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  runs        jsonb not null default '[]'::jsonb,
  draft       jsonb,
  retake      boolean not null default false,
  comment     text,
  updated_at  timestamptz not null default now()
);

drop trigger if exists profile_assessments_touch on public.profile_assessments;
create trigger profile_assessments_touch before update on public.profile_assessments
  for each row execute function public.touch_updated_at();

-- L'apprenant ne peut ni écrire l'observation du formateur, ni se rouvrir une passation
create or replace function public.protect_profile_assessment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_company((select company_id from public.profiles where id = new.user_id)) then
    if tg_op = 'INSERT' then
      new.comment := null;
      new.retake := false;
    else
      new.comment := old.comment;
      new.retake := case when new.retake then old.retake else false end;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profile_assessments_protect on public.profile_assessments;
create trigger profile_assessments_protect before insert or update on public.profile_assessments
  for each row execute function public.protect_profile_assessment();

-- ---------------------------------------------------------------------
-- 3. Droits (RLS)
-- ---------------------------------------------------------------------
alter table public.profile_assessments enable row level security;

drop policy if exists profile_assessments_select on public.profile_assessments;
create policy profile_assessments_select on public.profile_assessments for select
  using (user_id = auth.uid() or public.can_manage_company((select company_id from public.profiles where id = user_id)));

drop policy if exists profile_assessments_insert on public.profile_assessments;
create policy profile_assessments_insert on public.profile_assessments for insert
  with check (user_id = auth.uid() or public.can_manage_company((select company_id from public.profiles where id = user_id)));

drop policy if exists profile_assessments_update on public.profile_assessments;
create policy profile_assessments_update on public.profile_assessments for update
  using (user_id = auth.uid() or public.can_manage_company((select company_id from public.profiles where id = user_id)));

drop policy if exists profile_assessments_delete on public.profile_assessments;
create policy profile_assessments_delete on public.profile_assessments for delete
  using (public.can_manage_company((select company_id from public.profiles where id = user_id)));

grant select, insert, update, delete on public.profile_assessments to authenticated;
