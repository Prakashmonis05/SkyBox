-- ==========================================================
-- SkyBox - Phase 2: Folder Management Schema & RLS
-- Run this in Supabase Project -> SQL Editor
-- ==========================================================

-- 1. Create the Folders Table
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

-- 2. Indexes for fast hierarchy lookups and filtering
create index if not exists idx_folders_owner_id on public.folders(owner_id);
create index if not exists idx_folders_parent_id on public.folders(parent_id);
create index if not exists idx_folders_deleted_at on public.folders(deleted_at);
create index if not exists idx_folders_is_starred on public.folders(is_starred);

-- 3. Enable Row Level Security (RLS)
alter table public.folders enable row level security;

-- 4. RLS Policies: Ensure users can only access and modify their own folders
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

-- 5. Trigger for updated_at
drop trigger if exists on_folder_updated on public.folders;
create trigger on_folder_updated
  before update on public.folders
  for each row execute procedure public.handle_updated_at();

-- 6. Helper Function: Validate Folder Move (Prevents moving folder into itself or descendants)
create or replace function public.is_valid_folder_move(target_folder_id uuid, new_parent_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  curr_id uuid := new_parent_id;
begin
  -- Moving to root (null) is always valid
  if new_parent_id is null then
    return true;
  end if;

  -- Cannot move into self
  if target_folder_id = new_parent_id then
    return false;
  end if;

  -- Check if new_parent_id is a descendant of target_folder_id
  while curr_id is not null loop
    if curr_id = target_folder_id then
      return false; -- Cycle detected
    end if;

    select parent_id into curr_id from public.folders where id = curr_id;
  end loop;

  return true;
end;
$$;
