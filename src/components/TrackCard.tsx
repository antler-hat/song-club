import { useState, useEffect } from "react";
import { Play, Pause, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
}

const TrackCard = ({ track }: TrackCardProps) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useAudio();
  const { user } = useAuth();
  const { toast } = useToast();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('track_id', track.id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Fetch profiles for comment authors
      const userIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        profilesMap = profilesData?.reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {}) || {};
      }

      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesMap[comment.user_id] || { username: 'Unknown' }
      })) || [];

      setComments(commentsWithProfiles);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          track_id: track.id,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      await fetchComments();

      toast({
        title: "Comment posted!",
        description: "Your comment has been added to the track",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [track.id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    <Card className="">
      <CardContent className="">
        <div className="flex items-start gap-4 mb-3 border-brutalist p-3">
          <Button
            onClick={handlePlayPause}
            size="sm"
            className="border-brutalist w-[50px] h-[50px]"
          >
            {isTrackPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <div className="flex-1">
            <h3 className="font-bold">{track.title}</h3>
            <Link 
              to={`/user/${track.user_id}`}
            >
              @{track.profiles.username}
            </Link>
          </div>
          
        </div>

        {/* Comments Section */}
        <div className="pl-3">
          <div className="flex-1 overflow-y-auto pr-2 max-h-48">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : comments.length === 0 ? (
              null
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="mb-2">
                  <div className="flex gap-2 items-start mb-2 flex-align-items-baseline">
                  <span className="font-bold">@{comment.profiles.username}</span>
                  <span className="text">{comment.content}</span>
                  </div>
                  {/* <p className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                  </p> */}
                </div>
              ))
            )}
          </div>
          {/* Comment Input */}
          {user ? (
            <div className="border-t-brutalist pt-4 space-y-3 mt-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="border-brutalist resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="border-brutalist"
                >
                  <span>Post</span>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackCard;
