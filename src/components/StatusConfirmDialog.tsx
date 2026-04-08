import { MediaStatus, STATUS_LABELS } from "@/types/media";
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
  onConfirm: () => void;
  onCancel: () => void;
}

export function StatusConfirmDialog({ mediaName, newStatus, onConfirm, onCancel }: StatusConfirmDialogProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Change Status</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Set <span className="font-semibold text-foreground">"{mediaName}"</span> to{" "}
            <span className="font-semibold text-primary">{STATUS_LABELS[newStatus]}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted text-foreground border-border hover:bg-surface-hover">Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onConfirm}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
