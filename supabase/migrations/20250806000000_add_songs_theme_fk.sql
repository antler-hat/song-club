-- Conditionally add foreign key constraint on songs.theme_id referencing themes.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'songs_theme_id_fkey'
  ) THEN
    ALTER TABLE public.songs
      ADD CONSTRAINT songs_theme_id_fkey
      FOREIGN KEY (theme_id)
      REFERENCES public.themes(id)
      ON DELETE SET NULL;
  END IF;
END
$$;
