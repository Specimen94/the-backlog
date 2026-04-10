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
// HELPERS
// ─────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")          // strip HTML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#10;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
    const score = (r: SearchResult) => {
      let s = 0;
      const t = r.title.toLowerCase();
      if (t === q) s -= 3;
      else if (t.startsWith(q)) s -= 2;
      else if (t.includes(q)) s -= 1;
      if (r.description) s -= 0.5;
      if (r.coverUrl) s -= 0.3;
      return s;
    };
    return score(a) - score(b);
  });
}

// ─────────────────────────────────────────────
// INTERNET ARCHIVE  (fixed)
// ─────────────────────────────────────────────

/**
 * Builds a correct Internet Archive Solr advancedsearch URL.
 *
 * Bugs fixed vs old version:
 *  1. fl[] params must be REPEATED, not comma-joined in one value.
 *     Old: fl[]=identifier,title,description   ← Solr ignores this
 *     New: fl[]=identifier&fl[]=title&fl[]=description  ← correct
 *
 *  2. Mediatype filter must go INSIDE the q param using Solr syntax.
 *     Old: &mediatype=movies  ← not a valid param, silently ignored
 *     New: q=(query) AND mediatype:movies  ← correct Solr query
 *
 *  3. Added subject[] field so we can better classify texts (manga, comics, novels).
 *  4. Improved description cleanup: strips HTML + entities.
 *  5. Better category mapping using subject tags and mediatype together.
 */
async function searchInternetArchive(
  query: string,
  mediatype?: string
): Promise<SearchResult[]> {
  try {
    // Build query - mediatype filter goes INSIDE the q string (Solr syntax)
    const solrQ = mediatype
      ? `(${query}) AND mediatype:${mediatype}`
      : query;

    // Use URLSearchParams with repeated .append() calls for fl[] fields
    // This is the ONLY correct way - comma-joining them into one value doesn't work
    const params = new URLSearchParams();
    params.append("q", solrQ);
    params.append("fl[]", "identifier");
    params.append("fl[]", "title");
    params.append("fl[]", "description");
    params.append("fl[]", "year");
    params.append("fl[]", "mediatype");
    params.append("fl[]", "subject");
    params.append("fl[]", "creator");
    params.append("sort[]", "downloads desc");
    params.append("rows", "10");
    params.append("page", "1");
    params.append("output", "json");

    const res = await fetch(
      `https://archive.org/advancedsearch.php?${params.toString()}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    const docs = data?.response?.docs;
    if (!Array.isArray(docs) || docs.length === 0) return [];

    return docs
      .map((item: any): SearchResult | null => {
        const title = Array.isArray(item.title) ? item.title[0] : item.title;
        if (!title) return null;

        // Cover image — archive.org/services/img/{identifier} returns real thumbnails
        const coverUrl = item.identifier
          ? `https://archive.org/services/img/${item.identifier}`
          : "";

        // Description: can be string or array, may contain HTML
        const rawDesc = Array.isArray(item.description)
          ? item.description[0]
          : item.description || "";
        const description = cleanText(String(rawDesc)).slice(0, 400);

        // Creator fallback for description
        const finalDesc =
          description ||
          (item.creator
            ? `By ${Array.isArray(item.creator) ? item.creator[0] : item.creator}`
            : "");

        // ── Category mapping ──
        // Use BOTH mediatype AND subject tags to be accurate
        const mt = (item.mediatype || "").toLowerCase();
        const subjects: string[] = (
          Array.isArray(item.subject) ? item.subject : [item.subject || ""]
        ).map((s: string) => (s || "").toLowerCase());

        let category: MediaCategory = "movies"; // default

        const subjectHas = (terms: string[]) =>
          terms.some((t) => subjects.some((s) => s.includes(t)));

        if (mt === "texts") {
          // Classify text items by subject tags
          if (subjectHas(["manga", "graphic novel", "comic"])) category = "comics";
          else if (subjectHas(["manhwa"])) category = "manhwa";
          else if (subjectHas(["manhua"])) category = "manhua";
          else if (subjectHas(["light novel", "ln "])) category = "lite_novel";
          else if (subjectHas(["webtoon"])) category = "webtoons";
          else if (subjectHas(["audiobook"])) category = "audiobooks";
          else category = "novels";
        } else if (mt === "audio") {
          if (subjectHas(["podcast"])) category = "podcasts";
          else if (subjectHas(["audiobook", "spoken word"])) category = "audiobooks";
          else category = "music_albums";
        } else if (mt === "software") {
          category = "games";
        } else if (mt === "movies" || mt === "video") {
          if (subjectHas(["documentary", "nature", "history", "science"])) {
            category = "documentaries";
          } else if (subjectHas(["anime", "animation"])) {
            category = "anime";
          } else {
            category = "movies";
          }
        } else if (mt === "collection") {
          // Collections are usually skipped — they're not a single media item
          return null;
        }

        return {
          title: cleanText(String(title)),
          coverUrl,
          description: finalDesc,
          category,
          year: item.year ? String(item.year) : undefined,
          source: "Internet Archive",
        };
      })
      .filter((r): r is SearchResult => r !== null);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// ANIME
// ─────────────────────────────────────────────

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
        ? cleanText(item.synopsis.replace(/\[Written by MAL Rewrite\]/g, ""))
        : "",
      category: "anime" as MediaCategory,
      year: item.year
        ? String(item.year)
        : item.aired?.prop?.from?.year
        ? String(item.aired.prop.from.year)
        : undefined,
      source: "MyAnimeList",
    }));
  } catch {
    return [];
  }
}

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
        else if (country === "KR") category = "manhwa";
        else if (country === "CN") category = "manhua";
        else category = "manga";
      }
      return {
        title: item.title?.english || item.title?.romaji || "",
        coverUrl: item.coverImage?.extraLarge || item.coverImage?.large || "",
        description: item.description
          ? cleanText(item.description)
          : "",
        category,
        year: item.startDate?.year ? String(item.startDate.year) : undefined,
        source: "AniList",
      };
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// MANGA / READING
// ─────────────────────────────────────────────

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
          ? cleanText(item.synopsis.replace(/\[Written by MAL Rewrite\]/g, ""))
          : "",
        category,
        year: item.published?.prop?.from?.year
          ? String(item.published.prop.from.year)
          : undefined,
        source: "MyAnimeList",
      };
    });
  } catch {
    return [];
  }
}

