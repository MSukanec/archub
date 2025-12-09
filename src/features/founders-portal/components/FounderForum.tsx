import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, Pin, Plus, ChevronDown, ChevronUp, Send, MessagesSquare } from 'lucide-react';
import { 
  useForumThreads, 
  useForumThread, 
  useCreateThread, 
  useCreatePost,
  type ForumThread 
} from '../services';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'recursos', label: 'Recursos' },
  { value: 'networking', label: 'Networking' },
  { value: 'oportunidades', label: 'Oportunidades' },
  { value: 'preguntas', label: 'Preguntas' },
];

function getCategoryBadge(category: string) {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.label || category;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

export function CreateThreadDialog({ 
  open, 
  onOpenChange 
}: { 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const createMutation = useCreateThread();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createMutation.mutateAsync({ title, content, category });
      toast({
        title: 'Tema creado',
        description: 'Tu tema ha sido publicado exitosamente',
      });
      setIsOpen(false);
      setTitle('');
      setContent('');
      setCategory('general');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el tema',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button data-testid="button-new-thread">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tema
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nuevo tema</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Título del tema"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="input-thread-title"
            />
          </div>
          <div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="select-thread-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Textarea
              placeholder="Contenido (opcional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              data-testid="input-thread-content"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !title.trim()}
              data-testid="button-submit-thread"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear tema'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ThreadPosts({ threadId }: { threadId: string }) {
  const { toast } = useToast();
  const { data: thread, isLoading } = useForumThread(threadId);
  const createPostMutation = useCreatePost();
  const [newPost, setNewPost] = useState('');

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await createPostMutation.mutateAsync({ threadId, content: newPost });
      setNewPost('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo publicar la respuesta',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const posts = thread?.posts || [];

  return (
    <div className="space-y-4 pt-4 border-t border-[var(--card-border)]">
      {posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <div key={post.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {post.author?.full_name ? getInitials(post.author.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[var(--text-default)]">
                    {post.organization?.name || post.author?.full_name || 'Anónimo'}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs">
                    {format(new Date(post.created_at), "d MMM, HH:mm", { locale: es })}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-default)] mt-1">
                  {post.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmitPost} className="flex gap-2">
        <Input
          placeholder="Escribe una respuesta..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="flex-1"
          data-testid={`input-reply-${threadId}`}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={createPostMutation.isPending || !newPost.trim()}
          data-testid={`button-reply-${threadId}`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function ThreadCard({ thread }: { thread: ForumThread }) {
  const [isOpen, setIsOpen] = useState(false);
  const replyCount = thread.posts_count || 0;

  return (
    <Card data-testid={`card-thread-${thread.id}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-[var(--hover-bg)] transition-colors">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={thread.organization?.logo_url || undefined} />
                <AvatarFallback>
                  {thread.organization?.name ? getInitials(thread.organization.name) : '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {thread.is_pinned && (
                    <Pin className="h-3.5 w-3.5 text-accent" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {getCategoryBadge(thread.category)}
                  </Badge>
                </div>
                
                <h3 className="font-medium text-[var(--text-default)] line-clamp-1">
                  {thread.title}
                </h3>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                  <span>{thread.organization?.name || 'Anónimo'}</span>
                  <span>·</span>
                  <span>{format(new Date(thread.created_at), "d 'de' MMM", { locale: es })}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {replyCount}
                  </span>
                </div>
              </div>
              
              <div className="text-[var(--text-muted)]">
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            {thread.content && (
              <p className="text-sm text-[var(--text-default)] mb-4 pl-13">
                {thread.content}
              </p>
            )}
            <ThreadPosts threadId={thread.id} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function ForumSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FounderForum() {
  const { data, isLoading, error } = useForumThreads();
  const threads = data?.threads || [];

  if (isLoading) {
    return <ForumSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        Error al cargar el foro
      </div>
    );
  }

  const pinnedThreads = threads.filter(t => t.is_pinned);
  const regularThreads = threads.filter(t => !t.is_pinned);

  return (
    <div className="space-y-4">
      {threads.length === 0 ? (
        <div className="text-center py-12">
          <MessagesSquare className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">
            No hay temas en el foro
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Sé el primero en crear un tema
          </p>
        </div>
      ) : (
        <>
          {pinnedThreads.length > 0 && (
            <div className="space-y-2">
              {pinnedThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          )}
          
          {regularThreads.length > 0 && (
            <div className="space-y-2">
              {regularThreads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
