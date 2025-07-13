import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Music, User, LogIn, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TrackCard from "@/components/TrackCard";
import UploadModal from "@/components/UploadModal";
import AudioPlayer from "@/components/AudioPlayer";

interface Track {
  id: string;
  title: string;
  artist?: string;
  file_url: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

const Index = () => {
  const { user } = useAuth();
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
          created_at
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

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b-brutalist p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-8 h-8" />
              <h1 className="text-2xl font-bold">SOUNDSHARE</h1>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Input
              placeholder="Search tracks, artists, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-brutalist pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSearch}
                  className="h-6 w-6 p-0"
                >
                  <X size={14} />
                </Button>
              )}
              <Search size={16} className="text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <UploadModal onUploadComplete={fetchAllTracks} />
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="border-brutalist brutalist-press">
                    <User size={16} />
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="border-brutalist brutalist-press">
                  <LogIn size={16} />
                  LOGIN
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">DISCOVER MUSIC</h2>
          <p className="text-xl text-muted-foreground font-mono">
            Share your beats. Discover new sounds. Connect with creators.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground font-mono">
              {filteredTracks.length} result{filteredTracks.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 font-mono">LOADING TRACKS...</div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? "NO RESULTS" : "NO TRACKS YET"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No tracks found for "${searchQuery}"` : "Be the first to share a track!"}
            </p>
            {!searchQuery && (user ? (
              <UploadModal onUploadComplete={fetchAllTracks} />
            ) : (
              <Link to="/auth">
                <Button className="border-brutalist shadow-brutalist brutalist-press">
                  GET STARTED
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </main>

      <AudioPlayer />
    </div>
  );
};

export default Index;
