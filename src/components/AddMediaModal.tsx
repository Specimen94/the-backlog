import { useState } from "react";
import { MediaCategory, MediaStatus, ALL_CATEGORIES, CATEGORY_LABELS, STATUS_LABELS } from "@/types/media";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface AddMediaModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    coverUrl: string;
    category: MediaCategory;
    status: MediaStatus;
    rating: number | null;
    showRating: boolean;
    description: string;
  }) => void;
  editItem?: {
    name: string;
    coverUrl: string;
    category: MediaCategory;
    status: MediaStatus;
    rating: number | null;
    showRating: boolean;
    description: string;
  } | null;
}

export function AddMediaModal({ open, onClose, onAdd, editItem }: AddMediaModalProps) {
  const [name, setName] = useState(editItem?.name || "");
  const [coverUrl, setCoverUrl] = useState(editItem?.coverUrl || "");
  const [category, setCategory] = useState<MediaCategory>(editItem?.category || "anime");
  const [status, setStatus] = useState<MediaStatus>(editItem?.status || "plan_to_watch");
  const [rating, setRating] = useState<number | null>(editItem?.rating ?? null);
  const [showRating, setShowRating] = useState(editItem?.showRating ?? true);
  const [description, setDescription] = useState(editItem?.description || "");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), coverUrl: coverUrl.trim(), category, status, rating, showRating, description: description.trim() });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName(""); setCoverUrl(""); setCategory("anime"); setStatus("plan_to_watch");
    setRating(null); setShowRating(true); setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">{editItem ? "Edit Media" : "Add to Back-Log"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Title *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter media title..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Cover URL */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Cover Image URL</label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/cover.jpg"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
            {coverUrl && (
              <div className="mt-2 w-20 aspect-[2/3] rounded-md overflow-hidden bg-muted">
                <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-foreground hover:bg-surface-hover">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as MediaStatus)}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {(["watching", "plan_to_watch", "finished", "dropped"] as MediaStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground hover:bg-surface-hover">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-muted-foreground">Rating</label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRating}
                  onChange={(e) => setShowRating(e.target.checked)}
                  className="rounded"
                />
                Show on card
              </label>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(rating === n ? null : n)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      rating !== null && n <= rating
                        ? "text-rating fill-rating"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              {rating !== null && <span className="text-sm text-rating self-center ml-1">{rating}/10</span>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or description..."
              rows={3}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {editItem ? "Save Changes" : "Add to Back-Log"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
