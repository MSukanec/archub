/**
 * 🤖 FloatingAIChat - Chat flotante tipo soporte en vivo
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AIPanel } from '@/features/ai';
import { Sparkles, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/features/users/hooks';

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { data: userData } = useCurrentUser();

  // No mostrar si no hay usuario
  if (!userData?.user) {
    return null;
  }

  const userId = userData.user.id;
  const userFullName = userData.user.full_name || userData.user.first_name || 'Usuario';
  const userAvatarUrl = userData.user.avatar_url;

  return (
    <>
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "h-14 w-14 rounded-full",
            "bg-gradient-to-br from-[#96cc00] to-[#64a339]",
            "hover:from-[#a8e000] hover:to-[#73b541]",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-200",
            "flex items-center justify-center",
            "group"
          )}
          aria-label="Abrir chat IA"
          data-testid="button-floating-ai-chat"
        >
          <Sparkles className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Flotante - Tipo Popover */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "w-[380px] rounded-lg shadow-2xl border",
            "flex flex-col overflow-hidden",
            "transition-all duration-200",
            isMinimized ? "h-14" : "h-[600px]"
          )}
          style={{
            backgroundColor: 'var(--main-sidebar-bg)',
            borderColor: 'var(--main-sidebar-border)',
          }}
        >
          {/* Header del Chat */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--main-sidebar-border)] bg-gradient-to-br from-[#96cc00] to-[#64a339]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Asistente IA
                </h3>
                <p className="text-xs text-white/80">
                  En línea
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 hover:bg-white/20 text-white"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="h-7 w-7 hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenido del Chat */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden">
              <AIPanel
                userId={userId}
                userFullName={userFullName}
                userAvatarUrl={userAvatarUrl}
                onClose={() => setIsOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
