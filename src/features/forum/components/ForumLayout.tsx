import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, MessageSquare } from 'lucide-react';
import type { ForumCategoryWithCounts } from '../services';
import { getIconComponent } from './CategoryList';
import { cn } from '@/lib/utils';

interface ForumLayoutProps {
  children: React.ReactNode;
  categories: ForumCategoryWithCounts[];
  selectedCategory: string | null;
  onCategorySelect: (categorySlug: string | null) => void;
  sidebar?: React.ReactNode;
}

export function ForumLayout({
  children,
  categories,
  selectedCategory,
  onCategorySelect,
  sidebar,
}: ForumLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileSelect = (slug: string | null) => {
    onCategorySelect(slug);
    setMobileMenuOpen(false);
  };

  const selectedCategoryName = selectedCategory 
    ? categories.find(c => c.slug === selectedCategory)?.name || 'Categoría'
    : 'Todas las categorías';

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0" data-testid="forum-layout">
      {/* Mobile Category Selector */}
      <div className="md:hidden flex items-center gap-2 p-3 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 justify-start gap-2 h-9"
              data-testid="mobile-category-trigger"
            >
              <Menu className="h-4 w-4" />
              <span className="truncate text-xs">{selectedCategoryName}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b border-[var(--card-border)]">
              <SheetTitle className="text-left text-sm">Categorías</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-60px)]">
              <nav className="p-3 space-y-1">
                <button
                  onClick={() => handleMobileSelect(null)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    selectedCategory === null
                      ? 'bg-accent text-white font-medium'
                      : 'text-[var(--text-default)] hover:bg-[var(--hover-bg)]'
                  )}
                  data-testid="mobile-category-all"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Todos</span>
                </button>

                {categories.map((category) => {
                  const Icon = getIconComponent(category.icon);
                  const isSelected = selectedCategory === category.slug;

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleMobileSelect(category.slug)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        isSelected
                          ? 'bg-accent text-white font-medium'
                          : 'text-[var(--text-default)] hover:bg-[var(--hover-bg)]'
                      )}
                      data-testid={`mobile-category-${category.slug}`}
                    >
                      <Icon
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: isSelected ? undefined : category.color || undefined }}
                      />
                      <span className="flex-1 text-left truncate">{category.name}</span>
                      {(category.thread_count ?? 0) > 0 && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded',
                          isSelected ? 'bg-white/20' : 'bg-muted'
                        )}>
                          {category.thread_count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      {sidebar && (
        <aside className="hidden md:flex w-1/3 min-w-[240px] max-w-[400px] flex-shrink-0 border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">
          <ScrollArea className="w-full">
            <div className="p-4">
              {sidebar}
            </div>
          </ScrollArea>
        </aside>
      )}

      {/* Main Content */}
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
