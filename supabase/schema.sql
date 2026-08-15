-- Lembar Kerja Mesin · hackathon demo schema
-- 在 Supabase SQL Editor 整份貼上執行。
-- 這是單組織 demo：anon key 可讀寫進度。正式上線前要改成 Auth + 收緊 RLS。

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  station text not null default '',
  role text not null check (role in ('worker', 'supervisor')),
  language text not null check (language in ('id', 'zh'))
);

create table if not exists public.training_sets (
  id text primary key,
  version integer not null default 1,
  doc_no text not null,
  title_id text not null,
  title_zh text not null,
  machine text not null default '',
  station text not null default '',
  summary_id text not null default '',
  summary_zh text not null default ''
);

create table if not exists public.parts (
  id text primary key,
  set_id text not null references public.training_sets (id) on delete cascade,
  version integer not null default 1,
  callout integer not null,
  name_id text not null,
  name_zh text not null,
  name_en text not null default '',
  function_id text not null default '',
  safety_id text not null default '',
  hotspot jsonb not null default '{"x":50,"y":50}',
  critical boolean not null default false
);

create table if not exists public.assignments (
  employee_id text not null references public.profiles (id) on delete cascade,
  set_id text not null references public.training_sets (id) on delete cascade,
  primary key (employee_id, set_id)
);

create table if not exists public.review_states (
  employee_id text not null references public.profiles (id) on delete cascade,
  part_id text not null references public.parts (id) on delete cascade,
  status text not null check (status in ('inbox', 'learning', 'mastered')),
  learned_at text not null default '',
  last_reviewed_at text not null default '',
  reviews jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (employee_id, part_id)
);

create table if not exists public.review_attempts (
  id text primary key,
  employee_id text not null references public.profiles (id) on delete cascade,
  part_id text not null references public.parts (id) on delete cascade,
  review_id text not null default '',
  rating text not null default '',
  quiz_kind text not null,
  quiz_correct boolean,
  response text not null default '',
  completed_at timestamptz not null default now()
);

create index if not exists review_attempts_employee_idx
  on public.review_attempts (employee_id, completed_at desc);

alter table public.profiles enable row level security;
alter table public.training_sets enable row level security;
alter table public.parts enable row level security;
alter table public.assignments enable row level security;
alter table public.review_states enable row level security;
alter table public.review_attempts enable row level security;

drop policy if exists demo_read_profiles on public.profiles;
drop policy if exists demo_read_sets on public.training_sets;
drop policy if exists demo_read_parts on public.parts;
drop policy if exists demo_read_assignments on public.assignments;
drop policy if exists demo_all_states on public.review_states;
drop policy if exists demo_all_attempts on public.review_attempts;
drop policy if exists demo_write_catalog_profiles on public.profiles;
drop policy if exists demo_write_catalog_sets on public.training_sets;
drop policy if exists demo_write_catalog_parts on public.parts;
drop policy if exists demo_write_catalog_assignments on public.assignments;
drop policy if exists demo_update_catalog_profiles on public.profiles;
drop policy if exists demo_update_catalog_sets on public.training_sets;
drop policy if exists demo_update_catalog_parts on public.parts;
drop policy if exists demo_update_catalog_assignments on public.assignments;

create policy demo_read_profiles on public.profiles for select using (true);
create policy demo_read_sets on public.training_sets for select using (true);
create policy demo_read_parts on public.parts for select using (true);
create policy demo_read_assignments on public.assignments for select using (true);

create policy demo_write_catalog_profiles on public.profiles for insert with check (true);
create policy demo_write_catalog_sets on public.training_sets for insert with check (true);
create policy demo_write_catalog_parts on public.parts for insert with check (true);
create policy demo_write_catalog_assignments on public.assignments for insert with check (true);
create policy demo_update_catalog_profiles on public.profiles for update using (true) with check (true);
create policy demo_update_catalog_sets on public.training_sets for update using (true) with check (true);
create policy demo_update_catalog_parts on public.parts for update using (true) with check (true);
create policy demo_update_catalog_assignments on public.assignments for update using (true) with check (true);

create policy demo_all_states on public.review_states for all using (true) with check (true);
create policy demo_all_attempts on public.review_attempts for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'review_states'
  ) then
    execute 'alter publication supabase_realtime add table public.review_states';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'review_attempts'
  ) then
    execute 'alter publication supabase_realtime add table public.review_attempts';
  end if;
end $$;
