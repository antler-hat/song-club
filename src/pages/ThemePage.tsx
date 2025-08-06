import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SongCard from "@/components/TrackCard";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";

interface Theme {
  id: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  file_url: string;
  user_id: string;
  created_at: string;
  lyrics?: string | null;
  profiles: {
    username: string;
  };
  theme_id?: string | null;
  theme?: { name: string };
}

const ThemePage = () => {
  const { user } = useAuth();
  const { themeId } = useParams<{ themeId: string }>();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!themeId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        // Fetch theme details
        const { data: themeData, error: themeError } = await (supabase as any)
          .from("themes")
          .select("id, name")
          .eq("id", themeId)
          .single();
        if (themeError || !themeData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setTheme(themeData);

        // Fetch songs with this theme
        const { data: songsData, error: songsError } = await (supabase as any)
          .from("songs")
          .select(`
            id,
            title,
            file_url,
            user_id,
            created_at,
            lyrics,
            theme_id,
            theme:themes(name)
          `)
          .eq("theme_id", themeId)
          .order("created_at", { ascending: false });
        if (songsError || !songsData) {
          setSongs([]);
        } else {
          // Fetch profiles for songs
          const userIds = Array.from(new Set(songsData.map(s => s.user_id).filter((u): u is string => !!u)));
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, username")
            .in("user_id", userIds as string[]);
          const profilesMap = (profilesData || []).reduce((acc, p) => {
            acc[p.user_id] = p.username;
            return acc;
          }, {} as Record<string, string>);
          const songsWithProfiles = songsData.map(s => ({
            ...s,
            profiles: { username: profilesMap[s.user_id] || "Unknown" }
          }));
          setSongs(songsWithProfiles);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [themeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (notFound || !theme) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="pageContainer">
      <Navbar
        user={user}
        showSearch={true}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showUpload={true}
        onUploadComplete={() => { }}
        showLoginButton={true}
      />
      <main className="max-w-2xl mx-auto p-4">
        <h2>{theme.name} songs</h2>
        {songs.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-bold mb-2">No songs for this theme</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {songs.map(song => (
              <SongCard key={song.id} song={song} onSongChanged={() => { }} />
            ))}
          </div>
        )}
      </main>
      <AudioPlayer />
    </div>
  );
};

export default ThemePage;
