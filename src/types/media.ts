export type MediaStatus = "watching" | "plan_to_watch" | "finished" | "dropped";

export type MediaCategory =
  | "movies"
  | "tvshows"
  | "anime"
  | "manga"
  | "lite_novel"
  | "games"
  | "manhua"
  | "manhwa"
  | "comics"
  | "webnovels"
  | "novels"
  | "webtoons"
  | "web_series"
  | "documentaries"
  | "audiobooks"
  | "podcasts"
  | "music_albums"
  | "visual_novels"
  | "tabletop_games"
  | "esports";

export interface MediaProgress {
  current: number;
  total: number | null;
}

export interface MediaItem {
  id: string;
  name: string;
  coverUrl: string;
  category: MediaCategory;
  status: MediaStatus;
  rating: number | null; // 1-10
  showRating: boolean;
  description: string;
  dateAdded: string;
  progress?: MediaProgress;
}

// Per-category progress unit. Categories not listed don't track progress.
export const PROGRESS_UNITS: Partial<Record<MediaCategory, { unit: string; unitShort: string }>> = {
  tvshows:        { unit: "episodes", unitShort: "ep" },
  anime:          { unit: "episodes", unitShort: "ep" },
  web_series:     { unit: "episodes", unitShort: "ep" },
  podcasts:       { unit: "episodes", unitShort: "ep" },
  manga:          { unit: "chapters", unitShort: "ch" },
  manhua:         { unit: "chapters", unitShort: "ch" },
  manhwa:         { unit: "chapters", unitShort: "ch" },
  comics:         { unit: "issues",   unitShort: "#"  },
  webtoons:       { unit: "chapters", unitShort: "ch" },
  webnovels:      { unit: "chapters", unitShort: "ch" },
  lite_novel:     { unit: "chapters", unitShort: "ch" },
  visual_novels:  { unit: "chapters", unitShort: "ch" },
  novels:         { unit: "pages",    unitShort: "pg" },
  games:          { unit: "hours",    unitShort: "h"  },
  tabletop_games: { unit: "sessions", unitShort: "s"  },
  audiobooks:     { unit: "hours",    unitShort: "h"  },
  music_albums:   { unit: "tracks",   unitShort: "tr" },
};

export function hasProgress(category: MediaCategory) {
  return Boolean(PROGRESS_UNITS[category]);
}

export const CATEGORY_LABELS: Record<MediaCategory, string> = {
  movies: "Movies",
  tvshows: "TV Shows",
  anime: "Anime",
  manga: "Manga",
  lite_novel: "Light Novels",
  games: "Games",
  manhua: "Manhua",
  manhwa: "Manhwa",
  comics: "Comics",
  webnovels: "Web Novels",
  novels: "Novels",
  webtoons: "Webtoons",
  web_series: "Web Series",
  documentaries: "Documentaries",
  audiobooks: "Audiobooks",
  podcasts: "Podcasts",
  music_albums: "Music / Albums",
  visual_novels: "Visual Novels",
  tabletop_games: "Tabletop Games",
  esports: "Esports",
};

export const STATUS_LABELS: Record<MediaStatus, string> = {
  watching: "Watching",
  plan_to_watch: "Plan to Watch",
  finished: "Finished",
  dropped: "Dropped",
};

// Category-specific status label overrides
const CATEGORY_STATUS_OVERRIDES: Partial<Record<MediaCategory, Partial<Record<MediaStatus, string>>>> = {
  games: { watching: "Playing", plan_to_watch: "Plan to Play", finished: "Completed" },
  tabletop_games: { watching: "Playing", plan_to_watch: "Plan to Play", finished: "Completed" },
  manga: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  lite_novel: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  manhua: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  manhwa: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  comics: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  webnovels: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  novels: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  webtoons: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  visual_novels: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed" },
  music_albums: { watching: "Listening", plan_to_watch: "Plan to Listen", finished: "Completed" },
  audiobooks: { watching: "Listening", plan_to_watch: "Plan to Listen", finished: "Completed" },
  podcasts: { watching: "Listening", plan_to_watch: "Plan to Listen", finished: "Completed" },
};

export function getStatusLabel(status: MediaStatus, category?: MediaCategory): string {
  if (category && CATEGORY_STATUS_OVERRIDES[category]?.[status]) {
    return CATEGORY_STATUS_OVERRIDES[category]![status]!;
  }
  return STATUS_LABELS[status];
}

// Generic status filter labels (not category-specific)
export const STATUS_FILTER_LABELS: Record<MediaStatus, string> = {
  watching: "Watching / Playing / Reading",
  plan_to_watch: "Plan to Watch / Read / Play",
  finished: "Finished / Completed",
  dropped: "Dropped / Deleted",
};

export const STATUS_COLORS: Record<MediaStatus, string> = {
  watching: "bg-status-watching",
  plan_to_watch: "bg-status-plan",
  finished: "bg-status-finished",
  dropped: "bg-status-dropped",
};

export const ALL_CATEGORIES: MediaCategory[] = [
  "movies", "tvshows", "anime", "manga", "lite_novel", "games",
  "manhua", "manhwa", "comics", "webnovels", "novels", "webtoons",
  "web_series", "documentaries", "audiobooks", "podcasts",
  "music_albums", "visual_novels", "tabletop_games", "esports",
];
