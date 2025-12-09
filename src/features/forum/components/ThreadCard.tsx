import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Eye, Heart, Pin, Lock } from 'lucide-react';
import type { ForumThreadWithAuthor } from '../services';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

interface ThreadCardProps {
  thread: ForumThreadWithAuthor;
  onClick?: () => void;
}

export function ThreadCard({ thread, onClick }: ThreadCardProps) {
  const authorName = thread.author?.full_name || 'Anónimo';
  const organizationName = thread.organization?.name;
  const contentPreview = thread.content?.text
    ? thread.content.text.slice(0, 150) + (thread.content.text.length > 150 ? '...' : '')
    : null;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-accent/30 ${
        thread.is_pinned ? 'border-accent/40 bg-accent/5' : ''
      }`}
      onClick={onClick}
      data-testid={`thread-card-${thread.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={thread.author?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {thread.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-accent" data-testid={`pin-icon-${thread.id}`} />
              )}
              {thread.is_locked && (
                <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" data-testid={`lock-icon-${thread.id}`} />
              )}
              {thread.category && (
                <Badge variant="outline" className="text-xs">
                  {thread.category.name}
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-[var(--text-default)] line-clamp-1 mb-1">
              {thread.title}
            </h3>

            {contentPreview && (
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
                {contentPreview}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={thread.author?.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <span>{organizationName || authorName}</span>
              </div>
              <span>·</span>
              <span>
                {formatDistanceToNow(new Date(thread.last_activity_at || thread.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1" title="Respuestas">
              <MessageSquare className="h-3.5 w-3.5" />
              <span data-testid={`reply-count-${thread.id}`}>0</span>
            </div>
            <div className="flex items-center gap-1" title="Vistas">
              <Eye className="h-3.5 w-3.5" />
              <span data-testid={`view-count-${thread.id}`}>{thread.view_count || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
