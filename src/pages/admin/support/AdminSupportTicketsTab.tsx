import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { MessageCircle, ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatDateCompact } from '@/lib/date-utils';

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender: 'user' | 'admin';
  created_at: string;
}

interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface Conversation {
  user_id: string;
  user: UserInfo;
  messages: SupportMessage[];
  last_message_at: string;
  unread_count: number;
}

const AdminSupportTicketsTab = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Marcar mensajes como leídos cuando se selecciona una conversación
  const markAsReadMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }

      const response = await fetch('/api/admin/support/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        throw new Error('Error marking messages as read');
      }

      return response.json();
    },
    onSuccess: async () => {
      // Invalidar y refrescar inmediatamente las queries
      await queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['unread-support-messages-count'] });
      // Forzar refetch inmediato
      await queryClient.refetchQueries({ queryKey: ['admin-support-conversations'] });
      await queryClient.refetchQueries({ queryKey: ['unread-support-messages-count'] });
    }
  });

  // Marcar como leído cuando se selecciona una conversación
  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    markAsReadMutation.mutate(userId);
  };

  // 🔥 SUPABASE REALTIME - Escuchar cambios en tiempo real para conversaciones
  useEffect(() => {
    if (!supabase) return;

    // Suscribirse a cambios en support_messages
    const channel = supabase
      .channel('admin_support_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        (payload) => {
          console.log('🔥 Admin conversations Realtime update:', payload);
          // Invalidar conversaciones y contador
          queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
          queryClient.invalidateQueries({ queryKey: ['unread-support-messages-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch all conversations - YA NO USA POLLING, Realtime lo actualiza
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['admin-support-conversations'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }

      const response = await fetch('/api/admin/support/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error fetching conversations');
      }

      const data = await response.json();
      return data.conversations as Conversation[];
    },
    // Ya NO usamos polling - Realtime lo reemplaza
    refetchOnWindowFocus: true,
    // Permitir refetch al montar para capturar cambios que llegaron mientras estaba cerrado
    staleTime: 0,
  });

  // Send admin reply
  const sendReplyMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }

      const response = await fetch('/api/admin/support/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, message })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error sending reply');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
      setInputValue('');
      toast({
        title: 'Respuesta enviada',
        description: 'El mensaje fue enviado correctamente.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la respuesta.',
        variant: 'destructive'
      });
    }
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, [inputValue]);

  // Auto-scroll to newest messages
  useEffect(() => {
    if (scrollAreaRef.current && selectedUserId) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }
  }, [selectedUserId, conversations]);

  const handleSendReply = () => {
    if (!inputValue.trim() || !selectedUserId || sendReplyMutation.isPending) return;
    
    sendReplyMutation.mutate({
      userId: selectedUserId,
      message: inputValue.trim()
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const selectedConversation = conversations.find(c => c.user_id === selectedUserId);
  const sortedMessages = selectedConversation?.messages.slice().reverse() || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
      {/* Lista de conversaciones */}
      <div className="lg:col-span-1 border rounded-lg bg-card overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversaciones ({conversations.length})
          </h3>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          {conversations.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No hay conversaciones activas
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.user_id}
                  className={cn(
                    "cursor-pointer hover:border-[var(--accent)] transition-colors",
                    selectedUserId === conversation.user_id && "border-[var(--accent)] bg-muted/50"
                  )}
                  onClick={() => handleSelectConversation(conversation.user_id)}
                  data-testid={`conversation-${conversation.user_id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={conversation.user.avatar_url} alt={conversation.user.full_name} />
                        <AvatarFallback className="bg-[var(--accent)] text-white text-xs">
                          {conversation.user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {conversation.user.full_name}
                          </span>
                          {conversation.unread_count > 0 && (
                            <Badge variant="default" className="bg-[var(--accent)] text-white text-xs h-5 min-w-5 px-1.5">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {conversation.user.email}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {formatDateCompact(conversation.last_message_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat individual */}
      <div className="lg:col-span-2 border rounded-lg bg-card overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.user.avatar_url} alt={selectedConversation.user.full_name} />
                  <AvatarFallback className="bg-[var(--accent)] text-white">
                    {selectedConversation.user.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.user.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedConversation.user.email}</p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {sortedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.sender === 'admin' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div className="flex-shrink-0">
                      {message.sender === 'user' ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedConversation.user.avatar_url} alt={selectedConversation.user.full_name} />
                          <AvatarFallback className="bg-[var(--accent)] text-white text-xs">
                            {selectedConversation.user.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center p-1">
                          <img 
                            src="/Seencel512.png" 
                            alt="Admin" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[75%]",
                        message.sender === 'admin'
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                      <div className={cn(
                        "text-xs mt-1",
                        message.sender === 'admin' ? 'text-white/70' : 'text-muted-foreground'
                      )}>
                        {formatDateCompact(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Input de respuesta */}
            <div className="p-4">
              <div className="relative flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu respuesta..."
                  disabled={sendReplyMutation.isPending}
                  rows={1}
                  className={cn(
                    "flex-1 resize-none bg-transparent",
                    "text-sm leading-5 text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "max-h-[120px] overflow-y-auto"
                  )}
                  style={{
                    minHeight: '24px',
                    height: '24px',
                    scrollbarWidth: 'thin'
                  }}
                  data-testid="input-admin-reply"
                />
                
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={!inputValue.trim() || sendReplyMutation.isPending}
                  className={cn(
                    "flex-shrink-0 p-2 rounded-full",
                    "bg-[var(--accent)] hover:opacity-90 transition-opacity",
                    "text-white",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                  aria-label="Enviar respuesta"
                  data-testid="button-send-admin-reply"
                >
                  {sendReplyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Elige un usuario de la lista para ver y responder sus mensajes de soporte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportTicketsTab;
