import { useState, useEffect, useCallback } from "react";
import { MediaItem } from "@/types/media";

const STORAGE_KEY = "backlog-layouts";

export interface Layout {
  id: string;
  name: string;
  dateSaved: string;
  items: MediaItem[];
}

function load(): Layout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(layouts: Layout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
}

export function useLayouts() {
  const [layouts, setLayouts] = useState<Layout[]>(load);

  useEffect(() => {
    save(layouts);
  }, [layouts]);

  const saveLayout = useCallback((name: string, items: MediaItem[]) => {
    const layout: Layout = {
      id: crypto.randomUUID(),
      name: name.trim() || "Untitled",
      dateSaved: new Date().toISOString(),
      items,
    };
    setLayouts((prev) => [layout, ...prev]);
    return layout;
  }, []);

  const overwriteLayout = useCallback((id: string, items: MediaItem[]) => {
    setLayouts((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, items, dateSaved: new Date().toISOString() } : l
      )
    );
  }, []);

  const renameLayout = useCallback((id: string, name: string) => {
    setLayouts((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  }, []);

  const deleteLayout = useCallback((id: string) => {
    setLayouts((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { layouts, saveLayout, overwriteLayout, renameLayout, deleteLayout };
}
