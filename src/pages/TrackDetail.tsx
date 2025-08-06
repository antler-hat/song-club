import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TrackCard from "@/components/TrackCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AudioPlayer from "@/components/AudioPlayer";
import Navbar from "@/components/Navbar";

interface Song {
  id: string;
  title: string;
  file_url: string;
  user_id: string;
  created_at: string;
  lyrics?: string | null;
  theme_id?: string | null;
  theme?: { name: string };
  profiles: {
    username: string;
  };
}

const SongDetail = () => {
  const { user } = useAuth();
  const { trackId } = useParams<{ trackId: string }>();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSong = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        // Fetch song
        const { data: songData, error: songError } = await supabase
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
          .eq("id", trackId)
          .single();

        if (songError || !songData) {
          setNotFound(true);
          setSong(null);
          return;
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, username")
          .eq("user_id", songData.user_id)
          .single();

        setSong({
          ...songData,
          profiles: profileData
            ? { username: profileData.username }
            : { username: "Unknown" },
        });
      } catch (e) {
        setNotFound(true);
        setSong(null);
      } finally {
        setLoading(false);
      }
    };

    if (trackId) fetchSong();
  }, [trackId]);

  useEffect(() => {
    if (song) {
      document.title = `${song.title} by ${song.profiles.username} | Song Club`;
    } else if (loading) {
      document.title = "Loading... | Song Club";
    } else if (notFound) {
      document.title = "Song not found | Song Club";
    } else {
      document.title = "Song Club";
    }

    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', document.title);
    }
  }, [song, loading, notFound]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (notFound || !song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="mb-4 text-lg font-bold">Song not found</div>
        {/* Back to home button */}
        <a href="/" className="underline">
          Back to home
        </a>
      </div>
    );
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
        <TrackCard song={song} showLyricsExpanded={true} />
      </main>
      <AudioPlayer />
    </div>
  );
};

export default SongDetail;
