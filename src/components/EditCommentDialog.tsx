import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

interface EditCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCommentText: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  submitting: boolean;
  onCancel: () => void;
  confirmDelete: boolean;
  setConfirmDelete: (val: boolean) => void;
}

const EditCommentDialog: React.FC<EditCommentDialogProps> = ({
  open,
  onOpenChange,
  editCommentText,
  onChange,
  onSave,
  onDelete,
  submitting,
  onCancel,
  confirmDelete,
  setConfirmDelete,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-brutalist max-w-md">
      <DialogHeader>
        <DialogTitle className="font-bold text-base">Edit Comment</DialogTitle>
      </DialogHeader>
      <Textarea
        placeholder="Edit your comment..."
        value={editCommentText}
        onChange={onChange}
        className="border-brutalist resize-none"
        rows={3}
      />
      <div className="flex justify-between items-center items-end mt-2">
        {/* Delete button bottom left */}
        <div>
          {!confirmDelete ? (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => setConfirmDelete(true)}
              disabled={submitting}
            >
              Delete comment
            </button>
          ) : (
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={onDelete}
              disabled={submitting}
            >
              Yes delete this idiot comment
            </button>
          )}
        </div>
        {/* Save/Cancel right */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-brutalist"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!editCommentText.trim() || submitting}
            className="border-brutalist"
          >
            <span>Save</span>
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default EditCommentDialog;
