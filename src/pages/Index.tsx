import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useNavigate } from "react-router-dom";
import { Music, User, LogIn, Search, X, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/integrations/supabase/client";
import SongCard from "@/components/TrackCard";
import UploadModal from "@/components/UploadModal";
import AudioPlayer from "@/components/AudioPlayer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
          lyrics
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

  useEffect(() => {
    fetchAllSongs();
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="p-4 pb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {isMobile && mobileSearchOpen ? (
            // Mobile: Only show search bar when open
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                mobileOpen={mobileSearchOpen}
                setMobileOpen={setMobileSearchOpen}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Link to="/"><h1 className="text-2xl font-bold">Song Club</h1></Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  mobileOpen={mobileSearchOpen}
                  setMobileOpen={setMobileSearchOpen}
                />
                {user ? (
                  <>
                    <UploadModal onUploadComplete={fetchAllSongs} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <Avatar>
                        <AvatarFallback>
                          {user?.user_metadata?.username?.[0]?.toUpperCase() ||
                            user?.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>  
                          <Link to="/profile">
                            My songs
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            await signOut();
                            navigate("/auth");
                          }}
                        >
                          <LogOut size={16} className="mr-2" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="outline" className="">
                      Log in to upload
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </header>


      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredSongs.length} result{filteredSongs.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">Loading ...</div>
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
          <div className="space-y-4">
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
