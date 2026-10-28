-- ==========================================================
-- SkyBox - Personal Cloud Storage Database Schema (Phase 1)
-- Run this script in your Supabase Project -> SQL Editor
-- ==========================================================

-- 1. Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 2. Create the Profiles Table (Associated with Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 4. Create RLS Policies for Profiles
-- Users can view their own profile only
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 5. Auto-create Profile on Auth Signup Trigger
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
  );
  return new;
end;
$$;

-- Drop trigger if exists to prevent duplicates
drop trigger if exists on_auth_user_created on auth.users;

-- Create Trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Trigger to automatically update updated_at on profile edit
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ==========================================================
-- PHASE 2: FOLDERS MANAGEMENT SCHEMA
-- ==========================================================

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

create policy "Users can view own folders"
  on public.folders
  for select
  using (auth.uid() = owner_id);

create policy "Users can insert own folders"
  on public.folders
  for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own folders"
  on public.folders
  for update
  using (auth.uid() = owner_id);

create policy "Users can delete own folders"
  on public.folders
  for delete
  using (auth.uid() = owner_id);

drop trigger if exists on_folder_updated on public.folders;
create trigger on_folder_updated
  before update on public.folders
  for each row execute procedure public.handle_updated_at();

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

-- ==========================================================
-- PHASE 3: FILES METADATA & SUPABASE STORAGE (skybox-vault)
-- ==========================================================

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

create policy "Users can view own files"
  on public.files
  for select
  using (auth.uid() = owner_id);

create policy "Users can insert own files"
  on public.files
  for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own files"
  on public.files
  for update
  using (auth.uid() = owner_id);

create policy "Users can delete own files"
  on public.files
  for delete
  using (auth.uid() = owner_id);

drop trigger if exists on_file_updated on public.files;
create trigger on_file_updated
  before update on public.files
  for each row execute procedure public.handle_updated_at();

-- Bucket creation (skybox-vault)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skybox-vault', 'skybox-vault', false, 52428800, null)
on conflict (id) do update set public = false;

-- Storage object policies for skybox-vault
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


