-- MCE Studio: additive migration, no existing records modified.
begin;
create table if not exists public.mce_studio_templates (
 id uuid primary key default gen_random_uuid(), name text not null, payload jsonb not null,
 created_by uuid references public.profiles(id) on delete set null default auth.uid(),
 updated_at timestamptz not null default now()
);
alter table public.mce_studio_templates enable row level security;
drop policy if exists studio_admin on public.mce_studio_templates;
create policy studio_admin on public.mce_studio_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.mce_studio_templates from anon, public;
grant select,insert,update,delete on public.mce_studio_templates to authenticated;
create or replace function public.mce_studio_create(p_spec jsonb, p_companies uuid[], p_source uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare cid uuid; courseid uuid; mid uuid; lid uuid; qid uuid; m jsonb; l jsonb; q jsonb; sm record; sl record; sq record; result jsonb := '[]'; mp int; lp int; qp int; mode text;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Accès administrateur requis'; end if;
 if p_spec is null or nullif(trim(p_spec->>'title'),'') is null then raise exception 'Titre requis'; end if;
 if coalesce(cardinality(p_companies),0) not between 1 and 50 then raise exception 'Sélectionnez 1 à 50 entreprises'; end if;
 if p_source is not null and not exists(select 1 from public.courses where id=p_source) then raise exception 'Formation source introuvable'; end if;
 if p_source is null and (jsonb_typeof(p_spec->'modules') is distinct from 'array' or coalesce(jsonb_array_length(p_spec->'modules'),0)=0) then raise exception 'Au moins un module requis'; end if;
 for cid in select distinct unnest(p_companies) loop
  if not exists(select 1 from public.companies where id=cid and is_active) then raise exception 'Entreprise inexistante ou suspendue'; end if;
  insert into public.courses(company_id,title,subtitle,description,category,level,estimated_minutes,is_published,created_by)
  values(cid,trim(p_spec->>'title'),p_spec->>'subtitle',p_spec->>'description',p_spec->>'category',coalesce(p_spec->>'level','debutant')::public.course_level,coalesce((p_spec->>'minutes')::int,0),false,auth.uid()) returning id into courseid;
  if p_source is not null then
   for sm in select * from public.modules where course_id=p_source order by position,id loop
    insert into public.modules(course_id,title,description,position) values(courseid,sm.title,sm.description,sm.position) returning id into mid;
    insert into public.module_settings(module_id,mode) values(mid,'closed') on conflict(module_id) do update set mode='closed',opens_at=null;
    for sl in select * from public.lessons where module_id=sm.id order by position,id loop
     insert into public.lessons(module_id,course_id,title,type,content,video_url,file_url,duration_minutes,passing_score,position) values(mid,courseid,sl.title,sl.type,sl.content,sl.video_url,sl.file_url,sl.duration_minutes,sl.passing_score,sl.position) returning id into lid;
     for sq in select * from public.quiz_questions where lesson_id=sl.id order by position,id loop
      insert into public.quiz_questions(lesson_id,question,options,position) values(lid,sq.question,sq.options,sq.position) returning id into qid;
      insert into public.quiz_answers(question_id,correct_index,explanation) select qid,correct_index,explanation from public.quiz_answers where question_id=sq.id;
     end loop;
    end loop;
   end loop;
  else
   mp:=0;
   for m in select value from jsonb_array_elements(p_spec->'modules') loop
    if nullif(trim(m->>'title'),'') is null then raise exception 'Titre de module requis'; end if;
    insert into public.modules(course_id,title,description,position,scheduled_date) values(courseid,trim(m->>'title'),m->>'description',mp,nullif(m->>'date','')::date) returning id into mid;
    mode:=coalesce(m->>'mode','closed');
    if mode not in ('closed','open','sequential','date') or (mode='date' and nullif(m->>'opens','') is null) then raise exception 'Mode ou date de déblocage invalide'; end if;
    insert into public.module_settings(module_id,mode,opens_at,requires_profile) values(mid,mode,case when mode='date' then nullif(m->>'opens','')::date else null end,coalesce((m->>'profile')::boolean,false)) on conflict(module_id) do update set mode=excluded.mode,opens_at=excluded.opens_at,requires_profile=excluded.requires_profile;
    lp:=0;
    for l in select value from jsonb_array_elements(coalesce(m->'lessons','[]')) loop
     if nullif(trim(l->>'title'),'') is null then raise exception 'Titre de contenu requis'; end if;
     insert into public.lessons(module_id,course_id,title,type,content,video_url,file_url,duration_minutes,passing_score,position) values(mid,courseid,trim(l->>'title'),(l->>'type')::public.lesson_type,l->>'content',nullif(l->>'video_url',''),nullif(l->>'file_url',''),coalesce((l->>'minutes')::int,5),coalesce((l->>'score')::int,70),lp) returning id into lid;
     if l->>'type'='quiz' then
      qp:=0;
      for q in select value from jsonb_array_elements(coalesce(l->'questions','[]')) loop
       if nullif(trim(q->>'question'),'') is null or jsonb_array_length(q->'options')<2 or q->>'correct' is null or (q->>'correct')::int not between 0 and jsonb_array_length(q->'options')-1 then raise exception 'Question de quiz invalide'; end if;
       insert into public.quiz_questions(lesson_id,question,options,position) values(lid,q->>'question',q->'options',qp) returning id into qid;
       insert into public.quiz_answers(question_id,correct_index,explanation) values(qid,(q->>'correct')::int,q->>'explanation'); qp:=qp+1;
      end loop;
      if qp=0 then raise exception 'Un quiz doit contenir une question'; end if;
     end if;
     lp:=lp+1;
    end loop;
    mp:=mp+1;
   end loop;
  end if;
  result:=result||jsonb_build_array(jsonb_build_object('id',courseid,'company_id',cid));
 end loop;
 return result;
end $$;
revoke all on function public.mce_studio_create(jsonb,uuid[],uuid) from public, anon;
grant execute on function public.mce_studio_create(jsonb,uuid[],uuid) to authenticated;
commit;
