import { useState, useEffect, useRef } from "react";
import { Play, Pause, Send, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAudio } from "@/hooks/useAudio";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  // Optionally, a callback to refresh the track list after delete/replace
  onTrackChanged?: () => void;
}

const TrackCard = ({ track, onTrackChanged }: TrackCardProps) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useAudio();
  const { user } = useAuth();
  const { toast } = useToast();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Edit comment state
  const [editingComment, setEditingComment] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCommentText, setEditCommentText] = useState("");

  // Dropdown and modals for track actions
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replacing, setReplacing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isTrackPlaying = isCurrentTrack && isPlaying;
  const isOwnTrack = user && user.id === track.user_id;

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

  // Edit comment handler
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setEditModalOpen(true);
  };

  // Delete comment state and handler
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteComment = async () => {
    if (!editingComment) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', editingComment.id);

      if (error) throw error;

      setEditModalOpen(false);
      setEditingComment(null);
      setEditCommentText("");
      setConfirmDelete(false);
      await fetchComments();

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update comment in supabase
  const handleUpdateComment = async () => {
    if (!editingComment || !editCommentText.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editCommentText.trim() })
        .eq('id', editingComment.id);

      if (error) throw error;

      setEditModalOpen(false);
      setEditingComment(null);
      setEditCommentText("");
      await fetchComments();

      toast({
        title: "Comment updated!",
        description: "Your comment has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Replace audio file logic
  const handleReplaceAudioClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // reset so same file can be selected again
      fileInputRef.current.click();
    }
  };

  const handleReplaceAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("audio/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    setReplacing(true);
    try {
      // Upload new file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${track.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(fileName);

      // Update track record
      const { error: dbError } = await supabase
        .from('tracks')
        .update({ file_url: publicUrl })
        .eq('id', track.id);

      if (dbError) throw dbError;

      toast({
        title: "Audio replaced",
        description: "The audio file has been updated.",
      });

      if (onTrackChanged) onTrackChanged();
    } catch (error: any) {
      toast({
        title: "Replace failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setReplacing(false);
    }
  };

  // Delete track logic
  const handleDeleteTrack = async () => {
    setDeleting(true);
    try {
      // Delete track from DB
      const { error: dbError } = await supabase
        .from('tracks')
        .delete()
        .eq('id', track.id);

      if (dbError) throw dbError;

      // Optionally, delete file from storage (not required, but good practice)
      // Try to extract the file path from file_url
      try {
        const url = new URL(track.file_url);
        const path = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\/public\/tracks\//, ""));
        await supabase.storage.from('tracks').remove([path]);
      } catch (e) {
        // Ignore file delete errors
      }

      toast({
        title: "Song deleted",
        description: "The song has been deleted.",
      });

      setDeleteDialogOpen(false);
      if (onTrackChanged) onTrackChanged();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
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
    <Card className="relative">
      <CardContent className="">
        <div className="flex items-start gap-4 mb-3 border-brutalist p-3 relative">
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
          {/* Ellipses menu for own track */}
          {isOwnTrack && (
            <div className="absolute right-2 top-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                    aria-label="Track options"
                  >
                    <MoreHorizontal size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleReplaceAudioClick();
                    }}
                    disabled={replacing}
                  >
                    Replace the audio file
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    Delete this song
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Hidden file input for replace */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={handleReplaceAudioFile}
                disabled={replacing}
              />
              {/* Delete confirmation dialog */}
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="border-brutalist max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-bold text-base">Are you sure?</DialogTitle>
                  </DialogHeader>
                  <div className="py-2">
                    <p>Your song will be gone for good!</p>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={deleting}
                      className="border-brutalist"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteTrack}
                      disabled={deleting}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {deleting ? "Deleting..." : "Delete song"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="pl-3">
          <div className="flex-1 overflow-y-auto pr-2 max-h-48">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : comments.length === 0 ? (
              null
            ) : (
              comments.map((comment) => {
                const isOwn = user && comment.user_id === user.id;
                return (
                  <div
                    key={comment.id}
                    className={`mb-2`}
                    style={isOwn ? { position: "relative" } : {}}
                  >
<div className="flex gap-2 items-start mb-2 flex-align-items-baseline">
  <Link
    to={`/user/${comment.user_id}`}
    className="font-bold hover:underline"
    onClick={e => e.stopPropagation()}
  >
    @{comment.profiles.username}
  </Link>
  <span
    className={`text whitespace-pre-line${isOwn ? " hover:underline cursor-pointer" : ""}`}
    onClick={isOwn ? () => handleEditComment(comment) : undefined}
  >
    {comment.content}
  </span>
</div>
                  </div>
                );
              })
            )}
          </div>
          {/* Add a comment button and modal */}
          {user ? (
            <div className="">
              {/* Add Comment Modal */}
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <button
                    className="text-muted-foreground text-sm hover:underline transition"
                    type="button"
                  >
                    + comment
                  </button>
                </DialogTrigger>
                <DialogContent className="border-brutalist max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-bold text-base">Add Comment</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    placeholder="Write your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="border-brutalist resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={async () => {
                        await handleSubmitComment();
                        setModalOpen(false);
                      }}
                      disabled={!newComment.trim() || submitting}
                      className="border-brutalist"
                    >
                      <span>Post</span>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Edit Comment Modal */}
              <Dialog open={editModalOpen} onOpenChange={(open) => {
                setEditModalOpen(open);
                if (!open) {
                  setEditingComment(null);
                  setEditCommentText("");
                }
              }}>
                <DialogContent className="border-brutalist max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-bold text-base">Edit Comment</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    placeholder="Edit your comment..."
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    className="border-brutalist resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between items-center items-end mt-2">
                    {/* Delete button bottom left */}
                    <div>
                      {!confirmDelete ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:underline"
                          onClick={() => setConfirmDelete(true)}
                          disabled={submitting}
                        >
                          Delete comment
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={handleDeleteComment}
                          disabled={submitting}
                        >
                          Yes delete this idiot comment
                        </button>
                      )}
                    </div>
                    {/* Save/Cancel right */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditModalOpen(false);
                          setEditingComment(null);
                          setEditCommentText("");
                          setConfirmDelete(false);
                        }}
                        className="border-brutalist"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateComment}
                        disabled={!editCommentText.trim() || submitting}
                        className="border-brutalist"
                      >
                        <span>Save</span>
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackCard;
