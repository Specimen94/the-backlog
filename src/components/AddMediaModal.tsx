import { useState, useEffect, useRef, useCallback } from "react";
import { MediaCategory, MediaStatus, ALL_CATEGORIES, CATEGORY_LABELS, getStatusLabel } from "@/types/media";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star, Search, Loader2, Wand2, X } from "lucide-react";
import { searchMedia, SearchResult } from "@/lib/mediaSearch";

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

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCoverUrl(editItem.coverUrl);
      setCategory(editItem.category);
      setStatus(editItem.status);
      setRating(editItem.rating);
      setShowRating(editItem.showRating);
      setDescription(editItem.description);
      setAutoFilled(false);
    }
  }, [editItem]);

  useEffect(() => {
    if (editItem || name.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchMedia(name, category);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchError("Search failed. You can still add manually.");
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, category, editItem]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectResult = useCallback((result: SearchResult) => {
    setName(result.title);
    if (result.coverUrl) setCoverUrl(result.coverUrl);
    if (result.description) setDescription(result.description);
    setCategory(result.category);
    setShowDropdown(false);
    setAutoFilled(true);
  }, []);

  const clearAutoFill = () => {
    setAutoFilled(false);
    setCoverUrl("");
    setDescription("");
    setName("");
    setSearchResults([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      coverUrl: coverUrl.trim(),
      category,
      status,
      rating,
      showRating,
      description: description.trim(),
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setCoverUrl("");
    setCategory("anime");
    setStatus("plan_to_watch");
    setRating(null);
    setShowRating(true);
    setDescription("");
    setSearchResults([]);
    setShowDropdown(false);
    setAutoFilled(false);
    setSearchError(null);
  };

  const statusOptions: MediaStatus[] = ["watching", "plan_to_watch", "finished", "dropped"];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">
            {editItem ? "Edit Media" : "Add to Back-Log"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title + live search dropdown */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Title *</label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setAutoFilled(false); }}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  placeholder="Type a title to search..."
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearching
                    ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    : <Search className="w-4 h-4 text-muted-foreground/50" />
                  }
                </div>
              </div>

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                      Select to auto-fill
                    </span>
                  </div>
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/70 transition-colors text-left group"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectResult(result); }}
                    >
                      <div className="w-9 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                        {result.coverUrl ? (
                          <img src={result.coverUrl} alt="" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">No img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {CATEGORY_LABELS[result.category]}
                          </span>
                          {result.year && <span className="text-[10px] text-muted-foreground">{result.year}</span>}
                          <span className="text-[10px] text-muted-foreground/50">{result.source}</span>
                        </div>
                        {result.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{result.description}</p>
                        )}
                      </div>
                      <Wand2 className="w-3.5 h-3.5 text-primary/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {autoFilled && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Wand2 className="w-2.5 h-2.5" /> Auto-filled from internet
                </span>
                <button onClick={clearAutoFill} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                  <X className="w-2.5 h-2.5" /> Clear
                </button>
              </div>
            )}

            {searchError && <p className="text-[10px] text-muted-foreground mt-1">{searchError}</p>}
            {!editItem && name.length >= 2 && !isSearching && searchResults.length === 0 && !searchError && (
              <p className="text-[10px] text-muted-foreground mt-1">No results found — you can still fill in details manually below.</p>
            )}
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
                <img src={coverUrl} alt="Preview" className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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

          {/* Status — uses category-aware labels */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as MediaStatus)}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground hover:bg-surface-hover">
                    {getStatusLabel(s, category)}
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
                <input type="checkbox" checked={showRating} onChange={(e) => setShowRating(e.target.checked)} className="rounded" />
                Show on card
              </label>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setRating(rating === n ? null : n)} className="p-1 transition-colors">
                  <Star className={`w-5 h-5 transition-colors ${rating !== null && n <= rating ? "text-rating fill-rating" : "text-muted-foreground"}`} />
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
