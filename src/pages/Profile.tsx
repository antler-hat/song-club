import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SongCard from "@/components/TrackCard";
import UploadModal from "@/components/UploadModal";
import AudioPlayer from "@/components/AudioPlayer";
import SimpleHeader from "@/components/SimpleHeader";

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

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('');

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchUserSongs = async () => {
    try {
      // Fetch user profile first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      const userUsername = profileData?.username || 'Unknown';
      setUsername(userUsername);

      // Fetch songs
      const { data, error } = await supabase
        .from('songs')
        .select(`
          id,
          title,
          file_url,
          user_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add username to each song
      const songsWithProfiles = (data || []).map(song => ({
        ...song,
        profiles: { username: userUsername }
      }));
      
      setSongs(songsWithProfiles);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSongs();
  }, [user.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Refresh handler for TrackCard
  const handleSongChanged = () => {
    fetchUserSongs();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <SimpleHeader title="Your songs" />

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-bold mb-2">Nothing yet</h2>
            <p className="text-muted-foreground mb-4">Upload a song?</p>
            <UploadModal onUploadComplete={fetchUserSongs} />
          </div>
        ) : (
          <div className="space-y-4">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} onSongChanged={handleSongChanged} />
            ))}
          </div>
        )}
      </main>

      <AudioPlayer />
    </div>
  );
};

export default Profile;
