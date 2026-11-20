-- =====================================================================
--  MCE ACADEMY — Schéma Supabase (PostgreSQL)
--  Multi-entreprises · Rôles : admin / trainer (formateur) / learner (apprenant)
--  À exécuter en une fois dans : Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. TYPES
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'trainer', 'learner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lesson_type as enum ('video', 'text', 'quiz', 'exercise', 'document');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.course_level as enum ('debutant', 'intermediaire', 'avance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum ('submitted', 'graded', 'returned');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

-- Entreprises clientes : chacune possède son propre espace
create table if not exists public.companies (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  logo_url       text,
  sector         text,
  contact_email  text,
  max_learners   integer,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Profils (1-1 avec auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  company_id    uuid references public.companies(id) on delete set null,
  role          public.user_role not null default 'learner',
  full_name     text not null default '',
  email         text,
  avatar_url    text,
  job_title     text,
  is_active     boolean not null default true,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists profiles_company_idx on public.profiles(company_id);

-- Cours
create table if not exists public.courses (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  title              text not null,
  subtitle           text,
  description        text,
  cover_url          text,
  category           text,
  level              public.course_level not null default 'debutant',
  estimated_minutes  integer not null default 0,
  is_published       boolean not null default false,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists courses_company_idx on public.courses(company_id);

-- Modules (chapitres)
create table if not exists public.modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  description  text,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists modules_course_idx on public.modules(course_id);

-- Leçons (vidéo, texte, quiz, exercice, document)
create table if not exists public.lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.modules(id) on delete cascade,
  course_id         uuid references public.courses(id) on delete cascade,
  title             text not null,
  type              public.lesson_type not null default 'text',
  content           text,
  video_url         text,
  file_url          text,
  duration_minutes  integer not null default 5,
  passing_score     integer not null default 70,
  position          integer not null default 0,
  created_at        timestamptz not null default now()
);
create index if not exists lessons_module_idx on public.lessons(module_id);
create index if not exists lessons_course_idx on public.lessons(course_id);

-- Questions de quiz (visibles par l'apprenant)
create table if not exists public.quiz_questions (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  question   text not null,
  options    jsonb not null default '[]'::jsonb,
  position   integer not null default 0
);
create index if not exists quiz_questions_lesson_idx on public.quiz_questions(lesson_id);

-- Bonnes réponses (cachées aux apprenants — correction côté serveur)
create table if not exists public.quiz_answers (
  question_id    uuid primary key references public.quiz_questions(id) on delete cascade,
  correct_index  integer not null default 0,
  explanation    text
);

-- Inscriptions aux cours
create table if not exists public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  unique (user_id, course_id)
);
create index if not exists enrollments_course_idx on public.enrollments(course_id);

-- Progression par leçon
create table if not exists public.lesson_progress (
  user_id             uuid not null references public.profiles(id) on delete cascade,
  lesson_id           uuid not null references public.lessons(id) on delete cascade,
  course_id           uuid not null references public.courses(id) on delete cascade,
  completed           boolean not null default false,
  completed_at        timestamptz,
  time_spent_seconds  integer not null default 0,
  last_viewed_at      timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index if not exists lesson_progress_course_idx on public.lesson_progress(course_id);

-- Tentatives de quiz (notes automatiques)
create table if not exists public.quiz_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  lesson_id        uuid not null references public.lessons(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  score            numeric(5,2) not null default 0,
  correct_count    integer not null default 0,
  total_questions  integer not null default 0,
  passed           boolean not null default false,
  answers          jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id);

-- Rendus d'exercices (notés par le formateur, sur 20)
create table if not exists public.exercise_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  content       text,
  file_url      text,
  status        public.submission_status not null default 'submitted',
  grade         numeric(4,2) check (grade is null or (grade >= 0 and grade <= 20)),
  feedback      text,
  graded_by     uuid references public.profiles(id) on delete set null,
  submitted_at  timestamptz not null default now(),
  graded_at     timestamptz,
  unique (user_id, lesson_id)
);
create index if not exists exercise_submissions_course_idx on public.exercise_submissions(course_id);

-- Sessions de connexion (temps passé sur la plateforme)
create table if not exists public.user_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  company_id        uuid references public.companies(id) on delete cascade,
  started_at        timestamptz not null default now(),
  last_ping_at      timestamptz not null default now(),
  duration_seconds  integer not null default 0
);
create index if not exists user_sessions_user_idx on public.user_sessions(user_id, last_ping_at desc);
create index if not exists user_sessions_company_idx on public.user_sessions(company_id, started_at);

-- Annonces du formateur aux apprenants de l'entreprise
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  title       text not null,
  body        text,
  created_at  timestamptz not null default now()
);
create index if not exists announcements_company_idx on public.announcements(company_id, created_at desc);

