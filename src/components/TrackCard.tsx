import { useState, useEffect, useRef } from "react";
import './TrackCard.scss';
import { Play, Pause, MoreHorizontal, NotebookText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import EditInfoDialog from "./EditInfoDialog";
import DeleteSongDialog from "./DeleteSongDialog";
import { useAudio } from "@/hooks/useAudio";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

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
  theme_id?: string | null;
  theme?: { name: string };
}

interface SongCardProps {
  song: Song;
  onSongChanged?: () => void;
  showLyricsExpanded?: boolean;
}

const SongCard = ({ song, onSongChanged, showLyricsExpanded }: SongCardProps) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useAudio();
  const { user } = useAuth();
  const { toast } = useToast();
  const isTouchDevice = useIsMobile();

  const [themeId, setThemeId] = useState<string>(song.theme_id || "");

  // const [comments, setComments] = useState<any[]>([]);
  // const [loading, setLoading] = useState(false);
  // const [submitting, setSubmitting] = useState(false);
  const [editTitleModalOpen, setEditTitleModalOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(song.title);
  const [editedLyrics, setEditedLyrics] = useState(song.lyrics || "");
  const [savingTitle, setSavingTitle] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCurrentSong = currentTrack?.id === song.id;
  const isSongPlaying = isCurrentSong && isPlaying;
  const isOwnSong = user?.id === song.user_id;

  // const fetchComments = async () => {
  //   setLoading(true);
  //   try {
  //     const { data: commentsData, error: commentsError } = await supabase
  //       .from('comments')
  //       .select('id, content, created_at, user_id')
  //       .eq('track_id', song.id)
  //       .order('created_at', { ascending: true });
  //     if (commentsError) throw commentsError;
  //     setComments(commentsData || []);
  //   } catch {
  //     toast({ title: "Error", description: "Failed to load comments", variant: "destructive" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchComments();
  // }, [song.id]);

  const handlePlayPause = () => {
    if (isCurrentSong) {
      isPlaying ? pauseTrack() : resumeTrack();
    } else {
      playTrack({ ...song, username: song.profiles.username });
    }
  };

  const handleReplaceAudioClick = () => {
    fileInputRef.current?.click();
  };

  const handleReplaceAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "Invalid file type", description: "Please select an audio file", variant: "destructive" });
      return;
    }
    setReplacing(true);
    try {
      const ext = file.name.split('.').pop();
      const key = `${user?.id}/${song.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('tracks').upload(key, file, { upsert: true });
      if (uploadError) throw uploadError;
      const publicUrl = supabase.storage.from('tracks').getPublicUrl(key).data.publicUrl;
      const { error: dbError } = await supabase.from('songs').update({ file_url: publicUrl }).eq('id', song.id);
      if (dbError) throw dbError;
      toast({ title: "Audio replaced", description: "Audio file updated." });
      onSongChanged?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Replace failed", variant: "destructive" });
    } finally {
      setReplacing(false);
    }
  };

  const handleDeleteTrack = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from('songs').delete().eq('id', song.id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Song has been deleted." });
      setDeleteDialogOpen(false);
      onSongChanged?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Delete failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="trackCard">
      <CardContent>
        <div className="trackCard-mainContent">
          <Button onClick={handlePlayPause} className="playpause-button">
            {isSongPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <div className="flex-1">

            <Link to={`/theme/${song.theme_id}`} className="trackCard-themeLink">
              {song.theme?.name || "No theme"}
            </Link>
            <h3 className="trackCard-songTitle">
              <Link to={`/track/${song.id}`} className="hover:underline">{song.title}</Link>
            </h3>
            <Link to={`/user/${song.user_id}`} className="hover:underline">{song.profiles.username}</Link>
            {song.lyrics && showLyricsExpanded && (
              <div className="whitespace-pre-line text-sm mt-4 mb-4">{song.lyrics}</div>
            )}
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
                  originalLyrics={song.lyrics || ""}
                  originalThemeId={song.theme_id || ""}
                  themeId={themeId}
                  onThemeChange={setThemeId}
                /> {/* Hidden file input for replace */}
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
const LyricsModalButton = ({ lyrics }: { lyrics: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="outline" size="icon" onClick={() => setOpen(true)}>
            <NotebookText size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View lyrics</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showOverflowHint={true} className="max-w-md">
          <div className="whitespace-pre-line text-sm max-h-80 overflow-y-auto">{lyrics}</div>
        </DialogContent>
      </Dialog>
    </>
  );
};


export default SongCard;
