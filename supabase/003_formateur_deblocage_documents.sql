-- =====================================================================
--  MCE ACADEMY — Migration Supabase n° 3 (FACULTATIVE) : déblocage des modules et documents
--  Concerne l'espace Formateur. À exécuter APRÈS schema.sql et 002_test_profil.sql,
--  uniquement si l'équipe Formateur garde ces fonctions :
--    - module_settings : déblocage des modules (fermé / ouvert / date / progressif)
--    - documents       : supports communs et documents personnels des apprenants
--    - verrouillage    : contenu d'un module fermé invisible pour les apprenants
--    - RPC module_progress : progression module par module
--  Écrit à partir des règles testées sur MySQL ; pas encore exécuté sur Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------
create table if not exists public.module_settings (
  module_id         uuid primary key references public.modules(id) on delete cascade,
  mode              text not null default 'open' check (mode in ('open', 'closed', 'date', 'sequential')),
  opens_at          date,
  requires_profile  boolean not null default false,
  updated_at        timestamptz not null default now()
);

create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade, -- null = document commun
  kind          text not null default 'autre' check (kind in ('support', 'livret', 'ebook', 'attestation', 'autre')),
  title         text not null,
  description   text,
  file_url      text not null,
  is_available  boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists documents_company_idx on public.documents(company_id);
create index if not exists documents_user_idx on public.documents(user_id);

drop trigger if exists module_settings_touch on public.module_settings;
create trigger module_settings_touch before update on public.module_settings
  for each row execute function public.touch_updated_at();
-- ---------------------------------------------------------------------
-- 3. Fonctions d'aide
-- ---------------------------------------------------------------------

-- Module fermé par le formateur (ou date d'ouverture non atteinte)
create or replace function public.module_locked(p_module uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.module_settings s
    where s.module_id = p_module
      and (s.mode = 'closed' or (s.mode = 'date' and s.opens_at is not null and s.opens_at > current_date))
  )
$$;

create or replace function public.lesson_locked(p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select public.module_locked(module_id) from public.lessons where id = p_lesson), false)
$$;

create or replace function public.module_course(p_module uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.modules where id = p_module
$$;

-- ---------------------------------------------------------------------
-- 4. Verrouillage des modules fermés (lecture et envois)
-- ---------------------------------------------------------------------
drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons for select
  using (
    public.can_view_course(course_id)
    and (public.auth_role() <> 'learner' or not public.module_locked(module_id))
  );

drop policy if exists quiz_questions_select on public.quiz_questions;
create policy quiz_questions_select on public.quiz_questions for select
  using (
    public.can_view_course(public.lesson_course(lesson_id))
    and (public.auth_role() <> 'learner' or not public.lesson_locked(lesson_id))
  );

-- submit_quiz (security definer) et les rendus d'exercices passent par ce garde-fou
create or replace function public.guard_locked_lesson()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.auth_role() = 'learner' and public.lesson_locked(new.lesson_id) then
    raise exception 'Ce module n''est pas encore ouvert par votre formateur.';
  end if;
  return new;
end $$;

drop trigger if exists quiz_attempts_lock on public.quiz_attempts;
create trigger quiz_attempts_lock before insert on public.quiz_attempts
  for each row execute function public.guard_locked_lesson();
drop trigger if exists submissions_lock on public.exercise_submissions;
create trigger submissions_lock before insert or update on public.exercise_submissions
  for each row execute function public.guard_locked_lesson();

-- ---------------------------------------------------------------------
-- 5. RLS des nouvelles tables
-- ---------------------------------------------------------------------
alter table public.module_settings enable row level security;
alter table public.documents enable row level security;

-- MODULE_SETTINGS : lisible par ceux qui voient le cours, modifiable par le formateur / admin
drop policy if exists module_settings_select on public.module_settings;
create policy module_settings_select on public.module_settings for select
  using (public.can_view_course(public.module_course(module_id)));
drop policy if exists module_settings_write on public.module_settings;
create policy module_settings_write on public.module_settings for all
  using (public.can_manage_company(public.course_company(public.module_course(module_id))))
  with check (public.can_manage_company(public.course_company(public.module_course(module_id))));

-- DOCUMENTS : apprenant → documents disponibles de son entreprise (communs ou à son nom) ;
--             formateur / admin → gestion
drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select
  using (
    public.can_manage_company(company_id)
    or (
      company_id = public.auth_company()
      and is_available
      and (user_id is null or user_id = auth.uid())
    )
  );
drop policy if exists documents_write on public.documents;
create policy documents_write on public.documents for all
  using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));

-- ---------------------------------------------------------------------
-- 6. RPC : progression module par module
--    db.rpc('module_progress', { p_course, p_user })  (p_user facultatif)
-- ---------------------------------------------------------------------
create or replace function public.module_progress(p_course uuid, p_user uuid default null)
returns table (
  user_id uuid, module_id uuid, "position" int,
  total_lessons bigint, completed_lessons bigint, last_completed_at timestamptz,
  total_exercises bigint, submitted_exercises bigint, avg_grade numeric, best_quiz numeric
) language plpgsql stable security definer set search_path = public as $$
declare
  v_manager boolean := public.can_manage_company(public.course_company(p_course));
  v_user uuid := case when v_manager then p_user else auth.uid() end;
begin
  if not v_manager and p_user is not null and p_user <> auth.uid() then
    return;
  end if;
  return query
  select e.user_id, m.id, m.position,
    (select count(*) from public.lessons l where l.module_id = m.id),
    (select count(*) from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
       where l.module_id = m.id and lp.user_id = e.user_id and lp.completed),
    (select max(lp.completed_at) from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id
       where l.module_id = m.id and lp.user_id = e.user_id and lp.completed),
    (select count(*) from public.lessons l where l.module_id = m.id and l.type = 'exercise'),
    (select count(*) from public.exercise_submissions s join public.lessons l on l.id = s.lesson_id
       where l.module_id = m.id and s.user_id = e.user_id),
    (select round(avg(s.grade), 1) from public.exercise_submissions s join public.lessons l on l.id = s.lesson_id
       where l.module_id = m.id and s.user_id = e.user_id and s.grade is not null),
    (select max(qa.score) from public.quiz_attempts qa join public.lessons l on l.id = qa.lesson_id
       where l.module_id = m.id and qa.user_id = e.user_id)
  from public.enrollments e
  join public.modules m on m.course_id = e.course_id
  where e.course_id = p_course and (v_user is null or e.user_id = v_user)
  order by m.position;
end $$;
grant execute on function public.module_progress(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Stockage des fichiers
--    Créer dans Supabase > Storage un bucket PRIVÉ « documents » (e-books, attestations)
--    et servir les fichiers par URL signée (createSignedUrl) plutôt que par lien public.
--    Les PDF communs (support, livret) peuvent rester dans frontend/public/documents/.
-- ---------------------------------------------------------------------
