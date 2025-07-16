import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

const TrackDetail = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
            artist,
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
      <main className="max-w-2xl mx-auto p-4">
        <TrackCard track={track} showLyricsExpanded={true} />
      </main>
    </div>
  );
};

export default TrackDetail;
