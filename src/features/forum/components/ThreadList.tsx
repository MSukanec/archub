import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare } from 'lucide-react';
import { ThreadCard } from './ThreadCard';
import type { ForumThreadWithAuthor } from '../services';

type SortOption = 'recientes' | 'populares';

interface ThreadListProps {
  threads: ForumThreadWithAuthor[];
  isLoading?: boolean;
  onThreadClick?: (thread: ForumThreadWithAuthor) => void;
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
}: ThreadListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recientes');

  if (isLoading) {
    return <ThreadListSkeleton />;
  }

  const hasThreads = threads.length > 0;
  const pinnedThreads = threads.filter((t) => t.is_pinned);
  const regularThreads = threads.filter((t) => !t.is_pinned);

  const sortedRegularThreads = [...regularThreads].sort((a, b) => {
    if (sortBy === 'recientes') {
      return new Date(b.last_activity_at || b.created_at).getTime() -
             new Date(a.last_activity_at || a.created_at).getTime();
    } else {
      return (b.view_count || 0) - (a.view_count || 0);
    }
  });

  return (
    <div className="space-y-4" data-testid="thread-list">
      {hasThreads && (
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-36" data-testid="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Recientes</SelectItem>
              <SelectItem value="populares">Populares</SelectItem>
            </SelectContent>
          </Select>
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
