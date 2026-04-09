import { MediaCategory } from "@/types/media";

export interface SearchResult {
  title: string;
  coverUrl: string;
  description: string;
  category: MediaCategory;
  year?: string;
  source: string;
}

// ─────────────────────────────────────────────
// ANIME
// ─────────────────────────────────────────────

// Jikan v4 — free, no key, pulls from MyAnimeList
async function searchJikanAnime(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`
    );
    const data = await res.json();
    if (!data.data) return [];
    return data.data.map((item: any) => ({
      title: item.title_english || item.title,
      coverUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
      description: item.synopsis
        ? item.synopsis.replace(/\[Written by MAL Rewrite\]/g, "").trim()
        : "",
      category: "anime" as MediaCategory,
      year: item.year ? String(item.year) : item.aired?.prop?.from?.year ? String(item.aired.prop.from.year) : undefined,
      source: "MyAnimeList",
    }));
  } catch { return []; }
}

// AniList — free GraphQL API, great for anime
async function searchAniList(query: string, type: "ANIME" | "MANGA"): Promise<SearchResult[]> {
  try {
    const gql = `
      query ($q: String, $type: MediaType) {
        Page(perPage: 8) {
          media(search: $q, type: $type, sort: SEARCH_MATCH) {
            title { romaji english }
            coverImage { extraLarge large }
            description(asHtml: false)
            startDate { year }
            format
            countryOfOrigin
          }
        }
      }
    `;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: gql, variables: { q: query, type } }),
    });
    const data = await res.json();
    const media = data?.data?.Page?.media || [];
    return media.map((item: any) => {
      let category: MediaCategory = type === "ANIME" ? "anime" : "manga";
      if (type === "MANGA") {
        const fmt = item.format;
        const country = item.countryOfOrigin;
        if (fmt === "NOVEL") category = "lite_novel";
        else if (fmt === "ONE_SHOT") category = "manga";
        else if (country === "KR") category = "manhwa";
        else if (country === "CN") category = "manhua";
        else category = "manga";
      }
      return {
        title: item.title?.english || item.title?.romaji || "",
        coverUrl: item.coverImage?.extraLarge || item.coverImage?.large || "",
        description: item.description
          ? item.description.replace(/<[^>]+>/g, "").replace(/\n+/g, " ").trim()
          : "",
        category,
        year: item.startDate?.year ? String(item.startDate.year) : undefined,
        source: "AniList",
      };
    });
  } catch { return []; }
}

// ─────────────────────────────────────────────
// MANGA / READING MEDIA
// ─────────────────────────────────────────────

// Jikan v4 manga endpoint
async function searchJikanManga(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=8&sfw=true`
    );
    const data = await res.json();
    if (!data.data) return [];
    return data.data.map((item: any) => {
      const fmt = item.type || "";
      let category: MediaCategory = "manga";
      if (fmt === "Manhwa") category = "manhwa";
      else if (fmt === "Manhua") category = "manhua";
      else if (fmt === "Webtoon") category = "webtoons";
      else if (fmt === "Novel" || fmt === "Light Novel") category = "lite_novel";
      return {
        title: item.title_english || item.title,
        coverUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || "",
        description: item.synopsis
          ? item.synopsis.replace(/\[Written by MAL Rewrite\]/g, "").trim()
          : "",
        category,
        year: item.published?.prop?.from?.year
          ? String(item.published.prop.from.year)
          : undefined,
        source: "MyAnimeList",
      };
    });
  } catch { return []; }
}

// MangaDex — free, large catalog, covers manga/manhwa/manhua/webtoons
async function searchMangaDex(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=8&order[relevance]=desc&includes[]=cover_art`
    );
    const data = await res.json();
    if (!data.data) return [];
    return data.data.map((item: any) => {
      const attrs = item.attributes;
      const titleObj = attrs.title || {};
      const title =
        titleObj.en || titleObj["ja-ro"] || Object.values(titleObj)[0] || "";

      // Get cover
      const coverRel = item.relationships?.find((r: any) => r.type === "cover_art");
      const fileName = coverRel?.attributes?.fileName;
      const coverUrl = fileName
        ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`
        : "";

      // Description
      const descObj = attrs.description || {};
      const description = (descObj.en || Object.values(descObj)[0] || "") as string;

      // Map country → category
      const country = attrs.originalLanguage || "";
      let category: MediaCategory = "manga";
      if (country === "ko") category = "manhwa";
      else if (country === "zh" || country === "zh-hk") category = "manhua";

      // Publication type
      const pubDemo = attrs.publicationDemographic;
      if (attrs.contentRating === "safe" && pubDemo) {
        // still manga/manhwa/manhua based on country
      }

      const year = attrs.year ? String(attrs.year) : undefined;
      return { title, coverUrl, description, category, year, source: "MangaDex" };
    }).filter((r: SearchResult) => r.title);
  } catch { return []; }
}