-- ---------------------------------------------------------------------
-- 3. FONCTIONS UTILITAIRES (security definer => pas de récursion RLS)
-- ---------------------------------------------------------------------
create or replace function public.auth_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.auth_company()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' and is_active from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_trainer_of(p_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'trainer' and is_active and company_id = p_company
  )
$$;

create or replace function public.can_manage_company(p_company uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or public.is_trainer_of(p_company)
$$;

create or replace function public.course_company(p_course uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.courses where id = p_course
$$;

create or replace function public.lesson_course(p_lesson uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.lessons where id = p_lesson
$$;

create or replace function public.question_company(p_question uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select c.company_id
  from public.quiz_questions q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where q.id = p_question
$$;

-- Un cours est visible : admin => tout ; formateur => cours de son entreprise ;
-- apprenant => cours PUBLIÉS de son entreprise (compte actif, entreprise non suspendue).
create or replace function public.can_view_course(p_course uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.courses c
    join public.companies co on co.id = c.company_id
    join public.profiles p on p.id = auth.uid()
    where c.id = p_course
      and p.is_active
      and (
        p.role = 'admin'
        or (co.is_active and c.company_id = p.company_id and (c.is_published or p.role = 'trainer'))
      )
  )
$$;

-- ---------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------

-- Création automatique du profil à l'inscription.
-- Le rôle et l'entreprise viennent de app_metadata (non modifiable par l'utilisateur).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, company_id)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'learner'),
    nullif(new.raw_app_meta_data ->> 'company_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Empêche un utilisateur de modifier son propre rôle / entreprise
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() est NULL pour la clé service_role et le SQL Editor : autorisé
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role
       or new.company_id is distinct from old.company_id then
      raise exception 'Seul un administrateur peut modifier le rôle ou l''entreprise.';
    end if;
    if new.is_active is distinct from old.is_active and not public.is_trainer_of(old.company_id) then
      raise exception 'Action non autorisée.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Renseigne lessons.course_id depuis le module
create or replace function public.set_lesson_course()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select course_id into new.course_id from public.modules where id = new.module_id;
  return new;
end $$;

drop trigger if exists lessons_set_course on public.lessons;
create trigger lessons_set_course
  before insert or update of module_id on public.lessons
  for each row execute function public.set_lesson_course();

-- updated_at des cours
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists courses_touch on public.courses;
create trigger courses_touch
  before update on public.courses
  for each row execute function public.touch_updated_at();

-- Un apprenant ne peut pas se noter lui-même
create or replace function public.protect_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.can_manage_company(public.course_company(new.course_id)) then
    if tg_op = 'INSERT' then
      new.grade := null; new.feedback := null; new.graded_by := null;
      new.graded_at := null; new.status := 'submitted';
    else
      new.grade := old.grade; new.feedback := old.feedback; new.graded_by := old.graded_by;
      new.graded_at := old.graded_at; new.status := 'submitted';
      new.user_id := old.user_id; new.lesson_id := old.lesson_id; new.course_id := old.course_id;
      new.submitted_at := now();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists submissions_protect on public.exercise_submissions;
create trigger submissions_protect
  before insert or update on public.exercise_submissions
  for each row execute function public.protect_submission();

-- Marque l'inscription comme terminée quand toutes les leçons sont faites
create or replace function public.refresh_enrollment_completion()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_done  int;
begin
  select count(*) into v_total from public.lessons where course_id = new.course_id;
  select count(*) into v_done from public.lesson_progress
    where course_id = new.course_id and user_id = new.user_id and completed;

  -- inscription automatique si l'apprenant progresse sans être inscrit
  insert into public.enrollments (user_id, course_id)
  values (new.user_id, new.course_id)
  on conflict (user_id, course_id) do nothing;

  update public.enrollments
     set completed_at = case when v_total > 0 and v_done >= v_total
                             then coalesce(completed_at, now()) else null end
   where user_id = new.user_id and course_id = new.course_id;
  return new;
end $$;

drop trigger if exists progress_completion on public.lesson_progress;
create trigger progress_completion
  after insert or update of completed on public.lesson_progress
  for each row execute function public.refresh_enrollment_completion();

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.companies            enable row level security;
alter table public.profiles             enable row level security;
alter table public.courses              enable row level security;
alter table public.modules              enable row level security;
alter table public.lessons              enable row level security;
alter table public.quiz_questions       enable row level security;
alter table public.quiz_answers         enable row level security;
alter table public.enrollments          enable row level security;
alter table public.lesson_progress      enable row level security;
alter table public.quiz_attempts        enable row level security;
alter table public.exercise_submissions enable row level security;
alter table public.user_sessions        enable row level security;
alter table public.announcements        enable row level security;

-- COMPANIES
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select
  using (public.is_admin() or id = public.auth_company());
drop policy if exists companies_insert on public.companies;
create policy companies_insert on public.companies for insert
  with check (public.is_admin());
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update
  using (public.can_manage_company(id)) with check (public.can_manage_company(id));
drop policy if exists companies_delete on public.companies;
create policy companies_delete on public.companies for delete
  using (public.is_admin());

-- PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or public.is_trainer_of(company_id)
  );
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.is_trainer_of(company_id) and role = 'learner')
  );
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (public.is_admin());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete
  using (public.is_admin());

