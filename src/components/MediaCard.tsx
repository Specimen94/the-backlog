import { useState } from "react";
import { MediaItem, MediaStatus, STATUS_LABELS, CATEGORY_LABELS } from "@/types/media";
import { Star } from "lucide-react";
import { StatusConfirmDialog } from "./StatusConfirmDialog";

interface MediaCardProps {
  item: MediaItem;
  onStatusChange: (id: string, status: MediaStatus) => void;
  onClick: (item: MediaItem) => void;
}

const statusButtonStyles: Record<MediaStatus, string> = {
  watching: "bg-status-watching/90 hover:bg-status-watching",
  plan_to_watch: "bg-status-plan/90 hover:bg-status-plan",
  finished: "bg-status-finished/90 hover:bg-status-finished",
  dropped: "bg-status-dropped/90 hover:bg-status-dropped",
};

export function MediaCard({ item, onStatusChange, onClick }: MediaCardProps) {
  const [confirmStatus, setConfirmStatus] = useState<MediaStatus | null>(null);

  return (
    <>
      <div
        className="group relative flex-shrink-0 w-[180px] cursor-pointer animate-fade-in"
        onClick={() => onClick(item)}
      >
        {/* Card */}
        <div className="media-card-glow rounded-lg overflow-hidden bg-card border border-border/50">
          {/* Cover image */}
          <div className="relative aspect-[2/3] overflow-hidden bg-muted">
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                No Cover
              </div>
            )}

            {/* Status badge */}
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-primary-foreground ${statusButtonStyles[item.status]}`}>
              {STATUS_LABELS[item.status]}
            </div>

            {/* Rating badge */}
            {item.showRating && item.rating !== null && (
              <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                <Star className="w-3 h-3 text-rating fill-rating" />
                <span className="text-[11px] font-bold text-rating">{item.rating}</span>
              </div>
            )}

            {/* Hover overlay with status buttons */}
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              {(["watching", "plan_to_watch", "finished", "dropped"] as MediaStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmStatus(status);
                  }}
                  className={`w-full py-1.5 rounded-md text-xs font-medium text-primary-foreground transition-all ${statusButtonStyles[status]} ${item.status === status ? "ring-2 ring-foreground/50" : ""}`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Info below image */}
          <div className="p-2.5">
            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{CATEGORY_LABELS[item.category]}</p>
          </div>
        </div>
      </div>

      {confirmStatus && (
        <StatusConfirmDialog
          mediaName={item.name}
          newStatus={confirmStatus}
          onConfirm={() => {
            onStatusChange(item.id, confirmStatus);
            setConfirmStatus(null);
          }}
          onCancel={() => setConfirmStatus(null)}
        />
      )}
    </>
  );
}
