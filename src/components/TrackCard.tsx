import { useState, useEffect, useRef } from "react";
import './TrackCard.scss';
import { Play, Pause, Send, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddCommentDialog from "./AddCommentDialog";
import EditInfoDialog from "./EditInfoDialog";
import DeleteSongDialog from "./DeleteSongDialog";
import EditCommentDialog from "./EditCommentDialog";
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

interface Song {
  id: string;
  title: string;
  file_url: string;
  user_id: string;
  created_at: string;
  lyrics?: string | null;
  profiles: {
    username: string;
  };
}

interface SongCardProps {
  song: Song;
  // Optionally, a callback to refresh the song list after delete/replace
  onSongChanged?: () => void;
  showLyricsExpanded?: boolean;
}

const SongCard = ({ song, onSongChanged, showLyricsExpanded }: SongCardProps) => {
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

  // Edit info modal state
  const [editTitleModalOpen, setEditTitleModalOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(song.title);
  const [editedLyrics, setEditedLyrics] = useState(song.lyrics || "");
  const [savingTitle, setSavingTitle] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCurrentSong = currentTrack?.id === song.id;
  const isSongPlaying = isCurrentSong && isPlaying;
  const isOwnSong = user && user.id === song.user_id;

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
        .eq('track_id', song.id)
        .order('created_at', { ascending: true });

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
          track_id: song.id,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      await fetchComments();

      toast({
        title: "Comment posted",
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
        title: "Comment updated",
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
      const fileName = `${user.id}/${song.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(fileName);

      // Update song record
      const { error: dbError } = await supabase
        .from('songs')
        .update({ file_url: publicUrl })
        .eq('id', song.id);

      if (dbError) throw dbError;

      toast({
        title: "Audio replaced",
        description: "The audio file has been updated.",
      });

      if (onSongChanged) onSongChanged();
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
        .from('songs')
        .delete()
        .eq('id', song.id);

      if (dbError) throw dbError;

      // Optionally, delete file from storage (not required, but good practice)
      // Try to extract the file path from file_url
      try {
        const url = new URL(song.file_url);
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
      if (onSongChanged) onSongChanged();
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
  }, [song.id]);

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
    if (isCurrentSong) {
      if (isPlaying) {
        pauseTrack();
      } else {
        resumeTrack();
      }
    } else {
      playTrack({ ...song, username: song.profiles.username });
    }
  };

  return (
    <Card className="trackCard">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-4 relative">
          <Button
            onClick={handlePlayPause}
            className="playpause-button"
          >
            {isSongPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <div className="flex-1">
            <h3 className="font-bold">
              <Link to={`/track/${song.id}`} className="hover:underline">
                {song.title}
              </Link>
            </h3>
            <Link to={`/user/${song.user_id}`} className="hover:underline">
              {song.profiles.username}
            </Link>
            <div className="trackCard-actions flex items-center gap-2 mt-1">
              
              {/* Add Comment Button and Modal */}
              <AddCommentDialog
                open={modalOpen}
                onOpenChange={setModalOpen}
                newComment={newComment}
                onChange={e => setNewComment(e.target.value)}
                onSubmit={handleSubmitComment}
                submitting={submitting}
                trigger={
                  <div className="">
                    <button
                      className="text-muted-foreground text-sm hover:underline transition"
                      type="button"
                    >
                      Comment
                    </button>
                  </div>
                }
              />
              {song.lyrics && (
                showLyricsExpanded ? (
                  <div className="whitespace-pre-line text-sm mt-4 mb-4">{song.lyrics}</div>
                ) : (
                  <LyricsModalButton lyrics={song.lyrics} />
                )
              )}
            </div>
          </div>
          {/* Ellipses menu for own track */}
          {isOwnSong && (
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
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
                      setEditedTitle(song.title);
                      setEditedLyrics(song.lyrics || "");
                      setEditTitleModalOpen(true);
                    }}
                  >
                    Edit info
                  </DropdownMenuItem>
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
              {/* Edit Info Modal */}
              <EditInfoDialog
                open={editTitleModalOpen}
                onOpenChange={setEditTitleModalOpen}
                editedTitle={editedTitle}
                editedLyrics={editedLyrics}
                onTitleChange={e => setEditedTitle(e.target.value)}
                onLyricsChange={e => setEditedLyrics(e.target.value)}
                onSave={async () => {
                  if (!editedTitle.trim() || (editedTitle === song.title && editedLyrics === (song.lyrics || ""))) return;
                  setSavingTitle(true);
                  try {
                    const { error } = await supabase
                      .from('songs')
                      .update({ title: editedTitle.trim(), lyrics: editedLyrics.trim() || null })
                      .eq('id', song.id);
                    if (error) throw error;
                    setEditTitleModalOpen(false);
                    toast({
                      title: "Info updated",
                      description: "The song info has been updated.",
                    });
                    if (onSongChanged) onSongChanged();
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to update info",
                      variant: "destructive",
                    });
                  } finally {
                    setSavingTitle(false);
                  }
                }}
                saving={savingTitle}
                onCancel={() => {
                  setEditTitleModalOpen(false);
                  setEditedTitle(song.title);
                  setEditedLyrics(song.lyrics || "");
                }}
                originalTitle={song.title}
                originalLyrics={song.lyrics || ""}
              />
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
              <DeleteSongDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onDelete={handleDeleteTrack}
                deleting={deleting}
                onCancel={() => setDeleteDialogOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Comments Section */}
        { comments.length > 0 ? (
          <div className="flex flex-col gap-2 text-sm">
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
                      style={isOwn ? { position: "relative" } : {}}
                    >
                    <div className="trackCard-comment">
                      <Link
                        to={`/user/${comment.user_id}`}
                        className="font-bold hover:underline mr-2"
                        onClick={e => e.stopPropagation()}
                      >
                        {comment.profiles.username}
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
          </div>
          ) : null}
          {/* Add a comment button and modal */}
          {user ? (
              <>
              {/* Edit Comment Modal */}
              <EditCommentDialog
                open={editModalOpen}
                onOpenChange={(open) => {
                  setEditModalOpen(open);
                  if (!open) {
                    setEditingComment(null);
                    setEditCommentText("");
                  }
                }}
                editCommentText={editCommentText}
                onChange={e => setEditCommentText(e.target.value)}
                onSave={handleUpdateComment}
                onDelete={handleDeleteComment}
                submitting={submitting}
                onCancel={() => {
                  setEditModalOpen(false);
                  setEditingComment(null);
                  setEditCommentText("");
                  setConfirmDelete(false);
                }}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
              />
            </>
          ) : null}
      </CardContent>
    </Card>
  );
};

const LyricsModalButton = ({ lyrics }: { lyrics: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="trackCard-lyricsButton"
        onClick={() => setOpen(true)}
        type="button"
      >
        See lyrics
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-brutalist max-w-md">
          <div className="whitespace-pre-line text-sm max-h-80 overflow-y-auto">
            {lyrics}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SongCard;
