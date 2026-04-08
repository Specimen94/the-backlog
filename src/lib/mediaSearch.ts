import { MediaCategory } from "@/types/media";

export interface SearchResult {
  title: string;
  coverUrl: string;
  description: string;
  category: MediaCategory;
  year?: string;
  source: string;
}

// --- OMDB (movies, TV, anime) ---
async function searchOMDB(query: string): Promise<SearchResult[]> {
  try {
    // OMDB free tier - no key needed for search suggestions, use public proxy approach
    const res = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=trilogy`
    );
    const data = await res.json();
    if (!data.Search) return [];
    return data.Search.slice(0, 5).map((item: any) => {
      let category: MediaCategory = "movies";
      if (item.Type === "series") category = "tvshows";
      return {
        title: item.Title,
        coverUrl: item.Poster !== "N/A" ? item.Poster : "",
        description: "",
        category,
        year: item.Year,
        source: "OMDB",
      };
    });
  } catch {
    return [];
  }
}

// --- Jikan (MyAnimeList) for anime/manga ---
async function searchJikan(query: string, type: "anime" | "manga"): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(query)}&limit=5&sfw=true`
    );
    const data = await res.json();
    if (!data.data) return [];
    return data.data.slice(0, 5).map((item: any) => {
      const category: MediaCategory =
        type === "anime" ? "anime" :
        item.type === "Manhwa" ? "manhwa" :
        item.type === "Manhua" ? "manhua" :
        item.type === "Webtoon" ? "webtoons" :
        item.type === "Novel" ? "novels" :
        "manga";
      return {
        title: item.title,
        coverUrl: item.images?.jpg?.image_url || "",
        description: item.synopsis || "",
        category,
        year: item.year ? String(item.year) : item.published?.prop?.from?.year ? String(item.published.prop.from.year) : undefined,
        source: "MyAnimeList",
      };
    });
  } catch {
    return [];
  }
}

// --- RAWG (games) ---
async function searchRAWG(query: string): Promise<SearchResult[]> {
  try {
    // RAWG free public API – key is optional for basic queries
    const res = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=5&key=`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results.slice(0, 5).map((item: any) => ({
      title: item.name,
      coverUrl: item.background_image || "",
      description: item.description_raw || "",
      category: "games" as MediaCategory,
      year: item.released ? item.released.slice(0, 4) : undefined,
      source: "RAWG",
    }));
  } catch {
    return [];
  }
}

// --- Open Library (books, novels) ---
async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,first_publish_year,cover_i,subject`
    );
    const data = await res.json();
    if (!data.docs) return [];
    return data.docs.slice(0, 5).map((item: any) => ({
      title: item.title,
      coverUrl: item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
        : "",
      description: item.author_name
        ? `By ${item.author_name.slice(0, 2).join(", ")}`
        : "",
      category: "novels" as MediaCategory,
      year: item.first_publish_year ? String(item.first_publish_year) : undefined,
      source: "Open Library",
    }));
  } catch {
    return [];
  }
}

// --- iTunes / Apple Podcasts (podcasts, music) ---
async function searchItunes(query: string, mediaType: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=${mediaType}&limit=5`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results.slice(0, 5).map((item: any) => {
      const category: MediaCategory = mediaType === "podcast" ? "podcasts" : "music_albums";
      return {
        title: item.collectionName || item.trackName,
        coverUrl: item.artworkUrl100?.replace("100x100", "600x600") || "",
        description: item.artistName ? `By ${item.artistName}` : "",
        category,
        year: item.releaseDate ? item.releaseDate.slice(0, 4) : undefined,
        source: "iTunes",
      };
    });
  } catch {
    return [];
  }
}

// Infer best APIs to query based on query & optional category hint
export async function searchMedia(
  query: string,
  categoryHint?: MediaCategory | "all" | null
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const promises: Promise<SearchResult[]>[] = [];

  if (!categoryHint || categoryHint === "all") {
    // Search everything in parallel
    promises.push(searchOMDB(query));
    promises.push(searchJikan(query, "anime"));
    promises.push(searchJikan(query, "manga"));
    promises.push(searchRAWG(query));
    promises.push(searchOpenLibrary(query));
  } else {
    switch (categoryHint) {
      case "movies":
        promises.push(searchOMDB(query));
        break;
      case "tvshows":
      case "web_series":
      case "documentaries":
        promises.push(searchOMDB(query));
        break;
      case "anime":
        promises.push(searchJikan(query, "anime"));
        promises.push(searchOMDB(query));
        break;
      case "manga":
      case "manhwa":
      case "manhua":
      case "webtoons":
      case "comics":
        promises.push(searchJikan(query, "manga"));
        break;
      case "games":
        promises.push(searchRAWG(query));
        break;
      case "novels":
      case "lite_novel":
      case "webnovels":
      case "audiobooks":
        promises.push(searchOpenLibrary(query));
        promises.push(searchJikan(query, "manga")); // light novels often on MAL
        break;
      case "podcasts":
        promises.push(searchItunes(query, "podcast"));
        break;
      case "music_albums":
        promises.push(searchItunes(query, "music"));
        break;
      case "visual_novels":
        promises.push(searchJikan(query, "anime")); // many VNs have anime adaptations
        promises.push(searchRAWG(query));
        break;
      default:
        promises.push(searchOMDB(query));
        promises.push(searchJikan(query, "anime"));
    }
  }

  const results = await Promise.allSettled(promises);
  const combined: SearchResult[] = [];
  const seen = new Set<string>();

  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const item of r.value) {
        const key = item.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }
    }
  }

  // Sort: items whose title starts with query come first
  combined.sort((a, b) => {
    const aStarts = a.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
    const bStarts = b.title.toLowerCase().startsWith(query.toLowerCase()) ? 0 : 1;
    return aStarts - bStarts;
  });

  return combined.slice(0, 10);
}

// Get full detail for a single item - enrich description if empty
export async function enrichFromOMDB(title: string, year?: string): Promise<Partial<SearchResult>> {
  try {
    const yearParam = year ? `&y=${year}` : "";
    const res = await fetch(
      `https://www.omdbapi.com/?t=${encodeURIComponent(title)}${yearParam}&apikey=trilogy`
    );
    const data = await res.json();
    if (data.Response === "False") return {};
    return {
      description: data.Plot !== "N/A" ? data.Plot : "",
      coverUrl: data.Poster !== "N/A" ? data.Poster : "",
    };
  } catch {
    return {};
  }
}
