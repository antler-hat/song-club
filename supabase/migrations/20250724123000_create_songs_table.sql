-- Create songs table
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  file_url text not null,
  file_size int4,
  duration float4,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  lyrics text
);
