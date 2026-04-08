import { useState, useEffect, useCallback } from "react";
import { MediaItem, MediaStatus } from "@/types/media";

const STORAGE_KEY = "backlog-media-items";

function loadMedia(): MediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMedia(items: MediaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useMediaStore() {
  const [items, setItems] = useState<MediaItem[]>(loadMedia);

  useEffect(() => {
    saveMedia(items);
  }, [items]);

  const addItem = useCallback((item: Omit<MediaItem, "id" | "dateAdded">) => {
    const newItem: MediaItem = {
      ...item,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<MediaItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: MediaStatus) => {
    updateItem(id, { status });
  }, [updateItem]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backlog-watchlist.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch {
        console.error("Invalid file format");
      }
    };
    reader.readAsText(file);
  }, []);

  return { items, addItem, updateItem, deleteItem, updateStatus, exportData, importData };
}
