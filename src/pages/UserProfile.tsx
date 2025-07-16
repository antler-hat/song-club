import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import TrackCard from "@/components/TrackCard";
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

interface UserProfile {
  user_id: string;
  username: string;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
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

      // Fetch user tracks
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;

      const tracksWithProfiles = tracksData?.map(track => ({
        ...track,
        profiles: { username: profileData.username }
      })) || [];

      setTracks(tracksWithProfiles);
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
            <div className="flex items-center gap-2">
              <User size={20} />
              <h1 className="text-2xl font-bold">
                {loading ? "LOADING..." : `@${profile?.username}`}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-8">LOADING USER...</div>
        ) : (
          <>
            {/* User Info */}
            <div className="mb-8 p-6 border-brutalist">
              <h2 className="text-3xl font-bold mb-2">@{profile?.username}</h2>
              <p className="text-muted-foreground">
                Member since {profile ? new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                }) : ''}
              </p>
              <div className="mt-4">
                <span className="font-bold text-lg">{tracks.length}</span>
                <span className="text-muted-foreground ml-2">
                  {tracks.length === 1 ? 'track' : 'tracks'} shared
                </span>
              </div>
            </div>

            {/* Tracks */}
            {tracks.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">NO TRACKS YET</h3>
                <p className="text-muted-foreground">This user hasn't shared any tracks yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">TRACKS</h3>
                {tracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
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