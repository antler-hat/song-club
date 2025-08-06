-- Create themes table
create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp with time zone not null default now()
);

-- Add theme_id to songs
alter table public.songs
add column if not exists theme_id uuid references public.themes(id);

-- Seed initial themes
insert into public.themes (name) values
  ('Sport'),
  ('Time'),
  ('Boats'),
  ('Collect'),
  ('Lemon')
on conflict (name) do nothing;
