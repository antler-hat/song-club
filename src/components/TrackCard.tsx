import { useState } from "react";
import { Play, Pause, Heart, Flame, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAudio } from "@/hooks/useAudio";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  reactions?: Array<{
    type: string;
    user_id: string;
  }>;
  commentsCount?: number;
}

const TrackCard = ({ track, reactions = [], commentsCount = 0 }: TrackCardProps) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useAudio();
  const { user } = useAuth();
  const { toast } = useToast();
  const [localReactions, setLocalReactions] = useState(reactions);
  const [reactingType, setReactingType] = useState<string | null>(null);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

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

    const existingReaction = localReactions.find(
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

        setLocalReactions(prev => 
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

        setLocalReactions(prev => [
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
    return localReactions.filter(r => r.type === type).length;
  };

  const hasUserReacted = (type: string) => {
    return user && localReactions.some(r => r.type === type && r.user_id === user.id);
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
            <p className="text-sm text-muted-foreground font-mono">
              by @{track.profiles.username}
            </p>
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

          <Button
            variant="outline"
            size="sm"
            className="border-brutalist ml-auto"
          >
            <MessageSquare size={14} />
            <span className="ml-1 text-xs">{commentsCount}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackCard;