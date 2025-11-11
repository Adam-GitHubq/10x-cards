-- migration: create core schema for flashcard generation
-- purpose: implement tables for llm generations, flashcards, and error logs with strict row-level security
-- tables: public.generations, public.flashcards, public.generation_error_logs
-- notes: installs pgcrypto extension, defines updated_at trigger helper, and creates granular policies per supabase role

begin;

-- ensure pgcrypto is available for digest operations on stored hashes.
create extension if not exists pgcrypto with schema extensions;

-- helper trigger to standardize updated_at timestamps in utc.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

-- table storing llm generation metadata per user.
create table public.generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash bytea not null,
  source_text_length int not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  generated_count integer not null,
  generation_duration integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint generations_source_text_length_check check (source_text_length between 1000 and 10000)
);

-- automatically maintain updated_at for generations.
create trigger generations_set_updated_at
before update on public.generations
for each row
execute function public.set_updated_at();

-- accelerate lookups by owner.
create index generations_user_idx on public.generations (user_id);

-- enforce row level security for generations.
alter table public.generations enable row level security;

-- policy: allow authenticated users to read only their generations.
create policy generations_select_authenticated
on public.generations
for select
to authenticated
using (user_id = auth.uid());

-- policy: allow anon users (pre-auth flow) to read only their generations if ever applicable.
create policy generations_select_anon
on public.generations
for select
to anon
using (user_id = auth.uid());

-- policy: allow authenticated users to insert generations they own.
create policy generations_insert_authenticated
on public.generations
for insert
to authenticated
with check (user_id = auth.uid());

-- policy: allow anon users to insert only when user_id matches session uid.
create policy generations_insert_anon
on public.generations
for insert
to anon
with check (user_id = auth.uid());

-- policy: allow authenticated users to update only their records.
create policy generations_update_authenticated
on public.generations
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- policy: allow anon users to update only their records (covers invite flows).
create policy generations_update_anon
on public.generations
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- policy: allow authenticated users to delete their records.
create policy generations_delete_authenticated
on public.generations
for delete
to authenticated
using (user_id = auth.uid());

-- policy: allow anon users to delete their records when appropriate.
create policy generations_delete_anon
on public.generations
for delete
to anon
using (user_id = auth.uid());

-- table storing individual flashcards with provenance references.
create table public.flashcards (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id bigint references public.generations(id) on delete set null,
  source varchar not null,
  front varchar(200) not null,
  back varchar(500) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint flashcards_source_check check (source in ('ai-full', 'ai-edited', 'manual')),
  constraint flashcards_front_not_empty check (front <> ''),
  constraint flashcards_back_not_empty check (back <> ''),
  constraint flashcards_generation_consistency check (
    (source = 'manual' and generation_id is null)
    or (source in ('ai-full', 'ai-edited') and generation_id is not null)
  )
);

-- automatically maintain updated_at for flashcards.
create trigger flashcards_set_updated_at
before update on public.flashcards
for each row
execute function public.set_updated_at();

-- indices for frequent queries.
create index flashcards_user_idx on public.flashcards (user_id);
create index flashcards_generation_id_idx on public.flashcards (generation_id);

-- enforce row level security for flashcards.
alter table public.flashcards enable row level security;

-- policy: authenticated users can view only their flashcards.
create policy flashcards_select_authenticated
on public.flashcards
for select
to authenticated
using (user_id = auth.uid());

-- policy: anon users can view only their flashcards (e.g. onboarding).
create policy flashcards_select_anon
on public.flashcards
for select
to anon
using (user_id = auth.uid());

-- policy: authenticated users can insert flashcards they own.
create policy flashcards_insert_authenticated
on public.flashcards
for insert
to authenticated
with check (user_id = auth.uid());

-- policy: anon users can insert flashcards they own (e.g. temporary sessions).
create policy flashcards_insert_anon
on public.flashcards
for insert
to anon
with check (user_id = auth.uid());

-- policy: authenticated users can update their own flashcards.
create policy flashcards_update_authenticated
on public.flashcards
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- policy: anon users can update their own flashcards.
create policy flashcards_update_anon
on public.flashcards
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- policy: authenticated users can delete their flashcards.
create policy flashcards_delete_authenticated
on public.flashcards
for delete
to authenticated
using (user_id = auth.uid());

-- policy: anon users can delete their flashcards.
create policy flashcards_delete_anon
on public.flashcards
for delete
to anon
using (user_id = auth.uid());

-- table logging failed generation attempts for auditing and reliability.
create table public.generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash bytea not null,
  source_text_length int not null,
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint generation_error_logs_source_text_length_check check (source_text_length between 1000 and 10000)
);

-- index to query logs by owner.
create index generation_error_logs_user_idx on public.generation_error_logs (user_id);

-- enforce row level security for generation error logs.
alter table public.generation_error_logs enable row level security;

-- policy: authenticated users can see only their error logs.
create policy generation_error_logs_select_authenticated
on public.generation_error_logs
for select
to authenticated
using (user_id = auth.uid());

-- policy: anon users can see only their error logs.
create policy generation_error_logs_select_anon
on public.generation_error_logs
for select
to anon
using (user_id = auth.uid());

-- policy: authenticated users can insert their own error logs.
create policy generation_error_logs_insert_authenticated
on public.generation_error_logs
for insert
to authenticated
with check (user_id = auth.uid());

-- policy: anon users can insert their own error logs.
create policy generation_error_logs_insert_anon
on public.generation_error_logs
for insert
to anon
with check (user_id = auth.uid());

-- policy: authenticated users can update their own error logs if ever necessary.
create policy generation_error_logs_update_authenticated
on public.generation_error_logs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- policy: anon users can update their own error logs when permitted.
create policy generation_error_logs_update_anon
on public.generation_error_logs
for update
to anon
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- policy: authenticated users can delete their own error logs.
create policy generation_error_logs_delete_authenticated
on public.generation_error_logs
for delete
to authenticated
using (user_id = auth.uid());

-- policy: anon users can delete their own error logs.
create policy generation_error_logs_delete_anon
on public.generation_error_logs
for delete
to anon
using (user_id = auth.uid());

commit;

