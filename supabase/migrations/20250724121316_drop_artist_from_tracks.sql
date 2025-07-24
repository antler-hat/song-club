-- Drop artist column from tracks table if it exists
ALTER TABLE public.tracks DROP COLUMN IF EXISTS artist;
