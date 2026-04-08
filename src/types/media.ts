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