-- COURSES
drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses for select
  using (public.can_view_course(id));
drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses for all
  using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));

-- MODULES
drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules for select
  using (public.can_view_course(course_id));
drop policy if exists modules_write on public.modules;
create policy modules_write on public.modules for all
  using (public.can_manage_company(public.course_company(course_id)))
  with check (public.can_manage_company(public.course_company(course_id)));

-- LESSONS
drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons for select
  using (public.can_view_course(course_id));
drop policy if exists lessons_write on public.lessons;
create policy lessons_write on public.lessons for all
  using (public.can_manage_company(public.course_company(course_id)))
  with check (public.can_manage_company(public.course_company(course_id)));

-- QUIZ QUESTIONS
drop policy if exists quiz_questions_select on public.quiz_questions;
create policy quiz_questions_select on public.quiz_questions for select
  using (public.can_view_course(public.lesson_course(lesson_id)));
drop policy if exists quiz_questions_write on public.quiz_questions;
create policy quiz_questions_write on public.quiz_questions for all
  using (public.can_manage_company(public.course_company(public.lesson_course(lesson_id))))
  with check (public.can_manage_company(public.course_company(public.lesson_course(lesson_id))));

-- QUIZ ANSWERS (formateurs / admin uniquement)
drop policy if exists quiz_answers_all on public.quiz_answers;
create policy quiz_answers_all on public.quiz_answers for all
  using (public.can_manage_company(public.question_company(question_id)))
  with check (public.can_manage_company(public.question_company(question_id)));

-- ENROLLMENTS
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select
  using (user_id = auth.uid() or public.can_manage_company(public.course_company(course_id)));
