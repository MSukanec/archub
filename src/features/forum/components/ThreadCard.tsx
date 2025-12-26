import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquare, Eye, Pin, Lock, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteThread, type ForumThreadWithAuthor } from '../services';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import { useToast } from '@/hooks/use-toast';
function getInitials(name: string): string {
  return name
    .split('')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, '')
    .trim();
}
interface ThreadCardProps {
  thread: ForumThreadWithAuthor;
  onClick?: () => void;
}
export function ThreadCard({ thread, onClick }: ThreadCardProps) {
  const { toast } = useToast();
  const { openModal } = useGlobalModalStore();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const deleteMutation = useDeleteThread();
  const authorName = thread.author?.full_name || 'Anónimo';
  const organizationName = thread.organization?.name;
  
  const rawContent = typeof thread.content === 'string'
    ? thread.content 
    : thread.content?.text || '';
  const plainText = stripHtmlTags(rawContent);
  const contentPreview = plainText
    ? plainText.slice(0, 150) + (plainText.length > 150 ? '...': '')
    : null;
  const currentUserId = currentUser?.user?.id;
  const isAuthor = currentUserId && thread.author_id === currentUserId;
  const canManage = isAuthor || isAdmin;
  const handleEditThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('forum-thread', { thread, mode: 'edit'});
  };
  const handleDeleteThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar Tema',
      description: `¿Estás seguro de que deseas eliminar el tema "${thread.title}"? Esta acción no se puede deshacer.`,
      itemName: thread.title,
      itemType: 'tema',
      consequences: [
        'Todas las respuestas serán eliminadas',
        'Las reacciones asociadas también se eliminarán',
      ],
      onDelete: async () => {
        try {
          await deleteMutation.mutateAsync(thread.id);
          toast({
            title: 'Tema eliminado',
            description: 'El tema ha sido eliminado exitosamente',
          });
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo eliminar el tema',
            variant: 'destructive',
          });
        }
      },
    });
  };
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:border-accent/30 ${
        thread.is_pinned ? 'border-accent/40 bg-accent/5': ''
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
            {/* Row 1: Author info + time */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              {thread.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-accent" data-testid={`pin-icon-${thread.id}`} />
              )}
              {thread.is_locked && (
                <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" data-testid={`lock-icon-${thread.id}`} />
              )}
              <span className="font-medium text-[var(--text-default)]">{authorName}</span>
              <span>·</span>
              <span>
                {formatDistanceToNow(new Date(thread.last_activity_at || thread.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            {/* Row 2: Title */}
            <h3 className="font-semibold text-[var(--text-default)] line-clamp-1 mb-1">
              {thread.title}
            </h3>
            {/* Row 3: Content preview */}
            {contentPreview && (
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
                {contentPreview}
              </p>
            )}
            {/* Row 4: Badge */}
            {thread.category && (
              <Badge className="text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90">
                {thread.category.name}
              </Badge>
            )}
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
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:bg-muted"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`thread-menu-${thread.id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={handleEditThread}
                    data-testid={`thread-edit-${thread.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteThread}
                    className="text-destructive focus:text-destructive"
                    data-testid={`thread-delete-${thread.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
