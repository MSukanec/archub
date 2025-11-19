/**
 * 🤖 FloatingAIChat - Botón flotante para abrir el chat IA
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AIPanel } from '@/components/ai/AIPanel';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
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
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40",
          "h-14 w-14 rounded-full",
          "bg-gradient-to-br from-purple-500 to-blue-500",
          "hover:from-purple-600 hover:to-blue-600",
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

      {/* Dialog con AIPanel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="sm:max-w-[500px] h-[600px] p-0 gap-0 flex flex-col"
          style={{
            backgroundColor: 'var(--main-sidebar-bg)',
            borderColor: 'var(--main-sidebar-border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--main-sidebar-border)]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--main-sidebar-fg)]">
                Asistente IA
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* AIPanel */}
          <div className="flex-1 overflow-hidden">
            <AIPanel
              userId={userId}
              userFullName={userFullName}
              userAvatarUrl={userAvatarUrl}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
