import { ScrollArea } from '@/components/ui/scroll-area';
import type { ForumCategoryWithCounts } from '../services';

interface ForumLayoutProps {
  children: React.ReactNode;
  categories: ForumCategoryWithCounts[];
  selectedCategory: string | null;
  onCategorySelect: (categorySlug: string | null) => void;
  sidebar?: React.ReactNode;
}

export function ForumLayout({
  children,
  sidebar,
}: ForumLayoutProps) {
  return (
    <div className="flex h-full min-h-0" data-testid="forum-layout">
      {sidebar && (
        <aside className="hidden md:flex w-1/4 min-w-[200px] max-w-[320px] flex-shrink-0 border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">
          <ScrollArea className="w-full">
            <div className="p-4">
              {sidebar}
            </div>
          </ScrollArea>
        </aside>
      )}
      <main className="flex-1 min-w-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
