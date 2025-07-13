import { useState, useEffect } from "react";
import { Play, Pause, Heart, Flame, ThumbsUp } from "lucide-react";
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
  const [reactions, setReactions] = useState<Array<{ type: string; user_id: string }>>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [reactingType, setReactingType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  // Fetch reactions and comments count
  const fetchInteractions = async () => {
    try {
      // Fetch reactions
      const { data: reactionsData } = await supabase
        .from('reactions')
        .select('type, user_id')
        .eq('track_id', track.id);

      // Fetch comments count
      const { count: commentsCountData } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);

      setReactions(reactionsData || []);
      setCommentsCount(commentsCountData || 0);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
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

  const handleReaction = async (type: 'like' | 'fire' | 'heart') => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to login to react to tracks",
        variant: "destructive",
      });
      return;
    }

    setReactingType(type);

    const existingReaction = reactions.find(
      r => r.type === type && r.user_id === user.id
    );

    try {
      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('track_id', track.id)
          .eq('user_id', user.id)
          .eq('type', type);

        if (error) throw error;

        setReactions(prev => 
          prev.filter(r => !(r.type === type && r.user_id === user.id))
        );
      } else {
        // Add reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            track_id: track.id,
            user_id: user.id,
            type,
          });

        if (error) throw error;

        setReactions(prev => [
          ...prev,
          { type, user_id: user.id }
        ]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    } finally {
      setReactingType(null);
    }
  };

  const getReactionCount = (type: string) => {
    return reactions.filter(r => r.type === type).length;
  };

  const hasUserReacted = (type: string) => {
    return user && reactions.some(r => r.type === type && r.user_id === user.id);
  };

  return (
    <Card className="border-brutalist shadow-brutalist">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{track.title}</h3>
            {track.artist && (
              <p className="text-muted-foreground">{track.artist}</p>
            )}
            <Link 
              to={`/user/${track.user_id}`}
              className="text-sm text-muted-foreground font-mono hover:text-primary transition-colors"
            >
              by @{track.profiles.username}
            </Link>
          </div>
          
          <Button
            onClick={handlePlayPause}
            size="sm"
            className="border-brutalist shadow-brutalist brutalist-press"
          >
            {isTrackPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction('like')}
            disabled={reactingType === 'like'}
            className={`border-brutalist brutalist-press ${
              hasUserReacted('like') ? 'bg-accent' : ''
            }`}
          >
            <ThumbsUp size={14} />
            <span className="ml-1 text-xs">{getReactionCount('like')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction('fire')}
            disabled={reactingType === 'fire'}
            className={`border-brutalist brutalist-press ${
              hasUserReacted('fire') ? 'bg-accent' : ''
            }`}
          >
            <Flame size={14} />
            <span className="ml-1 text-xs">{getReactionCount('fire')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReaction('heart')}
            disabled={reactingType === 'heart'}
            className={`border-brutalist brutalist-press ${
              hasUserReacted('heart') ? 'bg-accent' : ''
            }`}
          >
            <Heart size={14} />
            <span className="ml-1 text-xs">{getReactionCount('heart')}</span>
          </Button>

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