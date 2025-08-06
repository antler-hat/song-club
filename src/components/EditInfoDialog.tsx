import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import React from "react";
import { Label } from "@/components/ui/label";
import { useThemes } from "@/hooks/useThemes";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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
  originalThemeId: string;
  themeId: string;
  onThemeChange: (value: string) => void;
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
  originalThemeId,
  themeId,
  onThemeChange,
}) => {
  const themes = useThemes();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-bold text-base">Edit Info</DialogTitle>
        </DialogHeader>
        <div className="input-group">
          <Label htmlFor="title">Title*</Label>
          <Input
            id="title"
            type="text"
            value={editedTitle}
            onChange={onTitleChange}
            autoFocus
          />
        </div>
        <div className="input-group">
          <Label htmlFor="theme">Theme*</Label>
          <Select value={themeId} onValueChange={onThemeChange}>
            <SelectTrigger id="theme" className="w-full">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="input-group">
          <Label htmlFor="lyrics">Lyrics (Optional)</Label>
          <Textarea
            id="lyrics"
            className="w-full"
            rows={6}
            value={editedLyrics}
            onChange={onLyricsChange}
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={
              !editedTitle.trim() ||
              (
                editedTitle === originalTitle &&
                editedLyrics === (originalLyrics || "") &&
                themeId === originalThemeId
              ) ||
              saving
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditInfoDialog;