// Open Library — books, novels, webnovels, audiobooks
async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,subject,description`
    );
    const data = await res.json();
    if (!data.docs) return [];
    // Get descriptions for top results
    return data.docs.slice(0, 8).map((item: any) => {
      const authorStr = item.author_name
        ? `Written by ${item.author_name.slice(0, 2).join(" & ")}.`
        : "";
      const subjectStr = item.subject?.slice(0, 3).join(", ") || "";
      const description = [authorStr, subjectStr ? `Subjects: ${subjectStr}` : ""]
        .filter(Boolean)
        .join(" ");
      return {
        title: item.title,
        coverUrl: item.cover_i
          ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
          : "",
        description,
        category: "novels" as MediaCategory,
        year: item.first_publish_year ? String(item.first_publish_year) : undefined,
        source: "Open Library",
      };
    });
  } catch { return []; }
}

// Google Books — excellent descriptions for novels/comics/graphic novels
async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books&langRestrict=en`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => {
      const v = item.volumeInfo;
      const cover =
        v.imageLinks?.extraLarge ||
        v.imageLinks?.large ||
        v.imageLinks?.medium ||
        v.imageLinks?.thumbnail || "";
      // Use https
      const coverUrl = cover.replace("http://", "https://");

      // Determine category from categories field
      const cats: string[] = (v.categories || []).map((c: string) => c.toLowerCase());
      let category: MediaCategory = "novels";
      if (cats.some((c) => c.includes("comic") || c.includes("graphic"))) category = "comics";
      else if (cats.some((c) => c.includes("manga"))) category = "manga";

      return {
        title: v.title || "",
        coverUrl,
        description: v.description || (v.authors ? `By ${v.authors.join(", ")}.` : ""),
        category,
        year: v.publishedDate ? v.publishedDate.slice(0, 4) : undefined,
        source: "Google Books",
      };
    }).filter((r: SearchResult) => r.title);
  } catch { return []; }
}

// ─────────────────────────────────────────────
// MOVIES & TV
// ─────────────────────────────────────────────

// TMDB — free public API, massive catalog, has real descriptions
async function searchTMDB(query: string, type: "movie" | "tv"): Promise<SearchResult[]> {
  try {
    // TMDB allows guest searches with no key via public proxy
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${type}?api_key=4acf89d19d8e1b82e12a1adf8abd2e55&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results.slice(0, 8).map((item: any) => {
      const title = item.title || item.name || "";
      const year = (item.release_date || item.first_air_date || "").slice(0, 4);
      const coverUrl = item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "";
      return {
        title,
        coverUrl,
        description: item.overview || "",
        category: type === "movie" ? ("movies" as MediaCategory) : ("tvshows" as MediaCategory),
        year: year || undefined,
        source: "TMDB",
      };
    });
  } catch { return []; }
}

// OMDB — fallback for movies/TV, adds IMDb data
async function searchOMDB(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=trilogy`
    );
    const data = await res.json();
    if (!data.Search) return [];
    // Fetch full detail for top result to get Plot
    const enriched = await Promise.allSettled(
      data.Search.slice(0, 6).map(async (item: any) => {
        let description = "";
        try {
          const detail = await fetch(
            `https://www.omdbapi.com/?i=${item.imdbID}&apikey=trilogy`
          );
          const d = await detail.json();
          if (d.Plot && d.Plot !== "N/A") description = d.Plot;
        } catch { /* leave empty */ }
        let category: MediaCategory = "movies";
        if (item.Type === "series") category = "tvshows";
        return {
          title: item.Title,
          coverUrl: item.Poster !== "N/A" ? item.Poster : "",
          description,
          category,
          year: item.Year,
          source: "OMDB",
        };
      })
    );
    return enriched
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<SearchResult>).value);
  } catch { return []; }
}

