-- Date pédagogique, indépendante des règles de déblocage.
-- Les politiques RLS existantes restent inchangées.
alter table public.modules add column if not exists scheduled_date date;
notify pgrst, 'reload schema';
