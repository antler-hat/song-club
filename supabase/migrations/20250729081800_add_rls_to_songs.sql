-- Enable Row Level Security (RLS) on songs table
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view songs
CREATE POLICY "Songs are viewable by everyone"
ON public.songs
FOR SELECT
USING (true);

-- Policy: Users can create their own songs
CREATE POLICY "Users can create their own songs"
ON public.songs
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own songs
CREATE POLICY "Users can update their own songs"
ON public.songs
FOR UPDATE
USING (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own songs
CREATE POLICY "Users can delete their own songs"
ON public.songs
FOR DELETE
USING (auth.uid()::text = user_id::text);
