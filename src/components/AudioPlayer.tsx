import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/hooks/useAudio";

const AudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    pauseTrack,
    resumeTrack,
    seekTo,
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-brutalist border-r-0 border-l-0 border-b-0  p-2 pb-8 sm:p-4 sm:pb-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
          {/* Track Info */}
          <div className="flex flex-1 min-w-0 mb-0 sm:mb-0 items-center">
            <h4 className="font-bold truncate">{currentTrack.title}</h4>
            {currentTrack.artist && (
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            )}
          </div>
          {/* Controls + Progress (mobile: row, desktop: keep as before) */}
          <div className="flex flex-row items-center gap-2 flex-1">
            {/* Controls */}
            <Button
              onClick={isPlaying ? pauseTrack : resumeTrack}
              size="sm"
              className="border-brutalist"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            {/* Progress */}
            <div className="flex flex-1 items-center gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
