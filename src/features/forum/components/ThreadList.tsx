import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';
import { ThreadCard } from './ThreadCard';
import { getIconComponent } from './CategoryList';
import { EmptyState } from '@/components/shared/EmptyState';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import type { ForumThreadWithAuthor, ForumCategoryWithCounts } from '../services';

interface ThreadListProps {
  threads: ForumThreadWithAuthor[];
  isLoading?: boolean;
  onThreadClick?: (thread: ForumThreadWithAuthor) => void;
  selectedCategory?: ForumCategoryWithCounts | null;
  onNewThread?: () => void;
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
  onNewThread,
}: ThreadListProps) {
  const isAdmin = useIsAdmin();

  if (isLoading) {
    return <ThreadListSkeleton />;
  }

  const hasThreads = threads.length > 0;
  const canCreateThread = !selectedCategory?.is_read_only || isAdmin;
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
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-[var(--text-default)]">
                    {selectedCategory.name}
                  </h2>
                  {onNewThread && canCreateThread && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onNewThread}
                      className="h-8 px-3 text-xs font-medium"
                      data-testid="button-new-thread"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Nuevo Tema
                    </Button>
                  )}
                </div>
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
        <EmptyState
          icon={<MessageSquare />}
          title="No hay temas en esta categoría"
          description={canCreateThread ? "Sé el primero en iniciar una conversación" : "Esta categoría es solo para anuncios oficiales"}
          action={
            onNewThread && canCreateThread ? (
              <Button
                variant="default"
                onClick={onNewThread}
                data-testid="button-new-thread-empty"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tema
              </Button>
            ) : undefined
          }
        />
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
