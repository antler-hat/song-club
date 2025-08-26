import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AudioProvider, useAudio } from "@/hooks/useAudio";
import AudioPlayer from "@/components/AudioPlayer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import TrackDetail from "./pages/SongDetail";
import ThemePage from "./pages/ThemePage";

const queryClient = new QueryClient();

// Component to handle global spacebar play/pause
function GlobalAudioHotkeys() {
  const { currentTrack, isPlaying, pauseTrack, resumeTrack } = useAudio();

  useEffect(() => {
    const handleSpacebar = (event: KeyboardEvent) => {
      if (
        (event.code === "Space" || event.key === " " || event.key === "Spacebar") &&
        !(event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLButtonElement)
      ) {
        if (currentTrack) {
          event.preventDefault();
          if (isPlaying) {
            pauseTrack();
          } else {
            resumeTrack();
          }
        }
      }
    };
    window.addEventListener("keydown", handleSpacebar);
    return () => window.removeEventListener("keydown", handleSpacebar);
  }, [currentTrack, isPlaying, pauseTrack, resumeTrack]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AudioProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <GlobalAudioHotkeys />
          <AudioPlayer />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/track/:trackId" element={<TrackDetail />} />
              <Route path="/theme/:themeId" element={<ThemePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AudioProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