drop policy if exists enrollments_insert on public.enrollments;
create policy enrollments_insert on public.enrollments for insert
  with check (
    (user_id = auth.uid() and public.can_view_course(course_id))
    or public.can_manage_company(public.course_company(course_id))
  );
drop policy if exists enrollments_delete on public.enrollments;
create policy enrollments_delete on public.enrollments for delete
  using (public.can_manage_company(public.course_company(course_id)));

-- LESSON PROGRESS
drop policy if exists progress_select on public.lesson_progress;
create policy progress_select on public.lesson_progress for select
  using (user_id = auth.uid() or public.can_manage_company(public.course_company(course_id)));
drop policy if exists progress_insert on public.lesson_progress;
create policy progress_insert on public.lesson_progress for insert
  with check (user_id = auth.uid() and public.can_view_course(course_id));
drop policy if exists progress_update on public.lesson_progress;
create policy progress_update on public.lesson_progress for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists progress_delete on public.lesson_progress;
create policy progress_delete on public.lesson_progress for delete
  using (public.can_manage_company(public.course_company(course_id)));

-- QUIZ ATTEMPTS (insertion uniquement via la fonction submit_quiz)
drop policy if exists attempts_select on public.quiz_attempts;
create policy attempts_select on public.quiz_attempts for select
  using (user_id = auth.uid() or public.can_manage_company(public.course_company(course_id)));
drop policy if exists attempts_delete on public.quiz_attempts;
create policy attempts_delete on public.quiz_attempts for delete
  using (public.can_manage_company(public.course_company(course_id)));

-- EXERCISE SUBMISSIONS
drop policy if exists submissions_select on public.exercise_submissions;
create policy submissions_select on public.exercise_submissions for select
  using (user_id = auth.uid() or public.can_manage_company(public.course_company(course_id)));
drop policy if exists submissions_insert on public.exercise_submissions;
create policy submissions_insert on public.exercise_submissions for insert
  with check (user_id = auth.uid() and public.can_view_course(course_id));
drop policy if exists submissions_update on public.exercise_submissions;
create policy submissions_update on public.exercise_submissions for update
  using (user_id = auth.uid() or public.can_manage_company(public.course_company(course_id)));
drop policy if exists submissions_delete on public.exercise_submissions;
create policy submissions_delete on public.exercise_submissions for delete
  using (public.can_manage_company(public.course_company(course_id)));

-- USER SESSIONS (écriture via heartbeat())
drop policy if exists sessions_select on public.user_sessions;
create policy sessions_select on public.user_sessions for select
  using (user_id = auth.uid() or public.can_manage_company(company_id));

-- ANNOUNCEMENTS
drop policy if exists announcements_select on public.announcements;
create policy announcements_select on public.announcements for select
  using (public.is_admin() or company_id = public.auth_company());
drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements for all
  using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));

-- ---------------------------------------------------------------------
-- 6. FONCTIONS MÉTIER (RPC)
-- ---------------------------------------------------------------------

