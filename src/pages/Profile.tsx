import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('');

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchUserTracks = async () => {
    try {
      // Fetch user profile first
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      const userUsername = profileData?.username || 'Unknown';
      setUsername(userUsername);

      // Fetch tracks
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          artist,
          file_url,
          user_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add username to each track
      const tracksWithProfiles = (data || []).map(track => ({
        ...track,
        profiles: { username: userUsername }
      }));
      
      setTracks(tracksWithProfiles);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTracks();
  }, [user.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Refresh handler for TrackCard
  const handleTrackChanged = () => {
    fetchUserTracks();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b-brutalist p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="border-brutalist">
                <ArrowLeft size={16} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Your songs</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <UploadModal onUploadComplete={fetchUserTracks} />
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-brutalist"
            >
              <LogOut size={16} />
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8">
            <h2 className="text-xl font-bold mb-2">Nothing yet</h2>
            <p className="text-muted-foreground mb-4">Upload a song?</p>
            <UploadModal onUploadComplete={fetchUserTracks} />
          </div>
        ) : (
          <div className="space-y-4">
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} onTrackChanged={handleTrackChanged} />
            ))}
          </div>
        )}
      </main>

      <AudioPlayer />
    </div>
  );
};

export default Profile;
