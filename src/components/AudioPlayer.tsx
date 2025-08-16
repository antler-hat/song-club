import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/hooks/useAudio";
import "./AudioPlayer.scss"

const AudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
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
    <div className="audioPlayer">
      <div className="max-w-4xl px-4 mx-auto">
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
          {/* Track Info */}
          <div className="flex flex-1 min-w-0 mb-1 sm:mb-0 items-center">
            <div className="flex flex-col min-w-0">
              <h4 className="text-sm font-bold truncate">{currentTrack.title}</h4>
              <p className="text-sm truncate">
                {currentTrack.username}
              </p>
            </div>
          </div>
          {/* Controls + Progress (mobile: row, desktop: keep as before) */}
          <div className="flex flex-row items-center gap-2 flex-1">
            {/* Controls */}
            <Button
              onClick={isLoading ? undefined : (isPlaying ? pauseTrack : resumeTrack)}
              size="sm"
              className="audioPlayer-playPauseButton"
            >
              {isLoading
                ? <Loader2 size={16} className="animate-spin" />
                : isPlaying
                  ? <Pause size={16} />
                  : <Play size={16} />
              }
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
