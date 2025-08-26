import { useState, useEffect, useRef } from "react";
import './SongItem.scss';
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
  selected?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
}

const SongCard = ({ song, onSongChanged, showLyricsExpanded, selected = false, onClick }: SongCardProps) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useAudio();
  const { user } = useAuth();
  const { toast } = useToast();
  const isTouchDevice = useIsMobile();

  // Handle double click and keyboard events for play-from-beginning
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTrack({ ...song, username: song.profiles.username }, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    if (e.key === "Enter") {
      e.preventDefault();
      playTrack({ ...song, username: song.profiles.username }, true);
    } else if (e.key === " ") {
      e.preventDefault();
      handlePlayPause();
    }
  };

  const [themeId, setThemeId] = useState<string>(song.theme_id || "");

  // const [comments, setComments] = useState<any[]>([]);
  // const [loading, setLoading] = useState(false);
  // const [submitting, setSubmitting] = useState(false);

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



  return (
    <div
      className={`songItem${selected ? " is-selected" : ""}`}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isCurrentSong && isPlaying}
    >
      <div>
        <div className="songItem-mainContent" >
          <div className="songItem-playpause">
            <Button onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
              className={`playpause-button${isSongPlaying ? " is-paused" : ""}`}
            >
              {isSongPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
          </div>
          <div className="songItem-mainDetails">
            <h3 className="songItem-songTitle">
              <Link to={`/track/${song.id}`} onClick={e => e.stopPropagation()}>{song.title}</Link>
            </h3>
            <div className="songItem-username">
              <Link to={`/user/${song.user_id}`} onClick={e => e.stopPropagation()}>{song.profiles.username}</Link>
            </div>
            <div className="songItem-theme">
              <Link to={`/theme/${song.theme_id}`} className="songItem-themeLink" onClick={e => e.stopPropagation()}>{song.theme?.name || "No theme"}</Link>
            </div>
          </div>

          <div className="songItem-lyrics">
            {/* Song lyrics button */}
            {song.lyrics && !showLyricsExpanded &&
              (<LyricsModalButton lyrics={song.lyrics} />)}

          </div>
        </div>
      </div>
    </div >
  );


};
const LyricsModalButton = ({ lyrics }: { lyrics: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setOpen(true); }}>
            <NotebookText size={16} />
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
