import { useState } from "react";
import { Save, Upload as Load, Pencil, Trash2, X, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/hooks/useLayouts";
import { MediaItem } from "@/types/media";
import { toast } from "sonner";

interface LayoutsPanelProps {
  open: boolean;
  onClose: () => void;
  layouts: Layout[];
  currentItems: MediaItem[];
  onSave: (name: string, items: MediaItem[]) => void;
  onOverwrite: (id: string, items: MediaItem[]) => void;
  onLoad: (items: MediaItem[]) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function LayoutsPanel({
  open,
  onClose,
  layouts,
  currentItems,
  onSave,
  onOverwrite,
  onLoad,
  onRename,
  onDelete,
}: LayoutsPanelProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleSave = () => {
    if (!newName.trim()) {
      toast.error("Please enter a layout name");
      return;
    }
    onSave(newName.trim(), currentItems);
    toast.success(`Saved "${newName.trim()}" (${currentItems.length} items)`);
    setNewName("");
  };

  const handleLoad = (l: Layout) => {
    if (
      currentItems.length > 0 &&
      !confirm(
        `Load "${l.name}"? This will replace your current ${currentItems.length} items. (Tip: save current state first.)`
      )
    )
      return;
    onLoad(l.items);
    toast.success(`Loaded "${l.name}"`);
    onClose();
  };

  const handleOverwrite = (l: Layout) => {
    if (!confirm(`Overwrite "${l.name}" with current ${currentItems.length} items?`)) return;
    onOverwrite(l.id, currentItems);
    toast.success(`Updated "${l.name}"`);
  };

  const handleDelete = (l: Layout) => {
    if (!confirm(`Delete layout "${l.name}"? This cannot be undone.`)) return;
    onDelete(l.id);
    toast.success(`Deleted "${l.name}"`);
  };

  const startRename = (l: Layout) => {
    setEditingId(l.id);
    setEditName(l.name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>My Layouts</SheetTitle>
          <SheetDescription>
            Save and load different backlog presets locally in your browser. No account needed.
          </SheetDescription>
        </SheetHeader>

        {/* Save current */}
        <div className="mt-6 flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Layout name..."
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="w-4 h-4" /> Save
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Saves your current {currentItems.length} item{currentItems.length === 1 ? "" : "s"} as a new preset.
        </p>

        {/* List */}
        <div className="mt-6 space-y-2">
          {layouts.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No saved layouts yet. Save your current backlog above.
            </div>
          ) : (
            layouts.map((l) => (
              <div
                key={l.id}
                className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  {editingId === l.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="h-8"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={commitRename}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold truncate">{l.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(l.dateSaved).toLocaleDateString()} · {l.items.length} items
                      </div>
                    </>
                  )}
                </div>
                {editingId !== l.id && (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Load" onClick={() => handleLoad(l)}>
                      <Load className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Overwrite with current" onClick={() => handleOverwrite(l)}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Rename" onClick={() => startRename(l)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDelete(l)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