async function searchMangaDex(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=8&order[relevance]=desc&includes[]=cover_art`
    );
    const data = await res.json();
    if (!data.data) return [];
    return data.data
      .map((item: any) => {
        const attrs = item.attributes;
        const titleObj = attrs.title || {};
        const title = titleObj.en || titleObj["ja-ro"] || Object.values(titleObj)[0] || "";
        const coverRel = item.relationships?.find((r: any) => r.type === "cover_art");
        const fileName = coverRel?.attributes?.fileName;
        const coverUrl = fileName
          ? `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`
          : "";
        const descObj = attrs.description || {};
        const description = cleanText(
          String(descObj.en || Object.values(descObj)[0] || "")
        ).slice(0, 400);
        const country = attrs.originalLanguage || "";
        let category: MediaCategory = "manga";
        if (country === "ko") category = "manhwa";
        else if (country === "zh" || country === "zh-hk") category = "manhua";
        return {
          title: cleanText(String(title)),
          coverUrl,
          description,
          category,
          year: attrs.year ? String(attrs.year) : undefined,
          source: "MangaDex",
        };
      })
      .filter((r: SearchResult) => r.title);
  } catch {
    return [];
  }
}

async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,subject,first_sentence`
    );
    const data = await res.json();
    if (!data.docs) return [];
    return data.docs.slice(0, 8).map((item: any) => {
      const authorStr = item.author_name
        ? `By ${item.author_name.slice(0, 2).join(" & ")}.`
        : "";
      const firstSentence = item.first_sentence
        ? (Array.isArray(item.first_sentence) ? item.first_sentence[0] : item.first_sentence)
        : "";
      const description = cleanText(firstSentence || authorStr);
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
  } catch {
    return [];
  }
}

async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books&langRestrict=en`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items
      .map((item: any) => {
        const v = item.volumeInfo;
        const cover =
          v.imageLinks?.extraLarge ||
          v.imageLinks?.large ||
          v.imageLinks?.medium ||
          v.imageLinks?.thumbnail || "";
        const coverUrl = cover.replace("http://", "https://");
        const cats: string[] = (v.categories || []).map((c: string) => c.toLowerCase());
        let category: MediaCategory = "novels";
        if (cats.some((c) => c.includes("comic") || c.includes("graphic"))) category = "comics";
        else if (cats.some((c) => c.includes("manga"))) category = "manga";
        return {
          title: v.title || "",
          coverUrl,
          description: v.description
            ? cleanText(v.description).slice(0, 400)
            : v.authors
            ? `By ${v.authors.join(", ")}.`
            : "",
          category,
          year: v.publishedDate ? v.publishedDate.slice(0, 4) : undefined,
          source: "Google Books",
        };
      })
      .filter((r: SearchResult) => r.title);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// MOVIES & TV
// ─────────────────────────────────────────────

async function searchTMDB(query: string, type: "movie" | "tv"): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${type}?api_key=4acf89d19d8e1b82e12a1adf8abd2e55&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results.slice(0, 8).map((item: any) => ({
      title: item.title || item.name || "",
      coverUrl: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "",
      description: item.overview || "",
      category: (type === "movie" ? "movies" : "tvshows") as MediaCategory,
      year: (item.release_date || item.first_air_date || "").slice(0, 4) || undefined,
      source: "TMDB",
    }));
  } catch {
    return [];
  }
}

async function searchOMDB(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=trilogy`
    );
    const data = await res.json();
    if (!data.Search) return [];
    const enriched = await Promise.allSettled(
      data.Search.slice(0, 6).map(async (item: any) => {
        let description = "";
        try {
          const detail = await fetch(
            `https://www.omdbapi.com/?i=${item.imdbID}&apikey=trilogy`
          );
          const d = await detail.json();
          if (d.Plot && d.Plot !== "N/A") description = d.Plot;
        } catch { /* optional */ }
        return {
          title: item.Title,
          coverUrl: item.Poster !== "N/A" ? item.Poster : "",
          description,
          category: (item.Type === "series" ? "tvshows" : "movies") as MediaCategory,
          year: item.Year,
          source: "OMDB",
        };
      })
    );
    return enriched
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<SearchResult>).value);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────────

