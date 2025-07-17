import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useNavigate } from "react-router-dom";
import { Music, User, LogIn, Search, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import SearchBar from "@/components/SearchBar";
import { supabase } from "@/integrations/supabase/client";
import TrackCard from "@/components/TrackCard";
import UploadModal from "@/components/UploadModal";
import AudioPlayer from "@/components/AudioPlayer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Track {
  id: string;
  title: string;
  artist?: string;
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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAllTracks = async () => {
    try {
      // Fetch tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist,
          file_url,
          user_id,
          created_at,
          lyrics
        `)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;

      // Fetch profiles separately
      const userIds = [...new Set(tracksData?.map(track => track.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const tracksWithProfiles = tracksData?.map(track => ({
        ...track,
        profiles: profilesMap[track.user_id] || { username: 'Unknown' }
      })) || [];

      setTracks(tracksWithProfiles);
      setFilteredTracks(tracksWithProfiles);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTracks();
  }, []);

  // Filter tracks based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTracks(tracks);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tracks.filter(track => 
        track.title.toLowerCase().includes(query) ||
        track.artist?.toLowerCase().includes(query) ||
        track.profiles.username.toLowerCase().includes(query)
      );
      setFilteredTracks(filtered);
    }
  }, [searchQuery, tracks]);


  // Refresh handler for TrackCard
  const handleTrackChanged = () => {
    fetchAllTracks();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="p-4 pb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link to="/"><h1 className="text-2xl font-bold">Song Club</h1></Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search titles or users"
            />
            {user ? (
              <>
                <UploadModal onUploadComplete={fetchAllTracks} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-brutalist">
                      <User size={16} />
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
                <Button variant="outline" size="sm" className="border-brutalist">
                  <LogIn size={16} />
                  Log in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>


      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredTracks.length} result{filteredTracks.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">Loading ...</div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-8">
            <p className="mb-2">
              {searchQuery ? `Nothing found for "${searchQuery}"` : "Nothing yet"}
            </p>
            {!searchQuery && (user ? (
              <UploadModal onUploadComplete={fetchAllTracks} />
            ) : (
              <Link to="/auth">
                <Button className="border-brutalist">
                  Get started
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTracks.map((track) => (
              <TrackCard key={track.id} track={track} onTrackChanged={handleTrackChanged} />
            ))}
          </div>
        )}
      </main>

      <AudioPlayer />
    </div>
  );
};

export default Index;
