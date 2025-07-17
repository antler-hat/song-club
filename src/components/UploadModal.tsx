import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  onUploadComplete: () => void;
}

const UploadModal = ({ onUploadComplete }: UploadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [lyrics, setLyrics] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive",
        });
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum allowed size is 50MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !file || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Use secure upload edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (lyrics.trim()) formData.append('artist', lyrics.trim());

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const response = await fetch(`https://rfeqlcvmeandyuakrmqf.supabase.co/functions/v1/upload-track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast({
        title: "Upload successful",
        description: "Your track has been uploaded",
      });

      // Reset form
      setTitle("");
      setFile(null);
      setLyrics("");
      setOpen(false);
      onUploadComplete();

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload size={16} className="mr-1" />
          Upload a Song
        </Button>
      </DialogTrigger>
      <DialogContent className="border-brutalist">
        <DialogHeader>
          <DialogTitle className="font-bold">Upload a song</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Title*"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border-brutalist placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <textarea
              placeholder="Lyrics (optional)"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="border-brutalist w-full p-2 rounded placeholder:text-muted-foreground text-sm bg-background resize-y"
              rows={4}
            />
          </div>
          <div>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm border-brutalist p-2 bg-background"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="w-full border-brutalist font-bold"
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
