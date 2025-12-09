import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Users } from 'lucide-react';
import { ThreadCard } from './ThreadCard';
import { getIconComponent } from './CategoryList';
import type { ForumThreadWithAuthor, ForumCategoryWithCounts } from '../services';

interface ThreadListProps {
  threads: ForumThreadWithAuthor[];
  isLoading?: boolean;
  onThreadClick?: (thread: ForumThreadWithAuthor) => void;
  selectedCategory?: ForumCategoryWithCounts | null;
}

function ThreadListSkeleton() {
  return (
    <div className="space-y-3" data-testid="thread-list-skeleton">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ThreadList({
  threads,
  isLoading,
  onThreadClick,
  selectedCategory,
}: ThreadListProps) {
  if (isLoading) {
    return <ThreadListSkeleton />;
  }

  const hasThreads = threads.length > 0;
  const pinnedThreads = threads.filter((t) => t.is_pinned);
  const regularThreads = threads.filter((t) => !t.is_pinned);

  const sortedRegularThreads = [...regularThreads].sort((a, b) => {
    return new Date(b.last_activity_at || b.created_at).getTime() -
           new Date(a.last_activity_at || a.created_at).getTime();
  });

  const CategoryIcon = selectedCategory ? getIconComponent(selectedCategory.icon) : MessageSquare;

  return (
    <div className="space-y-4" data-testid="thread-list">
      {selectedCategory && (
        <div 
          className="rounded-xl border border-[var(--card-border)] bg-gradient-to-r from-[var(--card-bg)] to-transparent overflow-hidden"
          data-testid="category-header"
        >
          <div 
            className="h-16 w-full"
            style={{ 
              background: selectedCategory.color 
                ? `linear-gradient(135deg, ${selectedCategory.color}20 0%, ${selectedCategory.color}40 100%)`
                : 'linear-gradient(135deg, var(--accent)20 0%, var(--accent)40 100%)'
            }}
          />
          <div className="p-5 -mt-8">
            <div className="flex items-start gap-4">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-[var(--card-bg)]"
                style={{ 
                  backgroundColor: selectedCategory.color || 'var(--accent)',
                }}
              >
                <CategoryIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-xl font-bold text-[var(--text-default)]">
                  {selectedCategory.name}
                </h2>
                {selectedCategory.description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">
                    {selectedCategory.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {selectedCategory.thread_count ?? 0} {(selectedCategory.thread_count ?? 0) === 1 ? 'tema' : 'temas'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedCategory && hasThreads && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-muted)]">
            {threads.length} {threads.length === 1 ? 'tema' : 'temas'}
          </span>
        </div>
      )}

      {!hasThreads && (
        <div className="text-center py-16" data-testid="thread-list-empty">
          <MessageSquare className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-default)] mb-2">
            No hay temas en esta categoría
          </h3>
          <p className="text-[var(--text-muted)]">
            Sé el primero en iniciar una conversación
          </p>
        </div>
      )}

      {pinnedThreads.length > 0 && (
        <div className="space-y-2">
          {pinnedThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onClick={() => onThreadClick?.(thread)}
            />
          ))}
        </div>
      )}

      {sortedRegularThreads.length > 0 && (
        <div className="space-y-2">
          {sortedRegularThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onClick={() => onThreadClick?.(thread)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
