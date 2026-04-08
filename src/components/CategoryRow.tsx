import { useRef } from "react";
import { MediaItem, MediaStatus, CATEGORY_LABELS, MediaCategory } from "@/types/media";
import { MediaCard } from "./MediaCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryRowProps {
  category: MediaCategory;
  items: MediaItem[];
  onStatusChange: (id: string, status: MediaStatus) => void;
  onItemClick: (item: MediaItem) => void;
}

export function CategoryRow({ category, items, onStatusChange, onItemClick }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
        {CATEGORY_LABELS[category]}
        <span className="text-muted-foreground text-sm font-normal ml-2">({items.length})</span>
      </h2>
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-1" style={{ scrollbarWidth: "none" }}>
          {items.map((item) => (
            <MediaCard key={item.id} item={item} onStatusChange={onStatusChange} onClick={onItemClick} />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-background/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}
