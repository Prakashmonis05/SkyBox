-- ==========================================================
-- SkyBox - Phase 3: Files Table, Storage Bucket & RLS
-- Run this in Supabase Project -> SQL Editor
-- ==========================================================

-- 1. Create Files Metadata Table
create table if not exists public.files (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  folder_id uuid references public.folders(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  is_starred boolean not null default false,
  deleted_at timestamp with time zone default null,
  last_accessed_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Indexes for fast lookups, hierarchy queries, and filters
create index if not exists idx_files_owner_id on public.files(owner_id);
create index if not exists idx_files_folder_id on public.files(folder_id);
create index if not exists idx_files_deleted_at on public.files(deleted_at);
create index if not exists idx_files_is_starred on public.files(is_starred);
create index if not exists idx_files_mime_type on public.files(mime_type);

-- 3. Enable Row Level Security (RLS) on Files Table
alter table public.files enable row level security;

-- 4. RLS Policies: Ensure users can only access their own file metadata
drop policy if exists "Users can view own files" on public.files;
create policy "Users can view own files"
  on public.files
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own files" on public.files;
create policy "Users can insert own files"
  on public.files
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own files" on public.files;
create policy "Users can update own files"
  on public.files
  for update
  using (auth.uid() = owner_id);

drop policy if exists "Users can delete own files" on public.files;
create policy "Users can delete own files"
  on public.files
  for delete
  using (auth.uid() = owner_id);

-- 5. Updated_at Trigger for files
drop trigger if exists on_file_updated on public.files;
create trigger on_file_updated
  before update on public.files
  for each row execute procedure public.handle_updated_at();

-- ==========================================================
-- 6. Storage Bucket Configuration (skybox-vault)
-- ==========================================================
-- Create the private bucket 'skybox-vault' if it does not already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skybox-vault', 'skybox-vault', false, 52428800, null)
on conflict (id) do update set public = false;

-- 7. Storage Policies: Objects restricted to authenticated owner by path prefix: <owner_id>/...
drop policy if exists "Users can upload their own files" on storage.objects;
create policy "Users can upload their own files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'skybox-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can view their own files" on storage.objects;
create policy "Users can view their own files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'skybox-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own files" on storage.objects;
create policy "Users can update their own files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'skybox-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own files" on storage.objects;
create policy "Users can delete their own files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'skybox-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
