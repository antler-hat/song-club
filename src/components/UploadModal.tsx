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
  const [artist, setArtist] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('audio/')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive",
        });
      }
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
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('tracks')
        .getPublicUrl(fileName);

      // Create track record
      const { error: dbError } = await supabase
        .from('tracks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          artist: artist.trim() || null,
          file_url: publicUrl,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload successful",
        description: "Your track has been uploaded",
      });

      // Reset form
      setTitle("");
      setArtist("");
      setFile(null);
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
        <Button className="border-brutalist">
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
              className="border-brutalist uppercase placeholder:text-muted-foreground"
            />
          </div>
          
          <div>
            <Input
              type="text"
              placeholder="ARTIST (OPTIONAL)"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="border-brutalist uppercase placeholder:text-muted-foreground"
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
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="w-full border-brutalist font-bold"
          >
            {uploading ? "UPLOADING..." : "UPLOAD TRACK"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;