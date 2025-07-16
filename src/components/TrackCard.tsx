import { useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAudio } from "@/hooks/useAudio";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CommentsModal from "@/components/CommentsModal";

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

interface TrackCardProps {
  track: Track;
}

const TrackCard = ({ track }: TrackCardProps) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useAudio();
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  // Fetch comments count only
  const fetchCommentsCount = async () => {
    try {
      const { count: commentsCountData } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);

      setCommentsCount(commentsCountData || 0);
    } catch (error) {
      console.error('Error fetching comments count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommentsCount();
  }, [track.id]);

  const handlePlayPause = () => {
    if (isCurrentTrack) {
      if (isPlaying) {
        pauseTrack();
      } else {
        resumeTrack();
      }
    } else {
      playTrack(track);
    }
  };


  return (
    <Card className="border-brutalist">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{track.title}</h3>
            {track.artist && (
              <p className="text-muted-foreground">{track.artist}</p>
            )}
            <Link 
              to={`/user/${track.user_id}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              by @{track.profiles.username}
            </Link>
          </div>
          
          <Button
            onClick={handlePlayPause}
            size="sm"
            className="border-brutalist"
          >
            {isTrackPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <CommentsModal
            trackId={track.id}
            commentsCount={commentsCount}
            onCommentsChange={setCommentsCount}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackCard;
