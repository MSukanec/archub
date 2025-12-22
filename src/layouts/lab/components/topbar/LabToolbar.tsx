import { Search } from 'lucide-react';
import { ContextMegaMenu, PagesMegaMenu } from './MegaMenu';

interface LabToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  rightSlot?: React.ReactNode;
}

export function LabToolbar({
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  rightSlot,
}: LabToolbarProps) {
  return (
    <div className="h-14 w-full flex bg-[var(--header-bg)] border-b border-[var(--header-border)]">
      <ContextMegaMenu />
      
      <PagesMegaMenu />
      
      <div className="flex-1 flex items-center border-r border-[var(--header-border)]">
        <div className="flex items-center gap-3 px-4 w-full">
          <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--text-subtle)] text-sm outline-none"
            data-testid="input-lab-search"
          />
        </div>
      </div>
      
      {rightSlot && (
        <div className="flex items-center px-4">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
