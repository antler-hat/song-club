import { createContext, useContext, useRef, useState, ReactNode } from "react";

interface Track {
  id: string;
  title: string;
  file_url: string;
  user_id: string;
  username: string; // uploader's username
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playTrack: (track: Track, forceRestart?: boolean) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  seekTo: (time: number) => void;
  isLoading: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const playTrack = (track: Track, forceRestart: boolean = false) => {
    setIsLoading(true);
    if (audioRef.current) {
      if (currentTrack?.id !== track.id) {
        audioRef.current.src = track.file_url;
        setCurrentTrack(track);
        audioRef.current.currentTime = 0;
      } else if (forceRestart) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeTrack = () => {
    if (audioRef.current) {
      // Only set loading if audio is not ready to play
      if (audioRef.current.readyState < 3) { // HAVE_FUTURE_DATA
        setIsLoading(true);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };


  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      playTrack,
      pauseTrack,
      resumeTrack,
      seekTo
    }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          setIsPlaying(false);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onCanPlayThrough={() => setIsLoading(false)}
        style={{ display: 'none' }}
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
