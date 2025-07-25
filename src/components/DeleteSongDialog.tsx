import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface DeleteSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  deleting: boolean;
  onCancel: () => void;
}

const DeleteSongDialog: React.FC<DeleteSongDialogProps> = ({
  open,
  onOpenChange,
  onDelete,
  deleting,
  onCancel,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-brutalist max-w-md">
      <DialogHeader>
        <DialogTitle className="font-bold text-base">Are you sure?</DialogTitle>
      </DialogHeader>
      <div className="py-2">
        <p>Your song will be gone for good!</p>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={deleting}
          className="border-brutalist"
        >
          Cancel
        </Button>
        <Button
          onClick={onDelete}
          disabled={deleting}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          {deleting ? "Deleting..." : "Delete song"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default DeleteSongDialog;