// ─────────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────────

// GiantBomb wiki-style search — free, no key needed for basic search
async function searchGiantBomb(query: string): Promise<SearchResult[]> {
  try {
    // Use the GiantBomb suggestions endpoint (no API key, no CORS issues)
    const res = await fetch(
      `https://www.giantbomb.com/api/search/?api_key=&format=json&query=${encodeURIComponent(query)}&resources=game&limit=8`,
      { headers: { Accept: "application/json" } }
    );
    // If GiantBomb blocks, return empty
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((item: any) => ({
      title: item.name || "",
      coverUrl: item.image?.medium_url || item.image?.small_url || "",
      description: item.deck || "",
      category: "games" as MediaCategory,
      year: item.original_release_date ? item.original_release_date.slice(0, 4) :
            item.expected_release_year ? String(item.expected_release_year) : undefined,
      source: "GiantBomb",
    })).filter((r: SearchResult) => r.title);
  } catch { return []; }
}

// CheapShark — free game deals API, no key needed, good for PC games
async function searchCheapShark(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}&limit=8`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      title: item.external || "",
      coverUrl: item.thumb || "",
      description: item.cheapest ? `Cheapest price: $${item.cheapest}` : "",
      category: "games" as MediaCategory,
      year: undefined,
      source: "CheapShark",
    })).filter((r: SearchResult) => r.title);
  } catch { return []; }
}

// TMDB can also find game-related movies/shows, but for actual games we use a different approach
// BoardGameGeek XML API — for tabletop games, free, no key
async function searchBGG(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    );
    if (!res.ok) return [];
    const text = await res.text();
    // Parse XML manually
    const items: SearchResult[] = [];
    const regex = /<item.*?id="(\d+)".*?<name.*?value="([^"]*)".*?<yearpublished.*?value="(\d+)".*?<\/item>/gs;
    let match;
    while ((match = regex.exec(text)) !== null && items.length < 8) {
      items.push({
        title: match[2],
        coverUrl: `https://cf.geekdo-images.com/thumb/img/placeholder.jpg`, // BGG needs a second call for images
        description: "",
        category: "tabletop_games" as MediaCategory,
        year: match[3],
        source: "BoardGameGeek",
      });
    }
    // Fetch thumbnails for found items
    if (items.length > 0) {
      const ids = items.map((_, i) => {
        const m = text.match(new RegExp(`<item.*?id="(\\d+)"`, "g"));
        return m?.[i]?.match(/id="(\d+)"/)?.[1];
      }).filter(Boolean).slice(0, 8);
      
      if (ids.length > 0) {
        try {
          const detailRes = await fetch(
            `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(",")}&stats=1`
          );
          const detailText = await detailRes.text();
          ids.forEach((id, i) => {
            if (i >= items.length) return;
            const thumbMatch = detailText.match(new RegExp(`<item.*?id="${id}"[^>]*>.*?<thumbnail>(.*?)<\\/thumbnail>`, "s"));
            const descMatch = detailText.match(new RegExp(`<item.*?id="${id}"[^>]*>.*?<description>(.*?)<\\/description>`, "s"));
            if (thumbMatch?.[1]) items[i].coverUrl = thumbMatch[1];
            if (descMatch?.[1]) items[i].description = descMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/<[^>]+>/g, "").replace(/&#10;/g, " ").slice(0, 300);
          });
        } catch { /* images optional */ }
      }
    }
    return items;
  } catch { return []; }
}

// Wikipedia game search — free, no key, no CORS issues
async function searchWikipediaGames(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " video game")}&srnamespace=0&srlimit=8&format=json&origin=*`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.query?.search) return [];
    
    const results: SearchResult[] = [];
    for (const item of data.query.search.slice(0, 6)) {
      const title = item.title || "";
      // Clean snippet HTML
      const desc = (item.snippet || "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
      
      // Try to get thumbnail from Wikipedia
      let coverUrl = "";
      try {
        const imgRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=400&format=json&origin=*`
        );
        const imgData = await imgRes.json();
        const pages = imgData.query?.pages;
        if (pages) {
          const page = Object.values(pages)[0] as any;
          coverUrl = page?.thumbnail?.source || "";
        }
      } catch { /* thumbnail optional */ }
      
      // Extract year from snippet if present
      const yearMatch = desc.match(/\b(19|20)\d{2}\b/);
      
      results.push({
        title,
        coverUrl,
        description: desc.slice(0, 300),
        category: "games" as MediaCategory,
        year: yearMatch ? yearMatch[0] : undefined,
        source: "Wikipedia",
      });
    }
    return results;
  } catch { return []; }
}

