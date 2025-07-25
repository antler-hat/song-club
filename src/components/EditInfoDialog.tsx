import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface EditInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editedTitle: string;
  editedLyrics: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLyricsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  onCancel: () => void;
  originalTitle: string;
  originalLyrics: string | null;
}

const EditInfoDialog: React.FC<EditInfoDialogProps> = ({
  open,
  onOpenChange,
  editedTitle,
  editedLyrics,
  onTitleChange,
  onLyricsChange,
  onSave,
  saving,
  onCancel,
  originalTitle,
  originalLyrics,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-brutalist max-w-md max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="font-bold text-base">Edit Info</DialogTitle>
      </DialogHeader>
      <input
        type="text"
        className="border-brutalist w-full px-3 py-2 rounded mb-4"
        value={editedTitle}
        onChange={onTitleChange}
        autoFocus
      />
      <textarea
        placeholder="Lyrics (optional)"
        className="border-brutalist w-full p-2 rounded placeholder:text-muted-foreground text-sm bg-background resize-y h-80"
        rows={2}
        value={editedLyrics}
        onChange={onLyricsChange}
      />
      <div className="flex justify-end gap-2 mt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-brutalist"
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={
            !editedTitle.trim() ||
            (editedTitle === originalTitle && editedLyrics === (originalLyrics || "")) ||
            saving
          }
          className="border-brutalist"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default EditInfoDialog;