async function searchRAWG(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=8&key=f9e3b7c1d4e5a6b2c3d4e5f6a7b8c9d0`
    );
    const data = await res.json();
    if (!data.results) return [];
    const detailed = await Promise.allSettled(
      data.results.slice(0, 6).map(async (item: any) => {
        let description = "";
        try {
          const detail = await fetch(
            `https://api.rawg.io/api/games/${item.id}?key=f9e3b7c1d4e5a6b2c3d4e5f6a7b8c9d0`
          );
          const d = await detail.json();
          description = d.description_raw
            ? d.description_raw.slice(0, 400).trim()
            : cleanText(d.description || "").slice(0, 400);
        } catch { /* optional */ }
        return {
          title: item.name,
          coverUrl: item.background_image || "",
          description,
          category: "games" as MediaCategory,
          year: item.released ? item.released.slice(0, 4) : undefined,
          source: "RAWG",
        };
      })
    );
    return detailed
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<SearchResult>).value);
  } catch {
    return [];
  }
}

async function searchSteam(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items) return [];
    const detailed = await Promise.allSettled(
      data.items.slice(0, 5).map(async (item: any) => {
        let description = "";
        let coverUrl = item.tiny_image || "";
        try {
          const detail = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${item.id}&cc=us&l=en`
          );
          const d = await detail.json();
          const appData = d[item.id]?.data;
          if (appData) {
            description = appData.short_description
              || cleanText(appData.detailed_description || "").slice(0, 400);
            coverUrl = appData.header_image || coverUrl;
          }
        } catch { /* optional */ }
        return {
          title: item.name || "",
          coverUrl,
          description,
          category: "games" as MediaCategory,
          year: undefined,
          source: "Steam",
        };
      })
    );
    return detailed
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<SearchResult>).value)
      .filter((r) => r.title);
  } catch {
    return [];
  }
}

// BoardGameGeek XML API — for tabletop games
async function searchBGG(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`
    );
    if (!res.ok) return [];
    const text = await res.text();
    const items: Array<{ id: string; title: string; year?: string }> = [];
    const itemRegex = /<item[^>]+id="(\d+)"[^>]*>[\s\S]*?<name[^>]+value="([^"]+)"[\s\S]*?(?:<yearpublished[^>]+value="(\d+)")?/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null && items.length < 8) {
      items.push({ id: match[1], title: match[2], year: match[3] });
    }
    if (items.length === 0) return [];
    try {
      const ids = items.map((i) => i.id).join(",");
      const detailRes = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${ids}&stats=1`);
      const detailText = await detailRes.text();
      return items.map((item) => {
        const thumbMatch = new RegExp(`<item[^>]+id="${item.id}"[\\s\\S]*?<thumbnail>([^<]+)<\\/thumbnail>`).exec(detailText);
        const descMatch = new RegExp(`<item[^>]+id="${item.id}"[\\s\\S]*?<description>([\\s\\S]*?)<\\/description>`).exec(detailText);
        return {
          title: item.title,
          coverUrl: thumbMatch?.[1]?.trim() || "",
          description: descMatch ? cleanText(descMatch[1]).slice(0, 400) : "",
          category: "tabletop_games" as MediaCategory,
          year: item.year,
          source: "BoardGameGeek",
        };
      });
    } catch {
      return items.map((item) => ({
        title: item.title,
        coverUrl: "",
        description: "",
        category: "tabletop_games" as MediaCategory,
        year: item.year,
        source: "BoardGameGeek",
      }));
    }
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// DOCUMENTARIES
// ─────────────────────────────────────────────

async function searchTMDBDocumentaries(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=4acf89d19d8e1b82e12a1adf8abd2e55&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results
      .filter((item: any) => item.genre_ids?.includes(99))
      .slice(0, 6)
      .map((item: any) => ({
        title: item.title || item.name || "",
        coverUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : "",
        description: item.overview || "",
        category: "documentaries" as MediaCategory,
        year: (item.release_date || "").slice(0, 4) || undefined,
        source: "TMDB",
      }));
  } catch {
    return [];
  }
}

async function searchYouTubeDocumentaries(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " documentary")}&type=video&maxResults=6&key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`
    );
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => ({
      title: item.snippet.title,
      coverUrl: item.snippet.thumbnails?.high?.url || "",
      description: item.snippet.description || "",
      category: "documentaries" as MediaCategory,
      year: item.snippet.publishedAt ? item.snippet.publishedAt.slice(0, 4) : undefined,
      source: "YouTube",
    }));
  } catch {
    return [];
  }
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
    return data.results
      .map((item: any) => {
        const category: MediaCategory = mediaType === "podcast" ? "podcasts" : "music_albums";
        const title = item.collectionName || item.trackName || "";
        const artist = item.artistName || "";
        const description = item.description
          ? cleanText(item.description).slice(0, 400)
          : artist
          ? `${mediaType === "podcast" ? "Hosted by" : "By"} ${artist}.${
              item.primaryGenreName ? ` Genre: ${item.primaryGenreName}.` : ""
            }`
          : "";
        return {
          title,
          coverUrl: (item.artworkUrl100 || "").replace("100x100", "600x600"),
          description,
          category,
          year: item.releaseDate ? item.releaseDate.slice(0, 4) : undefined,
          source: "iTunes",
        };
      })
      .filter((r: SearchResult) => r.title);
  } catch {
    return [];
  }
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
    promises.push(searchRAWG(query));
    promises.push(searchSteam(query));
    promises.push(searchGoogleBooks(query));
    // Internet Archive — broad search across all mediatypes
    promises.push(searchInternetArchive(query));
  } else {
    switch (categoryHint) {
      case "movies":
        promises.push(searchTMDB(query, "movie"));
        promises.push(searchOMDB(query));
        promises.push(searchInternetArchive(query, "movies"));
        break;

      case "tvshows":
      case "web_series":
        promises.push(searchTMDB(query, "tv"));
        promises.push(searchOMDB(query));
        promises.push(searchInternetArchive(query, "movies"));
        break;

      case "anime":
        promises.push(searchJikanAnime(query));
        promises.push(searchAniList(query, "ANIME"));
        promises.push(searchInternetArchive(query, "movies"));
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
        promises.push(searchInternetArchive(query, "texts"));
        break;

      case "novels":
      case "webnovels":
        promises.push(searchOpenLibrary(query));
        promises.push(searchGoogleBooks(query));
        promises.push(searchInternetArchive(query, "texts"));
        break;

      case "lite_novel":
        promises.push(searchJikanManga(query));
        promises.push(searchAniList(query, "MANGA"));
        promises.push(searchOpenLibrary(query));
        promises.push(searchInternetArchive(query, "texts"));
        break;

      case "audiobooks":
        promises.push(searchOpenLibrary(query));
        promises.push(searchGoogleBooks(query));
        promises.push(searchItunes(query, "audiobook"));
        promises.push(searchInternetArchive(query, "audio"));
        break;

      case "games":
        promises.push(searchRAWG(query));
        promises.push(searchSteam(query));
        promises.push(searchInternetArchive(query, "software"));
        break;

      case "visual_novels":
        promises.push(searchRAWG(query));
        promises.push(searchSteam(query));
        promises.push(searchJikanAnime(query));
        promises.push(searchInternetArchive(query, "software"));
        break;

      case "documentaries":
        promises.push(searchTMDBDocumentaries(query));
        promises.push(searchYouTubeDocumentaries(query));
        promises.push(searchInternetArchive(query, "movies"));
        break;

      case "podcasts":
        promises.push(searchItunes(query, "podcast"));
        promises.push(searchInternetArchive(query, "audio"));
        break;

      case "music_albums":
        promises.push(searchItunes(query, "music"));
        promises.push(searchInternetArchive(query, "audio"));
        break;

      case "tabletop_games":
        promises.push(searchBGG(query));
        promises.push(searchGoogleBooks(query));
        promises.push(searchInternetArchive(query, "texts"));
        break;

      case "esports":
        promises.push(searchRAWG(query));
        promises.push(searchTMDB(query, "tv"));
        break;

      default:
        promises.push(searchTMDB(query, "movie"));
        promises.push(searchTMDB(query, "tv"));
        promises.push(searchJikanAnime(query));
        promises.push(searchInternetArchive(query));
    }
  }

  const settled = await Promise.allSettled(promises);
  const combined: SearchResult[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") combined.push(...r.value);
  }

  return sortByRelevance(dedup(combined), query).slice(0, 12);
}