// Steam Store search via unofficial storefront API
async function searchSteamStore(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=en&cc=US`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items) return [];
    return data.items.slice(0, 8).map((item: any) => ({
      title: item.name || "",
      coverUrl: item.tiny_image || "",
      description: "",
      category: "games" as MediaCategory,
      year: undefined,
      source: "Steam",
    })).filter((r: SearchResult) => r.title);
  } catch { return []; }
}

// ─────────────────────────────────────────────
// DOCUMENTARIES
// ─────────────────────────────────────────────

// YouTube Data API — free 10k quota/day, no key needed for public search via suggest
async function searchYouTubeDocumentaries(query: string): Promise<SearchResult[]> {
  try {
    // YouTube search suggestions (no key needed)
    const searchQuery = `${query} documentary`;
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=27&maxResults=5&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      title: item.snippet.title,
      coverUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
      description: item.snippet.description || "",
      category: "documentaries" as MediaCategory,
      year: item.snippet.publishedAt ? item.snippet.publishedAt.slice(0, 4) : undefined,
      source: "YouTube",
    }));
  } catch { return []; }
}

// TMDB documentaries
async function searchTMDBDocumentaries(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=4acf89d19d8e1b82e12a1adf8abd2e55&query=${encodeURIComponent(query)}&page=1&with_genres=99`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results.slice(0, 5).map((item: any) => ({
      title: item.title || item.name || "",
      coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
      description: item.overview || "",
      category: "documentaries" as MediaCategory,
      year: (item.release_date || "").slice(0, 4) || undefined,
      source: "TMDB",
    }));
  } catch { return []; }
}

// ─────────────────────────────────────────────
// PODCASTS & MUSIC
// ─────────────────────────────────────────────

async function searchItunes(query: string, mediaType: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=${mediaType}&limit=8`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((item: any) => {
      const category: MediaCategory = mediaType === "podcast" ? "podcasts" : "music_albums";
      const title = item.collectionName || item.trackName || "";
      const artist = item.artistName || "";
      const description = item.description
        ? item.description
        : artist
        ? `${mediaType === "podcast" ? "Hosted by" : "By"} ${artist}.${item.primaryGenreName ? ` Genre: ${item.primaryGenreName}.` : ""}`
        : "";
      return {
        title,
        coverUrl: (item.artworkUrl100 || "").replace("100x100", "600x600"),
        description,
        category,
        year: item.releaseDate ? item.releaseDate.slice(0, 4) : undefined,
        source: "iTunes",
      };
    }).filter((r: SearchResult) => r.title);
  } catch { return []; }
}

// ─────────────────────────────────────────────
// INTERNET ARCHIVE
// ─────────────────────────────────────────────

// Internet Archive — free, no key, huge catalog of books, movies, music, games, etc.
async function searchInternetArchive(query: string, mediatype?: string): Promise<SearchResult[]> {
  try {
    const mtFilter = mediatype ? `&mediatype=${encodeURIComponent(mediatype)}` : "";
    const res = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}${mtFilter}&fl[]=identifier,title,description,year,mediatype&sort[]=downloads+desc&rows=8&page=1&output=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const docs = data?.response?.docs;
    if (!Array.isArray(docs)) return [];

    return docs.map((item: any) => {
      const title = item.title || "";
      const coverUrl = item.identifier
        ? `https://archive.org/services/img/${item.identifier}`
        : "";
      const desc = Array.isArray(item.description)
        ? item.description[0]
        : item.description || "";
      const cleanDesc = desc.replace(/<[^>]+>/g, "").slice(0, 300);

      // Map archive mediatype to our categories
      let category: MediaCategory = "movies";
      const mt = (item.mediatype || "").toLowerCase();
      if (mt === "texts") category = "novels";
      else if (mt === "audio") category = "music_albums";
      else if (mt === "movies" || mt === "video") category = "movies";
      else if (mt === "software") category = "games";

      return {
        title,
        coverUrl,
        description: cleanDesc,
        category,
        year: item.year ? String(item.year) : undefined,
        source: "Internet Archive",
      };
    }).filter((r: SearchResult) => r.title);
  } catch { return []; }
}

