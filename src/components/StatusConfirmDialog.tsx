import { MediaStatus } from "@/types/media";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StatusConfirmDialogProps {
  mediaName: string;
  newStatus: MediaStatus;
  newStatusLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StatusConfirmDialog({ mediaName, newStatusLabel, onConfirm, onCancel }: StatusConfirmDialogProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Remove from Back-Log?</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            This will mark{" "}
            <span className="font-semibold text-foreground">"{mediaName}"</span>{" "}
            as{" "}
            <span className="font-semibold text-destructive">{newStatusLabel}</span>{" "}
            and remove it from your active lists. You can still find it by filtering for Dropped.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted text-foreground border-border hover:bg-surface-hover">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Yes, {newStatusLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
