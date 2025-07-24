import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import UploadModal from "@/components/UploadModal";
import { User, LogIn } from "lucide-react";
import AudioPlayer from "@/components/AudioPlayer";
import SearchBar from "@/components/SearchBar";

interface Track {
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

const TrackDetail = () => {
  const { user } = useAuth();
  const { trackId } = useParams<{ trackId: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTrack = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        // Fetch track
        const { data: trackData, error: trackError } = await supabase
          .from("tracks")
          .select(`
            id,
            title,
            file_url,
            user_id,
            created_at,
            lyrics
          `)
          .eq("id", trackId)
          .single();

        if (trackError || !trackData) {
          setNotFound(true);
          setTrack(null);
          return;
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, username")
          .eq("user_id", trackData.user_id)
          .single();

        setTrack({
          ...trackData,
          profiles: profileData
            ? { username: profileData.username }
            : { username: "Unknown" },
        });
      } catch (e) {
        setNotFound(true);
        setTrack(null);
      } finally {
        setLoading(false);
      }
    };

    if (trackId) fetchTrack();
  }, [trackId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (notFound || !track) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="mb-4 text-lg font-bold">Track not found</div>
        <Link to="/">
          <Button className="border-brutalist">Back to home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b-brutalist p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link to="/"><h1 className="text-2xl font-bold">Song Club</h1></Link>
            </div>
          </div>
          
          
          
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search"
              />
            </div>

            {user ? (
              <>
                <UploadModal onUploadComplete={() => {}} />
                <Link to="/profile">
                  <Button variant="outline" className="border-brutalist">
                    <User size={16} />
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" className="border-brutalist">
                  Log in
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4">
        <TrackCard track={track} showLyricsExpanded={true} />
      </main>
      <AudioPlayer />
    </div>
  );
};

export default TrackDetail;
