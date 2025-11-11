-- migration: disable row-level security for core tables
-- notes: drops existing policies and disables rls on generations, flashcards, generation_error_logs

begin;

-- drop policies on public.generations
drop policy if exists generations_select_authenticated on public.generations;
drop policy if exists generations_select_anon on public.generations;
drop policy if exists generations_insert_authenticated on public.generations;
drop policy if exists generations_insert_anon on public.generations;
drop policy if exists generations_update_authenticated on public.generations;
drop policy if exists generations_update_anon on public.generations;
drop policy if exists generations_delete_authenticated on public.generations;
drop policy if exists generations_delete_anon on public.generations;

-- disable row level security on public.generations
alter table public.generations disable row level security;

-- drop policies on public.flashcards
drop policy if exists flashcards_select_authenticated on public.flashcards;
drop policy if exists flashcards_select_anon on public.flashcards;
drop policy if exists flashcards_insert_authenticated on public.flashcards;
drop policy if exists flashcards_insert_anon on public.flashcards;
drop policy if exists flashcards_update_authenticated on public.flashcards;
drop policy if exists flashcards_update_anon on public.flashcards;
drop policy if exists flashcards_delete_authenticated on public.flashcards;
drop policy if exists flashcards_delete_anon on public.flashcards;

-- disable row level security on public.flashcards
alter table public.flashcards disable row level security;

-- drop policies on public.generation_error_logs
drop policy if exists generation_error_logs_select_authenticated on public.generation_error_logs;
drop policy if exists generation_error_logs_select_anon on public.generation_error_logs;
drop policy if exists generation_error_logs_insert_authenticated on public.generation_error_logs;
drop policy if exists generation_error_logs_insert_anon on public.generation_error_logs;
drop policy if exists generation_error_logs_update_authenticated on public.generation_error_logs;
drop policy if exists generation_error_logs_update_anon on public.generation_error_logs;
drop policy if exists generation_error_logs_delete_authenticated on public.generation_error_logs;
drop policy if exists generation_error_logs_delete_anon on public.generation_error_logs;

-- disable row level security on public.generation_error_logs
alter table public.generation_error_logs disable row level security;

commit;


