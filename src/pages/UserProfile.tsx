import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SongCard from "@/components/TrackCard";
import AudioPlayer from "@/components/AudioPlayer";
import SimpleHeader from "@/components/SimpleHeader";
import SkeletonTrackCard from "@/components/ui/SkeletonTrackCard";

interface Song {
  id: string;
  title: string;
  file_url: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

interface UserProfile {
  user_id: string;
  username: string;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch user songs
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select(`
          id,
          title,
          file_url,
          user_id,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (songsError) throw songsError;

      const songsWithProfiles = songsData?.map(song => ({
        ...song,
        profiles: { username: profileData.username }
      })) || [];

      setSongs(songsWithProfiles);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="pageContainer">
      {/* Header */}
      <SimpleHeader title={loading ? "Loading..." : `Songs by @${profile?.username}`} />

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonTrackCard key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Songs */}
            {songs.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">NO SONGS YET</h3>
                <p className="text-muted-foreground">This user hasn't shared any songs yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {songs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <AudioPlayer />
    </div>
  );
};

export default UserProfile;
