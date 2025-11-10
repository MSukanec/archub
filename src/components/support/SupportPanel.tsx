/**
 * 💬 SupportPanel - Panel de chat de soporte integrado en RightSidebar
 * 
 * Componente que muestra un chat para contactar con administradores:
 * - Contacto directo con el equipo de soporte
 * - Opción para unirse a la comunidad Discord
 * - Historial de mensajes persistente
 */

import { useEffect, useState, useRef, type KeyboardEvent } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';

interface SupportMessage {
  sender: 'user' | 'admin';
  message: string;
  created_at: string;
}

interface SupportPanelProps {
  userId: string;
  userFullName: string;
  userAvatarUrl?: string;
  onClose: () => void;
}

const DISCORD_LINK = 'https://discord.com/channels/868615664070443008';

export function SupportPanel({ userId, userFullName, userAvatarUrl, onClose }: SupportPanelProps) {
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
  const { data: messages = [], isLoading: isLoadingHistory, isFetching } = useQuery({
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
    // Ya NO usamos polling - Supabase Realtime lo reemplaza
    refetchOnWindowFocus: true,
    // Permitir refetch al montar para capturar mensajes que llegaron mientras estaba cerrado
    staleTime: 0,
  });

  // 🔥 SUPABASE REALTIME - Escuchar cambios en tiempo real
  useEffect(() => {
    if (!supabase || !userId) return;

    // Obtener el user_id de la tabla users (necesario para el filtro)
    const setupRealtimeSubscription = async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (!userData) return;

      const dbUserId = userData.id;

      // Crear canal de Realtime para support_messages
      const channel = supabase
        .channel(`support_messages:${dbUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Escuchar INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'support_messages',
            filter: `user_id=eq.${dbUserId}` // Solo mensajes de este usuario
          },
          (payload) => {
            
            // Invalidar query para refrescar los mensajes
            queryClient.invalidateQueries({ queryKey: ['support-messages', userId] });
            
            // Si es un nuevo mensaje del admin, invalidar contador
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count', userId] });
            }
          }
        )
        .subscribe();

      // Cleanup al desmontar
      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanupPromise = setupRealtimeSubscription();

    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, [userId]);

  const hasMessages = messages.length > 0;

  // Auto-scroll hacia abajo (donde están los mensajes nuevos) cuando cambian los mensajes
  useEffect(() => {
    if (scrollAreaRef.current && hasMessages) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Scroll suave al final
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages.length]); // Solo cuando cambia la cantidad de mensajes, no en cada refetch

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
      // Cancelar refetch en progreso
      await queryClient.cancelQueries({ queryKey: ['support-messages', userId] });
      
      // Obtener data actual
      const previousMessages = queryClient.getQueryData(['support-messages', userId]);
      
      // Optimistic update: agregar el mensaje inmediatamente
      queryClient.setQueryData(['support-messages', userId], (old: any[] = []) => [
        ...old,
        {
          sender: 'user',
          message: newMessage,
          created_at: new Date().toISOString(),
          id: 'temp-' + Date.now() // ID temporal
        }
      ]);
      
      // Limpiar input inmediatamente
      setInputValue("");
      
      return { previousMessages };
    },
    onError: (err, newMessage, context) => {
      // Revertir si hay error
      if (context?.previousMessages) {
        queryClient.setQueryData(['support-messages', userId], context.previousMessages);
      }
    },
    onSettled: () => {
      // Refrescar para obtener el mensaje real del servidor
      queryClient.invalidateQueries({ queryKey: ['support-messages', userId] });
    },
  });

  const handleSendMessage = () => {
    const textToSend = inputValue.trim();
    if (!textToSend || sendMessageMutation.isPending) return;
    // El optimistic update limpiará el input automáticamente en onMutate
    sendMessageMutation.mutate(textToSend);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* HEADER */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm !text-white">Soporte</h3>
        </div>
        
        {/* Información de soporte */}
        <div className="text-xs text-muted-foreground space-y-2">
          <p>Contacta con nuestro equipo para ayuda, soporte o feedback.</p>
          
          {/* Link a Discord */}
          <a
            href={DISCORD_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-white hover:underline transition-colors"
            data-testid="link-discord-support"
          >
            <span>Únete a nuestra comunidad Discord</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      
      <Separator className="bg-[var(--main-sidebar-fg)] opacity-20" />

      {/* CONTENIDO */}
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      ) : hasMessages ? (
        // Vista con conversación
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4 space-y-4">
            {/* Mensajes en orden cronológico: más viejos arriba, más nuevos abajo (como WhatsApp) */}
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
                      <AvatarFallback className="bg-[var(--accent)] text-white text-xs">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center p-1">
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
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--main-sidebar-button-hover-bg)] text-white'
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        // Vista inicial (sin mensajes)
        <div className="flex-1 px-4 py-6 flex flex-col items-center justify-center text-center">
          {/* Logo Seencel */}
          <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center p-3 mb-4">
            <img 
              src="/Seencel512.png" 
              alt="Seencel" 
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-lg font-semibold !text-white mb-2">
            ¿Necesitas ayuda?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Envía un mensaje y nuestro equipo te responderá lo antes posible.
          </p>
        </div>
      )}

      {/* INPUT - Siempre al fondo */}
      <Separator className="bg-[var(--main-sidebar-fg)] opacity-20" />
      <div className="p-4 pb-3">
        <div className="relative flex items-center gap-2 rounded-lg bg-[var(--main-sidebar-button-hover-bg)] px-3 py-1.5">
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
              "text-sm leading-5 text-white placeholder:text-muted-foreground",
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
              "bg-[var(--accent)] hover:opacity-90 transition-opacity",
              "text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            aria-label="Enviar mensaje"
            data-testid="button-send-support-message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
