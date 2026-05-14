import { MediaCategory, MediaItem } from "@/types/media";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";

export interface UpcomingItem {
  tmdbId: number;
  title: string;
  coverUrl: string;
  description: string;
  releaseDate: string;
  category: MediaCategory;
}

export function tmdbEnabled() {
  return !!API_KEY;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb ${res.status}`);
  return res.json();
}

export async function getUpcomingMovies(): Promise<UpcomingItem[]> {
  if (!API_KEY) return [];
  const data = await fetchJson(`${BASE}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`);
  return (data.results || []).map((r: any) => ({
    tmdbId: r.id,
    title: r.title,
    coverUrl: r.poster_path ? `${IMG}${r.poster_path}` : "",
    description: r.overview || "",
    releaseDate: r.release_date || "",
    category: "movie" as MediaCategory,
  }));
}

export async function getOnAirTV(): Promise<UpcomingItem[]> {
  if (!API_KEY) return [];
  const data = await fetchJson(`${BASE}/tv/on_the_air?api_key=${API_KEY}&language=en-US&page=1`);
  return (data.results || []).map((r: any) => ({
    tmdbId: r.id,
    title: r.name,
    coverUrl: r.poster_path ? `${IMG}${r.poster_path}` : "",
    description: r.overview || "",
    releaseDate: r.first_air_date || "",
    category: "tv_show" as MediaCategory,
  }));
}

export function upcomingToMediaItem(u: UpcomingItem): Omit<MediaItem, "id" | "dateAdded"> {
  return {
    name: u.title,
    coverUrl: u.coverUrl,
    category: u.category,
    status: "plan_to_watch",
    rating: null,
    showRating: false,
    description: u.description,
  };
}
