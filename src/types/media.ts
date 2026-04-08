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
  games: { watching: "Playing", plan_to_watch: "Plan to Play", finished: "Completed", dropped: "Delete" },
  tabletop_games: { watching: "Playing", plan_to_watch: "Plan to Play", finished: "Completed", dropped: "Delete" },
  manga: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  lite_novel: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  manhua: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  manhwa: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  comics: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  webnovels: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  novels: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  webtoons: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  visual_novels: { watching: "Reading", plan_to_watch: "Plan to Read", finished: "Completed", dropped: "Delete" },
  music_albums: { watching: "Listening", plan_to_watch: "Plan to Listen", finished: "Completed", dropped: "Delete" },
  audiobooks: { watching: "Listening", plan_to_watch: "Plan to Listen", finished: "Completed", dropped: "Delete" },
  podcasts: { watching: "Listening", plan_to_watch: "Plan to Listen", finished: "Completed", dropped: "Delete" },
  esports: { watching: "Watching", plan_to_watch: "Plan to Watch", finished: "Completed", dropped: "Delete" },
  movies: { dropped: "Delete" },
  tvshows: { dropped: "Delete" },
  anime: { dropped: "Delete" },
  web_series: { dropped: "Delete" },
  documentaries: { dropped: "Delete" },
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
