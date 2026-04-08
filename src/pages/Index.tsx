import { useState, useMemo } from "react";
import { useMediaStore } from "@/hooks/useMediaStore";
import { MediaItem, MediaCategory, MediaStatus, ALL_CATEGORIES, CATEGORY_LABELS } from "@/types/media";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CategoryRow } from "@/components/CategoryRow";
import { MediaCard } from "@/components/MediaCard";
import { AddMediaModal } from "@/components/AddMediaModal";
import { MediaDetailModal } from "@/components/MediaDetailModal";
import { BookOpen } from "lucide-react";

const Index = () => {
  const { items, addItem, updateItem, deleteItem, updateStatus, exportData, importData } = useMediaStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<MediaCategory | "all">("all");
  const [sortByRating, setSortByRating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MediaStatus | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (statusFilter) {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (sortByRating) {
      result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return result;
  }, [items, searchQuery, sortByRating, statusFilter]);

  // Categories that have items
  const populatedCategories = useMemo(() => {
    const cats = new Set(filteredItems.map((i) => i.category));
    return ALL_CATEGORIES.filter((c) => cats.has(c));
  }, [filteredItems]);

  // Items grouped by category
  const groupedItems = useMemo(() => {
    const groups: Partial<Record<MediaCategory, MediaItem[]>> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    }
    return groups;
  }, [filteredItems]);

  const handleStatusChange = (id: string, status: MediaStatus) => {
    updateStatus(id, status);
  };

  const handleItemClick = (item: MediaItem) => {
    setDetailItem(item);
  };

  const handleEdit = (item: MediaItem) => {
    setDetailItem(null);
    setEditItem(item);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    setDetailItem(null);
  };

  const handleAdd = (data: Omit<MediaItem, "id" | "dateAdded">) => {
    if (editItem) {
      updateItem(editItem.id, data);
      setEditItem(null);
    } else {
      addItem(data);
    }
  };

  const displayItems = activeCategory === "all"
    ? filteredItems
    : filteredItems.filter((i) => i.category === activeCategory);

  return (
    <div className="min-h-screen">
      <Header
        onAddClick={() => { setEditItem(null); setShowAddModal(true); }}
        onExport={exportData}
        onImport={importData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="container mx-auto px-4 py-6">
        {/* Category tabs */}
        <div className="mb-6">
          <CategoryTabs
            categories={populatedCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            sortByRating={sortByRating}
            onToggleSortByRating={() => setSortByRating(!sortByRating)}
          />
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your Back-Log is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start adding the shows, manga, games, and everything else you've been meaning to get to.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Add Your First Media
            </button>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">No media found matching your search.</p>
          </div>
        ) : activeCategory === "all" ? (
          // Netflix-style category rows
          populatedCategories.map((cat) => (
            <CategoryRow
              key={cat}
              category={cat}
              items={groupedItems[cat] || []}
              onStatusChange={handleStatusChange}
              onItemClick={handleItemClick}
            />
          ))
        ) : (
          // Grid view for single category
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {CATEGORY_LABELS[activeCategory]}
              <span className="text-muted-foreground text-sm font-normal ml-2">({displayItems.length})</span>
            </h2>
            <div className="flex flex-wrap gap-4">
              {displayItems.map((item) => (
                <MediaCard key={item.id} item={item} onStatusChange={handleStatusChange} onClick={handleItemClick} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddMediaModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditItem(null); }}
        onAdd={handleAdd}
        editItem={editItem}
      />

      <MediaDetailModal
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Index;