-- Correction d'un quiz côté serveur
create or replace function public.submit_quiz(p_lesson_id uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_course   uuid;
  v_pass     int;
  v_total    int := 0;
  v_correct  int := 0;
  v_score    numeric;
  v_passed   boolean;
  v_given    int;
  v_details  jsonb := '[]'::jsonb;
  r          record;
begin
  if auth.uid() is null then raise exception 'Non authentifié'; end if;

  select course_id, passing_score into v_course, v_pass
  from public.lessons where id = p_lesson_id and type = 'quiz';

  if v_course is null or not public.can_view_course(v_course) then
    raise exception 'Accès refusé';
  end if;

  for r in
    select q.id, a.correct_index, a.explanation
    from public.quiz_questions q
    left join public.quiz_answers a on a.question_id = q.id
    where q.lesson_id = p_lesson_id
    order by q.position
  loop
    v_total := v_total + 1;
    v_given := nullif(p_answers ->> r.id::text, '')::int;
    if v_given is not null and v_given = r.correct_index then
      v_correct := v_correct + 1;
    end if;
    v_details := v_details || jsonb_build_array(jsonb_build_object(
      'question_id',   r.id,
      'given',         v_given,
      'correct_index', r.correct_index,
      'is_correct',    coalesce(v_given = r.correct_index, false),
      'explanation',   r.explanation
    ));
  end loop;

  v_score  := case when v_total = 0 then 0 else round(v_correct * 100.0 / v_total, 2) end;
  v_passed := v_score >= coalesce(v_pass, 70);

  insert into public.quiz_attempts (user_id, lesson_id, course_id, score, correct_count, total_questions, passed, answers)
  values (auth.uid(), p_lesson_id, v_course, v_score, v_correct, v_total, v_passed, p_answers);

  if v_passed then
    insert into public.lesson_progress (user_id, lesson_id, course_id, completed, completed_at, last_viewed_at)
    values (auth.uid(), p_lesson_id, v_course, true, now(), now())
    on conflict (user_id, lesson_id) do update
      set completed = true,
          completed_at = coalesce(public.lesson_progress.completed_at, now()),
          last_viewed_at = now();
  end if;

  return jsonb_build_object(
    'score', v_score, 'correct', v_correct, 'total', v_total,
    'passed', v_passed, 'passing_score', coalesce(v_pass, 70), 'details', v_details
  );
end $$;

-- Battement de cœur : temps de connexion + temps passé par leçon
create or replace function public.heartbeat(p_lesson_id uuid default null, p_seconds int default 60)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_sid      uuid;
  v_company  uuid;
  v_secs     int := least(greatest(coalesce(p_seconds, 0), 0), 120);
begin
  if auth.uid() is null then return; end if;

  update public.profiles set last_seen_at = now()
  where id = auth.uid()
  returning company_id into v_company;

  select id into v_sid from public.user_sessions
  where user_id = auth.uid() and last_ping_at > now() - interval '3 minutes'
  order by last_ping_at desc limit 1;

  if v_sid is null then
    insert into public.user_sessions (user_id, company_id, started_at, last_ping_at, duration_seconds)
    values (auth.uid(), v_company, now(), now(), 0);
  else
    update public.user_sessions
       set last_ping_at = now(), duration_seconds = duration_seconds + v_secs
     where id = v_sid;
  end if;

  if p_lesson_id is not null and v_secs > 0 then
    insert into public.lesson_progress (user_id, lesson_id, course_id, time_spent_seconds, last_viewed_at)
    select auth.uid(), l.id, l.course_id, v_secs, now()
    from public.lessons l
    where l.id = p_lesson_id and public.can_view_course(l.course_id)
    on conflict (user_id, lesson_id) do update
      set time_spent_seconds = public.lesson_progress.time_spent_seconds + excluded.time_spent_seconds,
          last_viewed_at = now();
  end if;
end $$;

-- Progression par cours pour un utilisateur
create or replace function public.course_progress_for_user(p_user uuid default null)
returns table (
  course_id uuid, total_lessons bigint, completed_lessons bigint,
  progress_pct numeric, time_spent_seconds bigint, last_viewed_at timestamptz,
  enrolled_at timestamptz, completed_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with target as (
    select coalesce(p_user, auth.uid()) as uid
  ), allowed as (
    select t.uid from target t
    join public.profiles p on p.id = t.uid
    where t.uid = auth.uid() or public.can_manage_company(p.company_id)
  )
  select
    e.course_id,
    (select count(*) from public.lessons l where l.course_id = e.course_id),
    (select count(*) from public.lesson_progress lp
       where lp.course_id = e.course_id and lp.user_id = e.user_id and lp.completed),
    case when (select count(*) from public.lessons l where l.course_id = e.course_id) = 0 then 0
         else round(100.0 *
           (select count(*) from public.lesson_progress lp
              where lp.course_id = e.course_id and lp.user_id = e.user_id and lp.completed)
           / (select count(*) from public.lessons l where l.course_id = e.course_id))
    end,
    coalesce((select sum(lp.time_spent_seconds) from public.lesson_progress lp
       where lp.course_id = e.course_id and lp.user_id = e.user_id), 0),
    (select max(lp.last_viewed_at) from public.lesson_progress lp
       where lp.course_id = e.course_id and lp.user_id = e.user_id),
    e.enrolled_at,
    e.completed_at
  from public.enrollments e
  join allowed a on a.uid = e.user_id
$$;

-- Tableau de bord formateur : statistiques par apprenant
create or replace function public.company_learner_stats(p_company uuid)
returns table (
  user_id uuid, full_name text, email text, job_title text, is_active boolean,
  last_seen_at timestamptz, created_at timestamptz,
  total_seconds bigint, sessions_count bigint,
  enrolled_courses bigint, completed_courses bigint,
  lessons_completed bigint, total_lessons bigint, progress_pct numeric,
  avg_quiz_score numeric, avg_exercise_grade numeric
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.full_name, p.email, p.job_title, p.is_active, p.last_seen_at, p.created_at,
    coalesce(s.total_seconds, 0), coalesce(s.sessions_count, 0),
    coalesce(e.enrolled, 0), coalesce(e.completed, 0),
    coalesce(lp.done, 0), coalesce(tl.total, 0),
    case when coalesce(tl.total, 0) = 0 then 0 else round(100.0 * coalesce(lp.done, 0) / tl.total) end,
    q.avg_score, x.avg_grade
  from public.profiles p
  left join lateral (
    select sum(duration_seconds)::bigint as total_seconds, count(*) as sessions_count
    from public.user_sessions where user_id = p.id
  ) s on true
  left join lateral (
    select count(*) as enrolled, count(completed_at) as completed
    from public.enrollments where user_id = p.id
  ) e on true
  left join lateral (
    select count(*) as done from public.lesson_progress lp2
    join public.enrollments en on en.user_id = lp2.user_id and en.course_id = lp2.course_id
    where lp2.user_id = p.id and lp2.completed
  ) lp on true
  left join lateral (
    select count(*) as total from public.lessons l
    join public.enrollments en on en.course_id = l.course_id
    where en.user_id = p.id
  ) tl on true
  left join lateral (
    select round(avg(best), 1) as avg_score from (
      select max(score) as best from public.quiz_attempts where user_id = p.id group by lesson_id
    ) b
  ) q on true
  left join lateral (
    select round(avg(grade), 1) as avg_grade
    from public.exercise_submissions where user_id = p.id and grade is not null
  ) x on true
  where p.company_id = p_company
    and p.role = 'learner'
    and public.can_manage_company(p_company)
  order by p.full_name
$$;

-- Statistiques par cours d'une entreprise
create or replace function public.company_course_stats(p_company uuid)
returns table (
  course_id uuid, title text, is_published boolean, total_lessons bigint,
  enrolled bigint, completed bigint, avg_progress numeric, avg_quiz_score numeric
)
language sql stable security definer set search_path = public as $$
  select
    c.id, c.title, c.is_published,
    (select count(*) from public.lessons l where l.course_id = c.id),
    (select count(*) from public.enrollments e where e.course_id = c.id),
    (select count(*) from public.enrollments e where e.course_id = c.id and e.completed_at is not null),
    coalesce((
      select round(avg(pct)) from (
        select case when t.total = 0 then 0 else 100.0 * count(lp.lesson_id) filter (where lp.completed) / t.total end as pct
        from public.enrollments e
        cross join (select count(*) as total from public.lessons l where l.course_id = c.id) t
        left join public.lesson_progress lp on lp.user_id = e.user_id and lp.course_id = c.id
        where e.course_id = c.id
        group by e.user_id, t.total
      ) z
    ), 0),
    (select round(avg(score), 1) from public.quiz_attempts qa where qa.course_id = c.id)
  from public.courses c
  where c.company_id = p_company and public.can_manage_company(p_company)
  order by c.created_at desc
$$;

-- Activité quotidienne (minutes + utilisateurs actifs). p_company NULL = toute la plateforme (admin)
create or replace function public.activity_by_day(p_company uuid default null, p_days int default 14)
returns table (day date, minutes numeric, active_users bigint)
language sql stable security definer set search_path = public as $$
  with days as (
    select generate_series(current_date - (greatest(p_days, 1) - 1), current_date, interval '1 day')::date as day
  )
  select d.day,
         coalesce(round(sum(s.duration_seconds) / 60.0, 1), 0),
         count(distinct s.user_id)
  from days d
  left join public.user_sessions s
    on s.started_at::date = d.day
   and (
     (p_company is null and public.is_admin())
     or (p_company is not null and s.company_id = p_company and public.can_manage_company(p_company))
   )
  group by d.day
  order by d.day
$$;

-- Statistiques globales (admin)
create or replace function public.platform_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.is_admin() then null else jsonb_build_object(
    'companies',   (select count(*) from public.companies),
    'admins',      (select count(*) from public.profiles where role = 'admin'),
    'trainers',    (select count(*) from public.profiles where role = 'trainer'),
    'learners',    (select count(*) from public.profiles where role = 'learner'),
    'courses',     (select count(*) from public.courses),
    'published',   (select count(*) from public.courses where is_published),
    'lessons',     (select count(*) from public.lessons),
    'enrollments', (select count(*) from public.enrollments),
    'completions', (select count(*) from public.enrollments where completed_at is not null),
    'hours',       (select coalesce(round(sum(duration_seconds) / 3600.0, 1), 0) from public.user_sessions),
    'active_7d',   (select count(*) from public.profiles where last_seen_at > now() - interval '7 days')
  ) end
$$;

-- Résumé par entreprise (admin)
create or replace function public.companies_overview()
returns table (
  company_id uuid, learners bigint, trainers bigint, courses bigint, total_hours numeric, last_activity timestamptz
)
language sql stable security definer set search_path = public as $$
  select c.id,
    (select count(*) from public.profiles p where p.company_id = c.id and p.role = 'learner'),
    (select count(*) from public.profiles p where p.company_id = c.id and p.role = 'trainer'),
    (select count(*) from public.courses co where co.company_id = c.id),
    (select coalesce(round(sum(s.duration_seconds) / 3600.0, 1), 0) from public.user_sessions s where s.company_id = c.id),
    (select max(p.last_seen_at) from public.profiles p where p.company_id = c.id)
  from public.companies c
  where public.is_admin()
$$;

-- ---------------------------------------------------------------------
-- 7. DROITS D'EXÉCUTION
-- ---------------------------------------------------------------------
revoke execute on function public.submit_quiz(uuid, jsonb)            from anon;
revoke execute on function public.heartbeat(uuid, int)                from anon;
revoke execute on function public.course_progress_for_user(uuid)      from anon;
revoke execute on function public.company_learner_stats(uuid)         from anon;
revoke execute on function public.company_course_stats(uuid)          from anon;
revoke execute on function public.activity_by_day(uuid, int)          from anon;
revoke execute on function public.platform_stats()                    from anon;
revoke execute on function public.companies_overview()                from anon;

-- ---------------------------------------------------------------------
-- 8. STOCKAGE (images de couverture, documents, rendus)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media_auth_upload" on storage.objects;
create policy "media_auth_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

drop policy if exists "media_owner_update" on storage.objects;
create policy "media_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and owner = auth.uid());

drop policy if exists "media_owner_delete" on storage.objects;
create policy "media_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or public.is_admin()));

-- =====================================================================
--  FIN — Créez ensuite le premier administrateur (voir README.md)
-- =====================================================================
