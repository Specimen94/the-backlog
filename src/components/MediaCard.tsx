import { useState } from "react";
import { MediaItem, MediaStatus, getStatusLabel, PROGRESS_UNITS } from "@/types/media";
import { Star, Trash2 } from "lucide-react";
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

interface MediaCardProps {
  item: MediaItem;
  onStatusChange: (id: string, status: MediaStatus) => void;
  onDelete: (id: string) => void;
  onClick: (item: MediaItem) => void;
}

const statusButtonStyles: Record<MediaStatus, string> = {
  watching: "bg-status-watching/90 hover:bg-status-watching",
  plan_to_watch: "bg-status-plan/90 hover:bg-status-plan",
  finished: "bg-status-finished/90 hover:bg-status-finished",
  dropped: "bg-status-dropped/90 hover:bg-status-dropped",
};

export function MediaCard({ item, onStatusChange, onDelete, onClick }: MediaCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div
        className="group relative flex-shrink-0 w-[180px] cursor-pointer animate-fade-in"
        onClick={() => onClick(item)}
      >
        <div className="media-card-glow rounded-lg overflow-hidden bg-card border border-border/50">
          <div className="relative aspect-[2/3] overflow-hidden bg-muted">
            {item.coverUrl ? (
              <img src={item.coverUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                No Cover
              </div>
            )}

            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-primary-foreground ${statusButtonStyles[item.status]}`}>
              {getStatusLabel(item.status, item.category)}
            </div>

            {item.showRating && item.rating !== null && (
              <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                <Star className="w-3 h-3 text-rating fill-rating" />
                <span className="text-[11px] font-bold text-rating">{item.rating}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              {(["watching", "plan_to_watch", "finished", "dropped"] as MediaStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, status); }}
                  className={`w-full py-1.5 rounded-md text-xs font-medium text-primary-foreground transition-all ${statusButtonStyles[status]} ${item.status === status ? "ring-2 ring-foreground/50" : ""}`}
                >
                  {getStatusLabel(status, item.category)}
                </button>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="w-full py-1.5 rounded-md text-xs font-semibold text-destructive-foreground bg-destructive/90 hover:bg-destructive transition-all flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>

          <div className="p-2.5">
            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{getStatusLabel(item.status, item.category)}</p>
            {item.progress && PROGRESS_UNITS[item.category] && (
              <div className="mt-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                  <span>
                    {item.progress.current}
                    {item.progress.total ? ` / ${item.progress.total}` : ""} {PROGRESS_UNITS[item.category]!.unitShort}
                  </span>
                  {item.progress.total ? (
                    <span>{Math.min(100, Math.round((item.progress.current / item.progress.total) * 100))}%</span>
                  ) : null}
                </div>
                {item.progress.total ? (
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, (item.progress.current / item.progress.total) * 100)}%` }}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete "{item.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This permanently removes it from your back-log. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border hover:bg-surface-hover">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { onDelete(item.id); setConfirmDelete(false); }}
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
