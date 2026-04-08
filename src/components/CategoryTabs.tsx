import { MediaCategory, CATEGORY_LABELS } from "@/types/media";

interface CategoryTabsProps {
  categories: MediaCategory[];
  activeCategory: MediaCategory | "all";
  onSelect: (cat: MediaCategory | "all") => void;
  sortByRating: boolean;
  onToggleSortByRating: () => void;
}

export function CategoryTabs({ categories, activeCategory, onSelect, sortByRating, onToggleSortByRating }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
      <button
        onClick={() => onSelect("all")}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          activeCategory === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            activeCategory === cat
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          }`}
        >
          {CATEGORY_LABELS[cat]}
        </button>
      ))}

      <div className="ml-auto flex-shrink-0">
        <button
          onClick={onToggleSortByRating}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            sortByRating
              ? "bg-rating/20 text-rating"
              : "bg-muted text-muted-foreground hover:bg-surface-hover"
          }`}
        >
          ★ Highest Rated
        </button>
      </div>
    </div>
  );
}
