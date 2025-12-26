import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ForumPostWithAuthor } from '../services';
function getInitials(name: string): string {
  return name
    .split('')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
interface PostCardProps {
  post: ForumPostWithAuthor;
  depth?: number;
  likeCount?: number;
  isLiked?: boolean;
  onLike?: (postId: string) => void;
  currentUserId?: string;
  onEdit?: (post: ForumPostWithAuthor) => void;
  onDelete?: (postId: string) => void;
}
export function PostCard({
  post,
  depth = 0,
  likeCount = 0,
  isLiked = false,
  onLike,
  currentUserId,
  onEdit,
  onDelete,
}: PostCardProps) {
  const authorName = post.author?.full_name || 'Anónimo';
  const organizationName = post.organization?.name;
  const maxDepth = 3;
  const actualDepth = Math.min(depth, maxDepth);
  const contentText = typeof post.content === 'string'
    ? post.content
    : post.content?.text || '';
  const isAuthor = currentUserId && post.author_id === currentUserId;
  return (
    <div
      className={cn(
        'py-4',
        actualDepth > 0 && 'ml-6 pl-4 border-l-2 border-[var(--card-border)]'
      )}
      data-testid={`post-card-${post.id}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={post.author?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm mb-1">
            <span className="font-medium text-[var(--text-default)]">
              {organizationName || authorName}
            </span>
            {organizationName && (
              <span className="text-[var(--text-muted)] text-xs">
                ({authorName})
              </span>
            )}
            <span className="text-[var(--text-muted)] text-xs">
              {format(new Date(post.created_at), "d 'de'MMM, HH:mm", { locale: es })}
            </span>
          </div>
          <div 
            className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-default)]"
            dangerouslySetInnerHTML={{ __html: contentText }}
          />
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-2 text-xs gap-1',
                isLiked && 'text-red-500'
              )}
              onClick={() => onLike?.(post.id)}
              data-testid={`like-button-${post.id}`}
            >
              <Heart className={cn('h-3.5 w-3.5', isLiked && 'fill-current')} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </Button>
            {isAuthor && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    data-testid={`post-actions-${post.id}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(post)} data-testid={`edit-post-${post.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(post.id)} 
                      className="text-destructive"
                      data-testid={`delete-post-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      {post.replies && post.replies.length > 0 && (
        <div className="mt-2">
          {post.replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              depth={depth + 1}
              onLike={onLike}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
