-- ==========================================================
-- SkyBox - Phase 4: Online Clipboard with 60-Minute Timeout
-- Run this in Supabase Project -> SQL Editor
-- ==========================================================

create table if not exists public.clipboard_items (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text default 'Untitled Clip',
  content text not null,
  is_pinned boolean default false,
  expires_at timestamp with time zone not null default (timezone('utc'::text, now()) + interval '60 minutes'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_clipboard_owner_id on public.clipboard_items(owner_id);
create index if not exists idx_clipboard_expires_at on public.clipboard_items(expires_at);

alter table public.clipboard_items enable row level security;

drop policy if exists "Users can view own clipboard items" on public.clipboard_items;
create policy "Users can view own clipboard items"
  on public.clipboard_items
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own clipboard items" on public.clipboard_items;
create policy "Users can insert own clipboard items"
  on public.clipboard_items
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own clipboard items" on public.clipboard_items;
create policy "Users can update own clipboard items"
  on public.clipboard_items
  for update
  using (auth.uid() = owner_id);

drop policy if exists "Users can delete own clipboard items" on public.clipboard_items;
create policy "Users can delete own clipboard items"
  on public.clipboard_items
  for delete
  using (auth.uid() = owner_id);

-- Trigger for updated_at
drop trigger if exists on_clipboard_updated on public.clipboard_items;
create trigger on_clipboard_updated
  before update on public.clipboard_items
  for each row execute procedure public.handle_updated_at();
