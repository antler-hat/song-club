import { useState, useEffect, useRef } from "react";
import './TrackCard.scss';
import { Play, Pause, MoreHorizontal, NotebookText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditInfoDialog from "./EditInfoDialog";
import DeleteSongDialog from "./DeleteSongDialog";
import { useAudio } from "@/hooks/useAudio";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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

    const [comments,
        setComments] = useState([]);
    const [newComment,
        setNewComment] = useState("");
    const [loading,
        setLoading] = useState(false);
    const [submitting,
        setSubmitting] = useState(false);
    const [modalOpen,
        setModalOpen] = useState(false);

    // Edit comment state
    const [editingComment,
        setEditingComment] = useState(null);
    const [editModalOpen,
        setEditModalOpen] = useState(false);
    const [editCommentText,
        setEditCommentText] = useState("");

    // Dropdown and modals for track actions
    const [deleteDialogOpen,
        setDeleteDialogOpen] = useState(false);
    const [deleting,
        setDeleting] = useState(false);
    const [replacing,
        setReplacing] = useState(false);
    const isTouchDevice = 'ontouchstart' in window
    const [open, setOpen] = useState(false);

    // Edit info modal state
    const [editTitleModalOpen,
        setEditTitleModalOpen] = useState(false);
    const [editedTitle,
        setEditedTitle] = useState(song.title);
    const [editedLyrics,
        setEditedLyrics] = useState(song.lyrics || "");
    const [savingTitle,
        setSavingTitle] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCurrentSong = currentTrack
        ?.id === song.id;
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

            if (commentsError)
                throw commentsError;

            // Fetch profiles for comment authors
            const userIds = [...new Set(commentsData
                ?.map(comment => comment.user_id) || [])];
            let profilesMap = {};
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('user_id, username')
                    .in('user_id', userIds);

                profilesMap = profilesData
                    ?.reduce((acc, profile) => {
                        acc[profile.user_id] = profile;
                        return acc;
                    }, {}) || {};
            }

            const commentsWithProfiles = commentsData
                ?.map(comment => ({
                    ...comment,
                    profiles: profilesMap[comment.user_id] || {
                        username: 'Unknown'
                    }
                })) || [];

            setComments(commentsWithProfiles);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load comments", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!user || !newComment.trim())
            return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    track_id: song.id,
                    user_id: user.id,
                    content: newComment.trim()
                });

            if (error)
                throw error;

            setNewComment("");
            await fetchComments();

            toast({ title: "Comment posted", description: "Your comment has been added to the track" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
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
    const [confirmDelete,
        setConfirmDelete] = useState(false);

    const handleDeleteComment = async () => {
        if (!editingComment)
            return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', editingComment.id);

            if (error)
                throw error;

            setEditModalOpen(false);
            setEditingComment(null);
            setEditCommentText("");
            setConfirmDelete(false);
            await fetchComments();

            toast({ title: "Comment deleted", description: "Your comment has been deleted." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    // Update comment in supabase
    const handleUpdateComment = async () => {
        if (!editingComment || !editCommentText.trim())
            return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('comments')
                .update({
                    content: editCommentText.trim()
                })
                .eq('id', editingComment.id);

            if (error)
                throw error;

            setEditModalOpen(false);
            setEditingComment(null);
            setEditCommentText("");
            await fetchComments();

            toast({ title: "Comment updated", description: "Your comment has been updated." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update comment", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    // Replace audio file logic
    const handleReplaceAudioClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // reset so same file can be selected again
            fileInputRef
                .current
                .click();
        }
    };

    const handleReplaceAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files
            ?.[0];
        if (!selectedFile)
            return;
        if (!selectedFile.type.startsWith("audio/")) {
            toast({ title: "Invalid file type", description: "Please select an audio file", variant: "destructive" });
            return;
        }

        setReplacing(true);
        try {
            // Upload new file to storage
            const fileExt = selectedFile
                .name
                .split('.')
                .pop();
            const fileName = `${user
                .id}/${song
                    .id}-${Date
                        .now()}.${fileExt}`;
            const { error: uploadError } = await supabase
                .storage
                .from('tracks')
                .upload(fileName, selectedFile, { upsert: true });

            if (uploadError)
                throw uploadError;

            // Get public URL
            const { data: {
                publicUrl
            } } = supabase
                .storage
                .from('tracks')
                .getPublicUrl(fileName);

            // Update song record
            const { error: dbError } = await supabase
                .from('songs')
                .update({ file_url: publicUrl })
                .eq('id', song.id);

            if (dbError)
                throw dbError;

            toast({ title: "Audio replaced", description: "The audio file has been updated." });

            if (onSongChanged)
                onSongChanged();
        }
        catch (error: any) {
            toast({
                title: "Replace failed",
                description: error.message || "Something went wrong",
                variant: "destructive"
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

            if (dbError)
                throw dbError;

            // Optionally, delete file from storage (not required, but good practice) Try to
            // extract the file path from file_url
            try {
                const url = new URL(song.file_url);
                const path = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\/public\/tracks\//, ""));
                await supabase
                    .storage
                    .from('tracks')
                    .remove([path]);
            } catch (e) {
                // Ignore file delete errors
            }

            toast({ title: "Song deleted", description: "The song has been deleted." });

            setDeleteDialogOpen(false);
            if (onSongChanged)
                onSongChanged();
        }
        catch (error: any) {
            toast({
                title: "Delete failed",
                description: error.message || "Something went wrong",
                variant: "destructive"
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
            playTrack({
                ...song,
                username: song.profiles.username
            });
        }
    };

    return (
        <Card className="trackCard">
            <CardContent>
                <div className="trackCard-mainContent">
                    <Button onClick={handlePlayPause} className="playpause-button">
                        {isSongPlaying
                            ? <Pause size={16} />
                            : <Play size={16} />}
                    </Button>
                    <div className="flex-1">
                        <div className="trackCard-titleGroup">
                            <h3 className="font-bold">
                                <Link to={`/track/${song.id}`} className="hover:underline">
                                    {song.title}
                                </Link>
                            </h3>
                        </div>
                        <Link to={`/user/${song.user_id}`} className="hover:underline">
                            {song.profiles.username}
                        </Link>
                        {/* Song lyrics expanded */}
                        {song.lyrics && showLyricsExpanded &&
                            <div className="whitespace-pre-line text-sm mt-4 mb-4">{song.lyrics}</div>
                        }
                        </div>
                        <div className="trackCard-actions">
                            {/* Ellipses menu for own track */}
                            {/* Song lyrics button */}
                            {song.lyrics && !showLyricsExpanded &&
                                (<LyricsModalButton lyrics={song.lyrics} />)}
                            {isOwnSong && (
                                <div>
                                    <DropdownMenu open={open} onOpenChange={setOpen}>
                                        <DropdownMenuTrigger
                                            asChild
                                            {...(isTouchDevice
                                                ? {
                                                    onPointerDown: (e) => e.preventDefault(),
                                                    onClick: () => setOpen(!open)
                                                }
                                                : undefined)}
                                        >
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 p-0"
                                                aria-label="Track options">
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
                                                }}>
                                                Edit info
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    handleReplaceAudioClick();
                                                }}
                                                disabled={replacing}>
                                                Replace the audio file
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    setDeleteDialogOpen(true);
                                                }}
                                                className="text-red-600 focus:text-red-600">
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
                                            if (!editedTitle.trim() || (editedTitle === song.title && editedLyrics === (song.lyrics || "")))
                                                return;
                                            setSavingTitle(true);
                                            try {
                                                const { error } = await supabase
                                                    .from('songs')
                                                    .update({
                                                        title: editedTitle.trim(),
                                                        lyrics: editedLyrics.trim() || null
                                                    })
                                                    .eq('id', song.id);
                                                if (error)
                                                    throw error;
                                                setEditTitleModalOpen(false);
                                                toast({ title: "Info updated", description: "The song info has been updated." });
                                                if (onSongChanged)
                                                    onSongChanged();
                                            }
                                            catch (error) {
                                                toast({ title: "Error", description: "Failed to update info", variant: "destructive" });
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
                                        originalLyrics={song.lyrics || ""} /> {/* Hidden file input for replace */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        style={{
                                            display: "none"
                                        }}
                                        onChange={handleReplaceAudioFile}
                                        disabled={replacing} /> {/* Delete confirmation dialog */}
                                    <DeleteSongDialog
                                        open={deleteDialogOpen}
                                        onOpenChange={setDeleteDialogOpen}
                                        onDelete={handleDeleteTrack}
                                        deleting={deleting}
                                        onCancel={() => setDeleteDialogOpen(false)} />
                                </div>
                            )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const LyricsModalButton = ({ lyrics }: {
    lyrics: string
}) => {
    const [open,
        setOpen] = useState(false);
    return (
        <div>
            <Tooltip delayDuration={0}>
                <TooltipTrigger>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        aria-label="View lyrics"
                        onClick={() => setOpen(true)}>
                        <NotebookText size={16} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    View lyrics
                </TooltipContent>
            </Tooltip>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md" showOverflowHint={true}>
                    <div className="whitespace-pre-line text-sm max-h-80 overflow-y-auto pb-10">
                        {lyrics}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SongCard;
