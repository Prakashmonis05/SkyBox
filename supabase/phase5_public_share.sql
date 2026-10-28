-- ==========================================================
-- SkyBox - Phase 5: Public Online Clipboard & Cloud Share Codes
-- Run this in your Supabase Project -> SQL Editor
-- ==========================================================

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
  expires_at timestamp with time zone not null default (timezone('utc'::text, now()) + interval '60 minutes'),
  download_count int not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_shared_clips_code on public.shared_clips(share_code);
create index if not exists idx_shared_clips_expires on public.shared_clips(expires_at);

alter table public.shared_clips enable row level security;

-- 1. Anyone (even without login) can view unexpired shared clips by code
drop policy if exists "Anyone can read unexpired shared clips" on public.shared_clips;
create policy "Anyone can read unexpired shared clips"
  on public.shared_clips for select
  using (expires_at > timezone('utc'::text, now()));

-- 2. Anyone (guests or logged-in users) can generate a shared clip
drop policy if exists "Anyone can insert shared clips" on public.shared_clips;
create policy "Anyone can insert shared clips"
  on public.shared_clips for insert
  with check (true);

-- 3. Update policy for download counts and timer extension
drop policy if exists "Anyone can update shared clips" on public.shared_clips;
create policy "Anyone can update shared clips"
  on public.shared_clips for update
  using (expires_at > timezone('utc'::text, now()));

-- 4. Owners can delete their own shared clips
drop policy if exists "Owners can delete shared clips" on public.shared_clips;
create policy "Owners can delete shared clips"
  on public.shared_clips for delete
  using (auth.uid() = owner_id);

drop trigger if exists on_shared_clip_updated on public.shared_clips;
create trigger on_shared_clip_updated
  before update on public.shared_clips
  for each row execute procedure public.handle_updated_at();
