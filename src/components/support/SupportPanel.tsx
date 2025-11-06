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
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
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

  // Cargar historial al montar
  useEffect(() => {
    loadHistory();
  }, []);

  const hasMessages = messages.length > 0;

  // Auto-scroll hacia arriba (donde están los nuevos) cuando cambian los mensajes
  useEffect(() => {
    if (scrollAreaRef.current && hasMessages) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }
  }, [messages, hasMessages]);

  const loadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setIsLoadingHistory(false);
        return;
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
        if (data?.messages) {
          setMessages(data.messages);
          // Invalidar el contador de mensajes sin leer después de cargar (ya se marcaron como leídos en el backend)
          queryClient.invalidateQueries({ queryKey: ['unread-user-support-messages-count'] });
        }
      }
    } catch (error) {
      console.error('Error loading support history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    
    if (!textToSend || isSending) return;

    setIsSending(true);
    
    // Agregar mensaje del usuario localmente
    const userMessage: SupportMessage = {
      sender: 'user',
      message: textToSend,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
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
        body: JSON.stringify({ message: textToSend })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      // Recargar historial para obtener el mensaje guardado con ID
      await loadHistory();
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remover mensaje local si falló
      setMessages(prev => prev.filter(msg => msg !== userMessage));
      
      alert(`Error: ${error.message || 'No se pudo enviar el mensaje'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isSending) {
        handleSendMessage();
      }
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
            {/* Mensajes en orden inverso: más nuevos arriba, más viejos abajo */}
            {[...messages].reverse().map((message, index) => (
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
                        src="/ArchubLogo.png" 
                        alt="Archub" 
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
          {/* Logo Archub */}
          <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center p-3 mb-4">
            <img 
              src="/ArchubLogo.png" 
              alt="Archub" 
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
            disabled={isSending}
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
            disabled={!inputValue.trim() || isSending}
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
