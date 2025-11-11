/**
 * 💬 SupportModal - Modal de chat de soporte
 * 
 * Modal Dialog para contactar con administradores:
 * - Contacto directo con el equipo de soporte
 * - Opción para unirse a la comunidad Discord
 * - Historial de mensajes persistente
 */

import { useEffect, useState, useRef, type KeyboardEvent } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, ExternalLink, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';

interface SupportMessage {
  sender: 'user' | 'admin';
  message: string;
  created_at: string;
}

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userFullName: string;
  userAvatarUrl?: string;
}

const DISCORD_LINK = 'https://discord.com/channels/868615664070443008';

export function SupportModal({ open, onOpenChange, userId, userFullName, userAvatarUrl }: SupportModalProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Obtener primera letra del nombre para el avatar
  const userInitial = userFullName?.charAt(0)?.toUpperCase() || 'U';

  // Auto-resize del textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // max 120px
    textarea.style.height = `${newHeight}px`;
  }, [inputValue]);

  // Cargar mensajes con React Query (carga inicial, luego Realtime lo actualiza)
  const { data: messages = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['support-messages', userId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return [];
      }

      const response = await fetch('/api/support/messages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Invalidar el contador de mensajes sin leer después de cargar
        queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count'] });
        // Ordenar del más viejo al más nuevo (orden cronológico normal)
        const sorted = (data.messages || []).sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return sorted;
      }
      
      return [];
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled: open, // Solo hacer la query cuando el modal está abierto
  });

  // 🔥 SUPABASE REALTIME - Escuchar cambios en tiempo real
  useEffect(() => {
    if (!supabase || !userId || !open) return;

    const setupRealtimeSubscription = async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!userData) return;

      const dbUserId = userData.id;

      const channel = supabase
        .channel(`support_messages:${dbUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${dbUserId}`
          },
          (payload) => {
            console.log('🔥 Realtime change:', payload);
            queryClient.invalidateQueries({ queryKey: ['support-messages', userId] });
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count', userId] });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanupPromise = setupRealtimeSubscription();

    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, [userId, open]);

  const hasMessages = messages.length > 0;

  // Auto-scroll hacia abajo cuando cambian los mensajes
  useEffect(() => {
    if (scrollAreaRef.current && hasMessages) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages.length]);

  // Mutation para enviar mensajes con optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }

      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      return response.json();
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['support-messages', userId] });
      const previousMessages = queryClient.getQueryData(['support-messages', userId]);
      
      queryClient.setQueryData(['support-messages', userId], (old: any[] = []) => [
        ...old,
        {
          sender: 'user',
          message: newMessage,
          created_at: new Date().toISOString(),
          id: 'temp-' + Date.now()
        }
      ]);
      
      setInputValue("");
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['support-messages', userId], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', userId] });
    },
  });

  const handleSendMessage = () => {
    const textToSend = inputValue.trim();
    if (!textToSend || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(textToSend);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  // HEADER
  const headerContent = (
    <FormModalHeader
      title="Soporte"
      description="Contacta con nuestro equipo para ayuda, soporte o feedback."
      icon={Headphones}
      rightActions={
        <a
          href={DISCORD_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
          data-testid="link-discord-support"
        >
          <span>Comunidad Discord</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      }
    />
  );

  // CONTENIDO DEL CHAT
  const editPanel = (
    <div className="flex flex-col h-[calc(80vh-180px)]">
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      ) : hasMessages ? (
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4 space-y-4">
            {messages.map((message: any, index: number) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.sender === 'user' ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatarUrl} alt={userFullName} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center p-1">
                      <img 
                        src="/Seencel512.png" 
                        alt="Seencel" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Burbuja de mensaje */}
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[75%]",
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 px-4 py-8 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center p-3 mb-4">
            <img 
              src="/Seencel512.png" 
              alt="Seencel" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            ¿Necesitas ayuda?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Envía un mensaje y nuestro equipo te responderá lo antes posible.
          </p>
        </div>
      )}
    </div>
  );

  // FOOTER PERSONALIZADO CON INPUT
  const footerContent = (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto">
      <div className="relative flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          disabled={sendMessageMutation.isPending}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent",
            "text-sm leading-5 placeholder:text-muted-foreground",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "max-h-[120px] overflow-y-auto"
          )}
          style={{
            minHeight: '24px',
            height: '24px',
            scrollbarWidth: 'thin'
          }}
          data-testid="input-support-message"
        />
        
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || sendMessageMutation.isPending}
          className={cn(
            "flex-shrink-0 p-1.5 rounded-full",
            "bg-primary hover:bg-primary/90 transition-colors",
            "text-primary-foreground",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          aria-label="Enviar mensaje"
          data-testid="button-send-support-message"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
      wide={true}
    />
  );
}
