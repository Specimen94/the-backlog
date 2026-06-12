import { useEffect, useRef, useState } from "react";
import { UpcomingItem, getOnAirTV, getUpcomingMovies, tmdbEnabled, upcomingToMediaItem } from "@/lib/tmdb";
import { Plus, Check, Loader2 } from "lucide-react";
import { MediaItem } from "@/types/media";

function useIdleAutoScroll() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dir = 1;
    let raf = 0;
    let paused = false;
    let idleTimer: number | undefined;
    const SPEED = 0.3; // px per frame (~18px/s)

    const pause = () => {
      paused = true;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => { paused = false; }, 2000);
    };

    const tick = () => {
      if (!paused && el.scrollWidth > el.clientWidth + 1) {
        el.scrollLeft += SPEED * dir;
        const max = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= max - 0.5) dir = -1;
        else if (el.scrollLeft <= 0.5) dir = 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const events = ["mouseenter", "wheel", "touchstart", "pointerdown"];
    events.forEach((e) => el.addEventListener(e, pause, { passive: true }));
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      events.forEach((e) => el.removeEventListener(e, pause));
    };
  }, []);
  return ref;
}

interface Props {
  existingItems: MediaItem[];
  onAdd: (data: Omit<MediaItem, "id" | "dateAdded">) => void;
}

export function UpcomingRows({ existingItems, onAdd }: Props) {
  const [movies, setMovies] = useState<UpcomingItem[]>([]);
  const [tv, setTv] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tmdbEnabled()) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [m, t] = await Promise.all([getUpcomingMovies(), getOnAirTV()]);
        if (cancelled) return;
        setMovies(m);
        setTv(t);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load TMDb");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!tmdbEnabled()) return null;

  const isAdded = (title: string) =>
    existingItems.some((i) => i.name.toLowerCase() === title.toLowerCase());

  const renderRow = (label: string, items: UpcomingItem[]) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">{label}</h2>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-thin">
        {items.map((u) => {
          const added = isAdded(u.title);
          return (
            <div key={u.tmdbId} className="flex-shrink-0 w-36 group">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-md">
                {u.coverUrl ? (
                  <img src={u.coverUrl} alt={u.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
                <button
                  onClick={() => !added && onAdd(upcomingToMediaItem(u))}
                  disabled={added}
                  className="absolute bottom-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 disabled:bg-status-finished disabled:cursor-default transition-colors"
                  title={added ? "Already in your back-log" : "Add to back-log"}
                >
                  {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-foreground mt-1.5 line-clamp-2 leading-tight">{u.title}</p>
              {u.releaseDate && <p className="text-[10px] text-muted-foreground">{u.releaseDate}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading upcoming releases...
      </div>
    );
  }

  if (error) {
    return <div className="mb-8 text-sm text-muted-foreground">Couldn't load upcoming media ({error}).</div>;
  }

  return (
    <>
      {movies.length > 0 && renderRow("Upcoming Movies", movies)}
      {tv.length > 0 && renderRow("On The Air — TV Shows", tv)}
    </>
  );
}
