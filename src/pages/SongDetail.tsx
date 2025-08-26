
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AudioPlayer from "@/components/AudioPlayer";
import Navbar from "@/components/Navbar";
import './SongDetail.scss';
import { Pause, Play, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import EditInfoDialog from "@/components/EditInfoDialog";
import DeleteSongDialog from "@/components/DeleteSongDialog";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/useAudio";

interface Song {
  id: string;
  title: string;
  file_url: string;
  user_id: string;
  created_at: string;
  lyrics?: string | null;
  theme_id?: string | null;
  theme?: { name: string };
  profiles: {
    username: string;
  };
}

const SongDetail = () => {
  const { user } = useAuth();
  const { trackId } = useParams<{ trackId: string }>();
  const { toast } = useToast();
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = useAudio();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedLyrics, setEditedLyrics] = useState("");
  const [editTitleModalOpen, setEditTitleModalOpen] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [themeId, setThemeId] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replacing, setReplacing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if current user owns the song
  const isOwnSong = user?.id === song?.user_id;

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handlePlayPause = () => {
    if (!song) return;
    if (currentTrack?.id === song.id) {
      if (isPlaying) {
        pauseTrack();
      } else {
        resumeTrack();
      }
    } else {
      playTrack({
        id: song.id,
        title: song.title,
        file_url: song.file_url,
        user_id: song.user_id,
        username: song.profiles.username,
      });
    }
  };

  const handleReplaceAudioClick = () => {
    fileInputRef.current?.click();
  };

  const handleReplaceAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!song) return;
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
      // Optionally, refetch song data here
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Replace failed", variant: "destructive" });
    } finally {
      setReplacing(false);
    }
  };

  const handleDeleteTrack = async () => {
    if (!song) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('songs').delete().eq('id', song.id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Song has been deleted." });
      setDeleteDialogOpen(false);
      // Optionally, redirect or update UI here
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Delete failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchSong = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data: songData, error: songError } = await supabase
          .from("songs")
          .select(`
            id,
            title,
            file_url,
            user_id,
            created_at,
            lyrics,
            theme_id,
            theme:themes(name)
          `)
          .eq("id", trackId)
          .single();

        if (songError || !songData) {
          setNotFound(true);
          setSong(null);
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, username")
          .eq("user_id", songData.user_id)
          .single();

        const rawTheme = songData.theme as unknown;
        let themeObj: { name: string } | undefined;
        if (rawTheme !== null && typeof rawTheme === "object" && "name" in rawTheme) {
          themeObj = rawTheme as { name: string };
        }

        setSong({
          id: songData.id,
          title: songData.title,
          file_url: songData.file_url,
          user_id: songData.user_id,
          created_at: songData.created_at,
          lyrics: songData.lyrics,
          theme_id: songData.theme_id,
          theme: themeObj,
          profiles: profileData
            ? { username: profileData.username }
            : { username: "Unknown" },
        });
      } catch (e) {
        setNotFound(true);
        setSong(null);
      } finally {
        setLoading(false);
      }
    };

    if (trackId) fetchSong();
  }, [trackId]);

  useEffect(() => {
    if (song) {
      document.title = `${song.title} by ${song.profiles.username} | Song Club`;
    } else if (loading) {
      document.title = "Loading... | Song Club";
    } else if (notFound) {
      document.title = "Song not found | Song Club";
    } else {
      document.title = "Song Club";
    }

    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', document.title);
    }
  }, [song, loading, notFound]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (notFound || !song) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="mb-4 text-lg font-bold">Song not found</div>
        <a href="/" className="underline">
          Back to home
        </a>
      </div>
    );
  }

  return (
    <>
      <Navbar
        user={user}
        showSearch={true}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showUpload={true}
        onUploadComplete={() => { }}
        showLoginButton={true}
      />
      <main className="container">
        <div className="songDetail">
          <div className="songDetail-playpause">
            <Button onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
              className="playpause-button"
            >
              {currentTrack?.id === song.id && isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </Button>
          </div>
          <div className="songDetail-mainDetails">
            <h3 className="songDetail-songTitle">
              <Link to={`/track/${song.id}`} onClick={e => e.stopPropagation()}>{song.title}</Link>
            </h3>
            <div className="songDetail-username">
              <Link to={`/user/${song.user_id}`} onClick={e => e.stopPropagation()}>{song.profiles.username}</Link>
            </div>
            <div className="songDetail-theme">
              <Link to={`/theme/${song.theme_id}`} className="songDetail-themeLink" onClick={e => e.stopPropagation()}>{song.theme?.name || "No theme"}</Link>
            </div>
            {song.lyrics && (
              <div className="songDetail-lyrics">{song.lyrics}</div>
            )}
          </div>
          <div className="songDetail-actions">
            {isOwnSong && (
              <div>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                  <DropdownMenuTrigger
                    asChild onClick={e => e.stopPropagation()}
                    {...(isTouchDevice
                      ? {
                        onPointerDown: (e) => e.preventDefault(),
                        onClick: () => setOpen(!open)
                      }
                      : undefined)}
                  >
                    <Button
                      variant="ghost"
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
                <EditInfoDialog
                  open={editTitleModalOpen}
                  onOpenChange={setEditTitleModalOpen}
                  editedTitle={editedTitle}
                  editedLyrics={editedLyrics}
                  onTitleChange={e => setEditedTitle(e.target.value)}
                  onLyricsChange={e => setEditedLyrics(e.target.value)}
                  onSave={async () => {
                    if (!song) return;
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
                      // Optionally, refetch song data here
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
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  style={{
                    display: "none"
                  }}
                  onChange={handleReplaceAudioFile}
                  disabled={replacing} />
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
      </main>
      <AudioPlayer />
    </>
  );
};


export default SongDetail;
