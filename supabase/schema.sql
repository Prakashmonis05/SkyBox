-- ==============================================================================
-- SkyBox — Complete Production Database Schema
-- Run this entire script in your Supabase Project -> SQL Editor
-- This script is idempotent: safe to run on a fresh database or an existing one.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE & AUTH TRIGGER
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Profiles RLS Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Trigger: auto-create profile on auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: auto-update updated_at on profile modification
drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4. FOLDERS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade,
  is_starred boolean default false not null,
  deleted_at timestamp with time zone default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_folders_owner_id on public.folders(owner_id);
create index if not exists idx_folders_parent_id on public.folders(parent_id);
create index if not exists idx_folders_deleted_at on public.folders(deleted_at);
create index if not exists idx_folders_is_starred on public.folders(is_starred);

alter table public.folders enable row level security;

-- Folders RLS Policies
drop policy if exists "Users can view own folders" on public.folders;
create policy "Users can view own folders"
  on public.folders
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own folders" on public.folders;
create policy "Users can insert own folders"
  on public.folders
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own folders" on public.folders;
create policy "Users can update own folders"
  on public.folders
  for update
  using (auth.uid() = owner_id);

drop policy if exists "Users can delete own folders" on public.folders;
create policy "Users can delete own folders"
  on public.folders
  for delete
  using (auth.uid() = owner_id);

drop trigger if exists on_folder_updated on public.folders;
create trigger on_folder_updated
  before update on public.folders
  for each row execute procedure public.handle_updated_at();

-- Validation function: prevent circular folder moves
create or replace function public.is_valid_folder_move(target_folder_id uuid, new_parent_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  curr_id uuid := new_parent_id;
begin
  if new_parent_id is null then
    return true;
  end if;

  if target_folder_id = new_parent_id then
    return false;
  end if;

  while curr_id is not null loop
    if curr_id = target_folder_id then
      return false;
    end if;
    select parent_id into curr_id from public.folders where id = curr_id;
  end loop;

  return true;
end;
$$;

-- ------------------------------------------------------------------------------
-- 5. FILES TABLE
-- ------------------------------------------------------------------------------
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

create index if not exists idx_files_owner_id on public.files(owner_id);
create index if not exists idx_files_folder_id on public.files(folder_id);
create index if not exists idx_files_deleted_at on public.files(deleted_at);
create index if not exists idx_files_is_starred on public.files(is_starred);
create index if not exists idx_files_mime_type on public.files(mime_type);

alter table public.files enable row level security;

-- Files RLS Policies
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

drop trigger if exists on_file_updated on public.files;
create trigger on_file_updated
  before update on public.files
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. SHARED CLIPS (ONLINE CLIPBOARD & FAST FILE SHARING - 24 HOURS)
-- ------------------------------------------------------------------------------
create table if not exists public.shared_clips (
  id uuid default gen_random_uuid() primary key,
  share_code text not null unique,
  owner_id uuid references auth.users(id) on delete cascade default null,
  file_id uuid references public.files(id) on delete set null default null,
  file_name text,
  file_size bigint default 0,
  mime_type text default 'text/plain',
  storage_path text default null,
  title text default 'Shared Clip',
  content text default '',
  is_cloud_file boolean default false,
  expires_at timestamp with time zone not null default (timezone('utc'::text, now()) + interval '24 hours'),
  download_count int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_shared_clips_code on public.shared_clips(share_code);
create index if not exists idx_shared_clips_expires on public.shared_clips(expires_at);
create index if not exists idx_shared_clips_owner on public.shared_clips(owner_id);

alter table public.shared_clips enable row level security;

-- Shared Clips RLS Policies
-- Anyone (even unauthenticated guests) can view unexpired shared clips by 6-digit code
drop policy if exists "Anyone can read unexpired shared clips" on public.shared_clips;
create policy "Anyone can read unexpired shared clips"
  on public.shared_clips
  for select
  using (expires_at > timezone('utc'::text, now()));

-- Anyone (guests or logged-in users) can generate a shared clip
drop policy if exists "Anyone can insert shared clips" on public.shared_clips;
create policy "Anyone can insert shared clips"
  on public.shared_clips
  for insert
  with check (true);

-- Anyone can increment download counts or view timer on active clips
drop policy if exists "Anyone can update shared clips" on public.shared_clips;
create policy "Anyone can update shared clips"
  on public.shared_clips
  for update
  using (expires_at > timezone('utc'::text, now()));

-- Registered owners can delete their own shared clips
drop policy if exists "Owners can delete shared clips" on public.shared_clips;
create policy "Owners can delete shared clips"
  on public.shared_clips
  for delete
  using (auth.uid() = owner_id);

drop trigger if exists on_shared_clip_updated on public.shared_clips;
create trigger on_shared_clip_updated
  before update on public.shared_clips
  for each row execute procedure public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET (skybox-vault)
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skybox-vault', 'skybox-vault', false, 52428800, null)
on conflict (id) do update set public = false;

-- Storage object policies for skybox-vault bucket
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
