import { Plus, Download, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef } from "react";

interface HeaderProps {
  onAddClick: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Header({ onAddClick, onExport, onImport, searchQuery, onSearchChange }: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4 flex-wrap">
        {/* Logo */}
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary">THE</span>{" "}
          <span className="text-foreground">BACK-LOG</span>
        </h1>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your back-log..."
            className="pl-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button onClick={onAddClick} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
            <Plus className="w-4 h-4" /> Add Media
          </Button>
          <Button variant="outline" size="icon" onClick={onExport} className="border-border text-foreground hover:bg-surface-hover" title="Export watchlist">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} className="border-border text-foreground hover:bg-surface-hover" title="Import watchlist">
            <Upload className="w-4 h-4" />
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); }} />
        </div>
      </div>
    </header>
  );
}
