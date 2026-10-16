-- Career Compass: run once in Supabase SQL Editor. No destructive resets.
-- This migration is transactional; it is safe to re-run with the same schema.
-- Browser roles have no access. Express exclusively uses the server secret.
begin;
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.profiles (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
comment on column public.profiles.data is 'Existing UserProfile fields, nested education/experience, progress and activity log. API owns validation and completeness.';

create table if not exists public.applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 job_id text,
 job_title text,
 company text,
 status text not null default 'applied' check (status in ('applied', 'under_review', 'interview', 'offer', 'accepted', 'rejected')),
 applied_date date,
 next_step text,
 notes text,
 interview_date timestamptz,
 calendar_added boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.saved_jobs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 job_id text not null,
 job_title text,
 company text,
 saved_date date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (user_id, job_id)
);

create table if not exists public.conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 title text,
 messages jsonb not null default '[]'::jsonb check (jsonb_typeof(messages) = 'array'),
 mode text check (mode in ('interview', 'roadmap')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.skill_progress (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 skill_name text not null,
 category text check (category in ('technical', 'soft', 'domain')),
 current_level text check (current_level in ('beginner', 'intermediate', 'advanced', 'expert')),
 target_level text check (target_level in ('beginner', 'intermediate', 'advanced', 'expert')),
 status text check (status in ('matched', 'partial', 'missing')),
 importance text check (importance in ('high', 'medium', 'low')),
 resources jsonb not null default '[]'::jsonb check (jsonb_typeof(resources) = 'array'),
 progress integer not null default 0 check (progress between 0 and 100),
 target_date date,
 description text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (user_id, skill_name)
);

-- CSV job IDs are stable external text identifiers, not database-generated UUIDs.
-- Imported custom jobs are separate; the bundled CSV is never copied into the database.
create table if not exists public.jobs (id uuid primary key default gen_random_uuid(), data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.resumes (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 original_filename text not null, blob_name text not null unique, mime_type text not null,
 file_size bigint not null check (file_size > 0),
 extraction_status text not null default 'uploaded' check (extraction_status in ('uploaded','completed','failed')),
 extracted_data jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
comment on column public.conversations.messages is 'Ordered role/content/timestamp history, updated atomically with conversation metadata.';

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update, delete on public.profiles to service_role;
drop trigger if exists update_timestamp on public.profiles;
create trigger update_timestamp before update on public.profiles for each row execute function public.set_updated_at();

alter table public.applications enable row level security;
revoke all on public.applications from anon, authenticated;
grant select, insert, update, delete on public.applications to service_role;
drop trigger if exists update_timestamp on public.applications;
create trigger update_timestamp before update on public.applications for each row execute function public.set_updated_at();
create index if not exists applications_user_created_idx on public.applications (user_id, created_at desc);

alter table public.saved_jobs enable row level security;
revoke all on public.saved_jobs from anon, authenticated;
grant select, insert, update, delete on public.saved_jobs to service_role;
drop trigger if exists update_timestamp on public.saved_jobs;
create trigger update_timestamp before update on public.saved_jobs for each row execute function public.set_updated_at();
create index if not exists saved_jobs_user_created_idx on public.saved_jobs (user_id, created_at desc);

alter table public.conversations enable row level security;
revoke all on public.conversations from anon, authenticated;
grant select, insert, update, delete on public.conversations to service_role;
drop trigger if exists update_timestamp on public.conversations;
create trigger update_timestamp before update on public.conversations for each row execute function public.set_updated_at();
create index if not exists conversations_user_created_idx on public.conversations (user_id, created_at desc);

alter table public.skill_progress enable row level security;
revoke all on public.skill_progress from anon, authenticated;
grant select, insert, update, delete on public.skill_progress to service_role;
drop trigger if exists update_timestamp on public.skill_progress;
create trigger update_timestamp before update on public.skill_progress for each row execute function public.set_updated_at();
create index if not exists skill_progress_user_created_idx on public.skill_progress (user_id, created_at desc);

alter table public.resumes enable row level security;
revoke all on public.resumes from anon, authenticated;
grant select, insert, update, delete on public.resumes to service_role;
drop trigger if exists update_timestamp on public.resumes;
create trigger update_timestamp before update on public.resumes for each row execute function public.set_updated_at();
create index if not exists resumes_user_created_idx on public.resumes (user_id, created_at desc);

alter table public.jobs enable row level security;
revoke all on public.jobs from anon, authenticated;
grant select, insert, update, delete on public.jobs to service_role;
drop trigger if exists update_timestamp on public.jobs;
create trigger update_timestamp before update on public.jobs for each row execute function public.set_updated_at();

create index if not exists applications_user_status_idx on public.applications (user_id, status);
-- Transactional roadmap replacement: failed inserts roll back the deletion.
create or replace function public.replace_skill_progress(owner_id uuid, skills jsonb) returns setof public.skill_progress
language plpgsql set search_path = public as $$
begin
 perform id from public.profiles where id = owner_id for update;
 delete from public.skill_progress where user_id = owner_id;
 return query insert into public.skill_progress (user_id, skill_name, category, current_level, target_level, status, importance, resources, progress, target_date, description)
 select owner_id, x.skill_name, x.category, x.current_level, x.target_level, x.status, x.importance, coalesce(x.resources, '[]'::jsonb), coalesce(x.progress, 0), x.target_date, x.description
 from jsonb_to_recordset(skills) as x(skill_name text, category text, current_level text, target_level text, status text, importance text, resources jsonb, progress integer, target_date date, description text) returning *;
end; $$;
revoke all on function public.replace_skill_progress(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.replace_skill_progress(uuid,jsonb) to service_role;
commit;
