import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SongCard from "@/components/SongItem";
import AudioPlayer from "@/components/AudioPlayer";
import Navbar from "@/components/Navbar";
import UploadModal from "@/components/UploadModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SkeletonTrackCard from "@/components/SongItemSkeleton";

interface Song {
  id: string;
  title: string;
  file_url: string;
  user_id: string;
  created_at: string;
  lyrics?: string | null;
  theme?: { name: string };
  theme_id?: string | null;
  profiles: {
    username: string;
  };
}

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [themes, setThemes] = useState<{ id: string; name: string; created_at: string }[]>([]);
  const [themesLoading, setThemesLoading] = useState(true);

  const fetchAllSongs = async () => {
    try {
      // Fetch songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
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
        .order('created_at', { ascending: false });

      if (songsError) throw songsError;

      // Fetch profiles separately
      const userIds = [...new Set(songsData?.map(song => song.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const songsWithProfiles = songsData?.map(song => ({
        ...song,
        profiles: profilesMap[song.user_id] || { username: 'Unknown' }
      })) || [];

      setSongs(songsWithProfiles);
      setFilteredSongs(songsWithProfiles);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('id, name, created_at')
        .order('name');
      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setThemesLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSongs();
    fetchThemes();
  }, []);

  // Filter songs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(songs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = songs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.profiles.username.toLowerCase().includes(query)
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);


  // Refresh handler for TrackCard
  const handleSongChanged = () => {
    fetchAllSongs();
  };

  return (
    <div className="pageContainer">
      <Navbar
        user={user}
        signOut={signOut}
        showSearch={true}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showUpload={true}
        onUploadComplete={fetchAllSongs}
        showLoginButton={true}
        mobileSearch={mobileSearchOpen}
        setMobileSearchOpen={setMobileSearchOpen}
      />

      {/* Content */}
      <main className="container">
        <div className="themeLinks">
          {themesLoading ? (
            <div className="flex gap-4">
              <Skeleton className="h-3 w-8 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
            </div>
          ) : (
            themes.map((theme) => (
              <Link key={theme.id} to={`/theme/${theme.id}`} className="themeLinks-theme">
                {theme.name}
              </Link>
            ))
          )}
        </div>

        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredSongs.length} result{filteredSongs.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          </div>
        )}
        {loading ? (
          <div className="pt-10">
            {[1, 2, 3].map((i) => (
              <SkeletonTrackCard key={i} />
            ))}
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="py-8">
            <p className="mb-2">
              {searchQuery ? `Nothing found for "${searchQuery}"` : "Nothing yet"}
            </p>
            {!searchQuery && (user ? (
              <UploadModal onUploadComplete={fetchAllSongs} />
            ) : (
              <Link to="/auth">
                <Button className="">
                  Get started
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <div>
            <div className="songItem-tableHeader">

              <span className="text-xs font-bold">Title</span>
              <span className="text-xs font-bold">Artist</span>
              <span className="text-xs font-bold">Theme</span>
              <span className="text-xs font-bold">Lyrics</span>
            </div>
            {filteredSongs.map((song) => (
              <SongCard key={song.id} song={song} onSongChanged={handleSongChanged} />
            ))}
          </div>
        )}
      </main>

      <AudioPlayer />
    </div>
  );
};

export default Index;
