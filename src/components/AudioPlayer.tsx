import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/hooks/useAudio";

const AudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    pauseTrack,
    resumeTrack,
    seekTo,
    setVolume,
  } = useAudio();

  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (value: number[]) => {
    seekTo((value[0] / 100) * duration);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t-brutalist p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold truncate">{currentTrack.title}</h4>
            {currentTrack.artist && (
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            
            <Button
              onClick={isPlaying ? pauseTrack : resumeTrack}
              size="sm"
              className="border-brutalist"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
          </div>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs">{formatTime(currentTime)}</span>
            <Slider
              value={[progress]}
              onValueChange={handleProgressChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs">{formatTime(duration)}</span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 size={16} />
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;