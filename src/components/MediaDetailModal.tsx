import { MediaItem, CATEGORY_LABELS, STATUS_COLORS, getStatusLabel } from "@/types/media";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Pencil, Trash2, Calendar } from "lucide-react";

interface MediaDetailModalProps {
  item: MediaItem | null;
  open: boolean;
  onClose: () => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
}

export function MediaDetailModal({ item, open, onClose, onEdit, onDelete }: MediaDetailModalProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Cover */}
          <div className="w-full md:w-[220px] flex-shrink-0">
            {item.coverUrl ? (
              <img src={item.coverUrl} alt={item.name} className="w-full h-[300px] md:h-full object-cover" />
            ) : (
              <div className="w-full h-[300px] md:h-full bg-muted flex items-center justify-center text-muted-foreground">
                No Cover
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{item.name}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary-foreground ${STATUS_COLORS[item.status]}`}>
                  {STATUS_LABELS[item.status]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                  {CATEGORY_LABELS[item.category]}
                </span>
              </div>
            </div>

            {/* Rating */}
            {item.rating !== null && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < item.rating! ? "text-rating fill-rating" : "text-muted-foreground/30"}`}
                  />
                ))}
                <span className="text-sm text-rating ml-1 font-semibold">{item.rating}/10</span>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Added {new Date(item.dateAdded).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-surface-hover"
                onClick={() => onEdit(item)}
              >
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
