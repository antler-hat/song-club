import { useState, useEffect } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

interface CommentsModalProps {
  trackId: string;
  commentsCount: number;
  onCommentsChange: (count: number) => void;
}

const CommentsModal = ({ trackId, commentsCount, onCommentsChange }: CommentsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchComments = async () => {
    if (!open) return;
    
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
        .eq('track_id', trackId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch profiles for comment authors
      const userIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profilesMap = profilesData?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesMap[comment.user_id] || { username: 'Unknown' }
      })) || [];

      setComments(commentsWithProfiles);
      console.log("Fetched comments order:", commentsWithProfiles);
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

    if (newComment.trim().length > 500) {
      toast({
        title: "Comment too long",
        description: "Comments cannot exceed 500 characters",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const response = await fetch(`https://rfeqlcvmeandyuakrmqf.supabase.co/functions/v1/create-comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_id: trackId,
          content: newComment.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to post comment');
      }

      setNewComment("");
      await fetchComments();
      onCommentsChange(comments.length + 1);

      toast({
        title: "Comment posted",
        description: "Your comment has been added to the track",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [open, trackId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-brutalist"
        >
          <MessageSquare size={14} />
          <span className="ml-1 text-xs">{commentsCount}</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="border-brutalist max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-bold">COMMENTS</DialogTitle>
        </DialogHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="text-center py-4">LOADING...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-brutalist p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-sm">@{comment.profiles.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        {user ? (
          <div className="border-t-brutalist pt-4 space-y-3">
            <Textarea
              placeholder="Add a comment... (max 500 characters)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border-brutalist resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-right text-xs text-muted-foreground">
              {newComment.length}/500
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="border-brutalist"
              >
                <Send size={14} />
                <span className="ml-2">POST</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t-brutalist pt-4 text-center text-muted-foreground">
            <p>Login to post comments</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;
