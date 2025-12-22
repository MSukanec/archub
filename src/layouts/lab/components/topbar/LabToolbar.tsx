import { Search } from 'lucide-react';
import { ContextMegaMenu, PagesMegaMenu, UserAvatarMenu } from './MegaMenu';
import { ExpandableAvatarGroup } from '@/components/shared/layout/ExpandableAvatarGroup';

interface LabToolbarProps {
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  rightSlot?: React.ReactNode;
  organizationId?: string;
  showMembers?: boolean;
}

export function LabToolbar({
  showSearch = false,
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  rightSlot,
  organizationId,
  showMembers = true,
}: LabToolbarProps) {
  return (
    <div className="w-full flex flex-col bg-[var(--header-bg)]">
      <div className="h-14 w-full flex border-b border-[var(--header-border)]">
        <ContextMegaMenu />
        
        <PagesMegaMenu />
        
        <div className="flex-1" />
        
        {rightSlot && (
          <div className="flex items-center px-4 border-l border-[var(--header-border)]">
            {rightSlot}
          </div>
        )}
        
        {showMembers && organizationId && (
          <div className="flex items-center px-4 border-l border-[var(--header-border)]">
            <ExpandableAvatarGroup organizationId={organizationId} />
          </div>
        )}
        
        <div className="border-l border-[var(--header-border)]">
          <UserAvatarMenu />
        </div>
      </div>
      
      {showSearch && (
        <div className="h-12 w-full flex items-center border-b border-[var(--header-border)]">
          <div className="flex items-center gap-3 px-4 w-full max-w-2xl">
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
      )}
    </div>
  );
}
