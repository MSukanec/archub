import { Search } from 'lucide-react';
import { ContextMegaMenu, PagesMegaMenu, TabsMegaMenu, UserAvatarMenu, type PageTab } from './MegaMenu';
import { ExpandableAvatarGroup } from '@/components/shared/layout/ExpandableAvatarGroup';
interface LabToolbarProps {
  showSecondaryToolbar?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  rightSlot?: React.ReactNode;
  secondaryLeftSlot?: React.ReactNode;
  secondaryRightSlot?: React.ReactNode;
  organizationId?: string;
  showMembers?: boolean;
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}
export function LabToolbar({
  showSecondaryToolbar = true,
  showSearch = true,
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  rightSlot,
  secondaryLeftSlot,
  secondaryRightSlot,
  organizationId,
  showMembers = true,
  tabs = [],
  activeTab = '',
  onTabChange,
}: LabToolbarProps) {
  return (
    <div className="w-full flex flex-col bg-background">
      <div className="h-14 w-full flex border-b border-[var(--header-border)]">
        <ContextMegaMenu />
        
        <PagesMegaMenu />
        
        {tabs.length > 0 && onTabChange && (
          <TabsMegaMenu 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabChange={onTabChange} 
          />
        )}
        
        <div className="flex-1" />
        
        {rightSlot && (
          <div className="flex items-center px-4">
            {rightSlot}
          </div>
        )}
        
        {showMembers && organizationId && (
          <div className="flex items-center px-4">
            <ExpandableAvatarGroup organizationId={organizationId} />
          </div>
        )}
        
        <div>
          <UserAvatarMenu />
        </div>
      </div>
      
      {showSecondaryToolbar && (
        <div className="h-12 w-full flex items-center border-b border-[var(--header-border)] bg-background px-4 gap-4">
          {showSearch && (
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
          )}
          
          {!showSearch && secondaryLeftSlot && (
            <div className="flex items-center">
              {secondaryLeftSlot}
            </div>
          )}
          
          {!showSearch && <div className="flex-1" />}
          
          {secondaryRightSlot && (
            <div className="flex items-center gap-2">
              {secondaryRightSlot}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
