import { useState, useEffect, useMemo } from 'react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/shared/fields/RichTextEditor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Lock, Pin, Send, ArrowLeft, Eye, Image as ImageIcon, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PostCard } from './PostCard';
import { cn } from '@/lib/utils';
import {
  useForumThread,
  useThreadReactions,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useToggleReaction,
  useIncrementViewCount,
  type ForumThreadWithPosts,
  type ForumAttachment,
  type ForumPostWithAuthor,
} from '../services';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { ImageLightbox, useImageLightbox } from '@/components/shared/viewers/ImageLightbox';
function getInitials(name: string): string {
  return name
    .split('')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
function ThreadDetailSkeleton() {
  return (
    <div className="space-y-4" data-testid="thread-detail-skeleton">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
interface ThreadDetailProps {
  threadSlug: string;
  onBack?: () => void;
}
export function ThreadDetail({ threadSlug, onBack }: ThreadDetailProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { data: thread, isLoading } = useForumThread(threadSlug);
  const { data: reactions } = useThreadReactions(thread?.id || '');
  const createPostMutation = useCreatePost();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();
  const toggleReactionMutation = useToggleReaction();
  const incrementViewMutation = useIncrementViewCount();
  const [replyContent, setReplyContent] = useState('');
  // Calculate image attachments for lightbox - must be before any conditional returns
  const imageAttachments = useMemo(() => {
    if (!thread?.attachments) return [];
    return thread.attachments
      .filter(att => att.media_file?.file_type === 'image'&& att.media_file?.file_url)
      .map(att => ({
        id: att.id,
        url: att.media_file!.file_url!,
        name: att.media_file!.file_name,
      }));
  }, [thread?.attachments]);
  
  const imageUrls = useMemo(() => imageAttachments.map(img => img.url), [imageAttachments]);
  const { isOpen: isLightboxOpen, currentIndex, openLightbox, closeLightbox } = useImageLightbox(imageUrls);
  useEffect(() => {
    if (thread?.id) {
      incrementViewMutation.mutate(thread.id);
    }
  }, [thread?.id]);
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !thread) return;
    try {
      await createPostMutation.mutateAsync({
        thread_id: thread.id,
        thread_slug: threadSlug,
        content: replyContent,
      });
      setReplyContent('');
      toast({
        title: 'Respuesta publicada',
        description: 'Tu respuesta ha sido publicada correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo publicar la respuesta',
        variant: 'destructive',
      });
    }
  };
  const handleLikeThread = () => {
    if (!thread) return;
    toggleReactionMutation.mutate({
      item_type: 'thread',
      item_id: thread.id,
    });
  };
  const handleLikePost = (postId: string) => {
    toggleReactionMutation.mutate({
      item_type: 'post',
      item_id: postId,
    });
  };
  const handleEditThread = () => {
    if (!thread) return;
    openModal('forum-thread', {
      thread: {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        category_id: thread.category_id,
      },
      mode: 'edit',
    });
  };
  const handleEditPost = (post: ForumPostWithAuthor) => {
    openModal('forum-post', { 
      threadId: thread?.id, 
      threadSlug,
      post 
    });
  };
  const handleDeletePost = (postId: string) => {
    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar respuesta',
      description: 'La respuesta será eliminada permanentemente del foro.',
      itemName: 'Respuesta',
      onDelete: async () => {
        await deletePostMutation.mutateAsync(postId);
        toast({
          title: 'Respuesta eliminada',
          description: 'La respuesta ha sido eliminada correctamente',
        });
      },
    });
  };
  if (isLoading) {
    return <ThreadDetailSkeleton />;
  }
  if (!thread) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">Tema no encontrado</p>
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        )}
      </div>
    );
  }
  const authorName = thread.author?.full_name || 'Anónimo';
  const organizationName = thread.organization?.name;
  const contentText = typeof thread.content === 'string'
    ? thread.content
    : thread.content?.text || '';
  const likeCount = reactions?.thread?.likes ?? 0;
  const isLiked = reactions?.thread?.userReaction === 'like';
  const isThreadAuthor = userData?.user?.id && thread.author_id === userData.user.id;
  return (
    <div className="space-y-4" data-testid="thread-detail">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      )}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={thread.author?.avatar_url || undefined} />
              <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {thread.is_pinned && (
                  <Pin className="h-4 w-4 text-accent" />
                )}
                {thread.is_locked && (
                  <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                )}
                {thread.category && (
                  <Badge 
                    className="bg-[var(--accent)] text-white border-transparent hover:bg-[var(--accent)]"
                  >
                    {thread.category.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-semibold text-[var(--text-default)] mb-2">
                {thread.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
                <span className="font-medium">{organizationName || authorName}</span>
                {organizationName && <span>({authorName})</span>}
                <span>·</span>
                <span>
                  {(() => {
                    const date = new Date(thread.created_at);
                    return isValid(date) 
                      ? format(date, "d 'de'MMMM, yyyy 'a las'HH:mm", { locale: es })
                      : 'Fecha no disponible';
                  })()}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {thread.view_count || 0} vistas
                </span>
              </div>
              {contentText && (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-default)]"
                  dangerouslySetInnerHTML={{ __html: contentText }}
                />
              )}
              {imageAttachments.length > 0 && (
                <div className="mt-4">
                  <div className={cn(
                    "grid gap-2",
                    imageAttachments.length === 1 && "grid-cols-1",
                    imageAttachments.length === 2 && "grid-cols-2",
                    imageAttachments.length >= 3 && "grid-cols-2 md:grid-cols-3"
                  )}>
                    {imageAttachments.map((img, index) => (
                      <div
                        key={img.id}
                        className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group"
                        onClick={() => openLightbox(index)}
                        data-testid={`thread-image-${img.id}`}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--card-border)]">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-8 px-3 gap-1.5', isLiked && 'text-red-500')}
                  onClick={handleLikeThread}
                  data-testid="like-thread-button"
                >
                  <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
                  <span>{likeCount}</span>
                </Button>
                {isThreadAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 ml-auto"
                        data-testid="thread-actions-button"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEditThread} data-testid="edit-thread-button">
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar tema
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {thread.posts && thread.posts.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <h2 className="text-sm font-medium text-[var(--text-default)]">
              {thread.posts.length} {thread.posts.length === 1 ? 'respuesta': 'respuestas'}
            </h2>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--card-border)]">
            {thread.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                likeCount={reactions?.posts?.[post.id] ?? 0}
                onLike={handleLikePost}
                currentUserId={userData?.user?.id}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            ))}
          </CardContent>
        </Card>
      )}
      {!thread.is_locked && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmitReply} className="space-y-3">
              <RichTextEditor
                placeholder="Escribe tu respuesta..."
                value={replyContent}
                onChange={setReplyContent}
                minHeight="100px"
                data-testid="reply-textarea"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={createPostMutation.isPending || !replyContent.trim()}
                  data-testid="submit-reply-button"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createPostMutation.isPending ? 'Enviando...': 'Responder'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {thread.is_locked && (
        <Card className="bg-[var(--muted-bg)]">
          <CardContent className="p-4 text-center">
            <Lock className="h-5 w-5 mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-sm text-[var(--text-muted)]">
              Este tema está cerrado y no admite nuevas respuestas
            </p>
          </CardContent>
        </Card>
      )}
      {imageUrls.length > 0 && (
        <ImageLightbox
          images={imageUrls}
          isOpen={isLightboxOpen}
          currentIndex={currentIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