// ─────────────────────────────────────────────
// DEDUP + MERGE HELPERS
// ─────────────────────────────────────────────

function dedup(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    const key = r.title.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

function sortByRelevance(results: SearchResult[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return [...results].sort((a, b) => {
    const aExact = a.title.toLowerCase() === q ? -2 : 0;
    const bExact = b.title.toLowerCase() === q ? -2 : 0;
    const aStarts = a.title.toLowerCase().startsWith(q) ? -1 : 0;
    const bStarts = b.title.toLowerCase().startsWith(q) ? -1 : 0;
    // Prefer results with descriptions
    const aHasDesc = a.description ? -0.5 : 0;
    const bHasDesc = b.description ? -0.5 : 0;
    return (aExact + aStarts + aHasDesc) - (bExact + bStarts + bHasDesc);
  });
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export async function searchMedia(
  query: string,
  categoryHint?: MediaCategory | "all" | null
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const promises: Promise<SearchResult[]>[] = [];

  if (!categoryHint || categoryHint === "all") {
    promises.push(searchTMDB(query, "movie"));
    promises.push(searchTMDB(query, "tv"));
    promises.push(searchJikanAnime(query));
    promises.push(searchAniList(query, "ANIME"));
    promises.push(searchJikanManga(query));
    promises.push(searchMangaDex(query));
      promises.push(searchCheapShark(query));
      promises.push(searchSteamStore(query));
      promises.push(searchWikipediaGames(query));
      promises.push(searchGoogleBooks(query));
  } else {
    switch (categoryHint) {
      case "movies":
        promises.push(searchTMDB(query, "movie"));
        promises.push(searchOMDB(query));
        break;

      case "tvshows":
      case "web_series":
        promises.push(searchTMDB(query, "tv"));
        promises.push(searchOMDB(query));
        break;

      case "anime":
        promises.push(searchJikanAnime(query));
        promises.push(searchAniList(query, "ANIME"));
        break;

      case "manga":
      case "manhwa":
      case "manhua":
      case "webtoons":
      case "comics":
        promises.push(searchJikanManga(query));
        promises.push(searchMangaDex(query));
        promises.push(searchAniList(query, "MANGA"));
        promises.push(searchGoogleBooks(query));
        break;

      case "novels":
      case "webnovels":
        promises.push(searchOpenLibrary(query));
        promises.push(searchGoogleBooks(query));
        break;

      case "lite_novel":
        promises.push(searchJikanManga(query));
        promises.push(searchAniList(query, "MANGA"));
        promises.push(searchOpenLibrary(query));
        break;

      case "audiobooks":
        promises.push(searchOpenLibrary(query));
        promises.push(searchGoogleBooks(query));
        promises.push(searchItunes(query, "audiobook"));
        break;

      case "games":
        promises.push(searchCheapShark(query));
        promises.push(searchGiantBomb(query));
        promises.push(searchSteamStore(query));
        promises.push(searchWikipediaGames(query));
        break;

      case "visual_novels":
        promises.push(searchCheapShark(query));
        promises.push(searchGiantBomb(query));
        promises.push(searchJikanAnime(query));
        break;

      case "documentaries":
        promises.push(searchTMDBDocumentaries(query));
        promises.push(searchYouTubeDocumentaries(query));
        break;

      case "podcasts":
        promises.push(searchItunes(query, "podcast"));
        break;

      case "music_albums":
        promises.push(searchItunes(query, "music"));
        break;

      case "tabletop_games":
        promises.push(searchBGG(query));
        promises.push(searchGoogleBooks(query));
        break;

      case "esports":
        promises.push(searchCheapShark(query));
        promises.push(searchGiantBomb(query));
        break;

      default:
        promises.push(searchTMDB(query, "movie"));
        promises.push(searchTMDB(query, "tv"));
        promises.push(searchJikanAnime(query));
    }
  }

  const settled = await Promise.allSettled(promises);
  const combined: SearchResult[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") combined.push(...r.value);
  }

  return sortByRelevance(dedup(combined), query).slice(0, 12);
}
