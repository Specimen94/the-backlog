import { MediaCategory, MediaStatus, CATEGORY_LABELS } from "@/types/media";

interface CategoryTabsProps {
  categories: MediaCategory[];
  activeCategory: MediaCategory | "all";
  onSelect: (cat: MediaCategory | "all") => void;
  sortByRating: boolean;
  onToggleSortByRating: () => void;
  statusFilter: MediaStatus | null;
  onStatusFilterChange: (status: MediaStatus | null) => void;
}

const STATUS_FILTER_OPTIONS: { status: MediaStatus; label: string; activeClass: string }[] = [
  { status: "watching",      label: "Watching / Playing",  activeClass: "bg-status-watching text-primary-foreground" },
  { status: "plan_to_watch", label: "Plan to Watch",        activeClass: "bg-status-plan text-primary-foreground" },
  { status: "finished",      label: "Finished",             activeClass: "bg-status-finished text-primary-foreground" },
  { status: "dropped",       label: "Dropped",              activeClass: "bg-status-dropped text-primary-foreground" },
];

export function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
  sortByRating,
  onToggleSortByRating,
  statusFilter,
  onStatusFilterChange,
}: CategoryTabsProps) {
  return (
    <div className="space-y-3">
      {/* Category row */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 px-1"
        style={{ scrollbarWidth: "none" }}
      >
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

      {/* Status filter row */}
      <div className="flex items-center gap-2 px-1 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Filter:</span>
        {STATUS_FILTER_OPTIONS.map(({ status, label, activeClass }) => (
          <button
            key={status}
            onClick={() => onStatusFilterChange(statusFilter === status ? null : status)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              statusFilter === status
                ? activeClass
                : "bg-muted text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
