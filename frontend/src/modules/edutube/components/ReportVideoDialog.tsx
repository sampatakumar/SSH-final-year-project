import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { EduTubeApi } from "../services/edutube.api";

export interface ReportVideoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle?: string;
  defaultFeedbackType?: "false_positive" | "false_negative" | "inappropriate";
}

export const ReportVideoDialog: React.FC<ReportVideoDialogProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle = "Selected Video",
  defaultFeedbackType = "false_positive",
}) => {
  const [feedbackType, setFeedbackType] = useState<
    "false_positive" | "false_negative" | "inappropriate"
  >(defaultFeedbackType);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId) return;

    try {
      setIsSubmitting(true);
      await EduTubeApi.reportClassification({
        videoId,
        feedbackType,
        notes: notes.trim(),
      });
      toast.success("Thank you! Your content classification report has been recorded.");
      setNotes("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-surface border border-border/40 shadow-neo-raised">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-bold">
            <Flag className="h-5 w-5" />
            <DialogTitle>Report Classification</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Help improve EduTube's deterministic education classifier by flagging misclassified content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-2.5 rounded-xl bg-background border border-border/30 text-xs">
            <span className="font-bold text-foreground line-clamp-1">{videoTitle}</span>
            <span className="text-[11px] text-muted-foreground font-mono">ID: {videoId}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">Issue Type</label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:bg-muted/40 cursor-pointer">
                <input
                  type="radio"
                  name="feedbackType"
                  value="false_positive"
                  checked={feedbackType === "false_positive"}
                  onChange={() => setFeedbackType("false_positive")}
                  className="accent-primary"
                />
                <div>
                  <span className="font-semibold block text-foreground">False Positive</span>
                  <span className="text-[11px] text-muted-foreground">
                    This is genuine educational content, but it was incorrectly blocked.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:bg-muted/40 cursor-pointer">
                <input
                  type="radio"
                  name="feedbackType"
                  value="false_negative"
                  checked={feedbackType === "false_negative"}
                  onChange={() => setFeedbackType("false_negative")}
                  className="accent-primary"
                />
                <div>
                  <span className="font-semibold block text-foreground">False Negative</span>
                  <span className="text-[11px] text-muted-foreground">
                    This is entertainment / music / short-form content that bypassed filtering.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-notes" className="text-xs font-bold text-foreground">
              Additional Details (Optional)
            </label>
            <textarea
              id="report-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. University lecture on quantum mechanics, not entertainment."
              rows={3}
              maxLength={400}
              className="w-full text-xs p-2.5 rounded-xl bg-background border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-bold gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
