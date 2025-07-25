import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

interface AddCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newComment: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  trigger?: React.ReactNode;
}

const AddCommentDialog: React.FC<AddCommentDialogProps> = ({
  open,
  onOpenChange,
  newComment,
  onChange,
  onSubmit,
  submitting,
  trigger,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      {trigger}
    </DialogTrigger>
    <DialogContent className="border-brutalist max-w-md">
      <DialogHeader>
        <DialogTitle className="font-bold text-base">Add Comment</DialogTitle>
      </DialogHeader>
      <Textarea
        placeholder="Write your comment..."
        value={newComment}
        onChange={onChange}
        className="border-brutalist resize-none"
        rows={3}
      />
      <div className="flex justify-end">
        <Button
          onClick={async () => {
            await onSubmit();
            onOpenChange(false);
          }}
          disabled={!newComment.trim() || submitting}
          className="border-brutalist"
        >
          <span>Post</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default AddCommentDialog;
