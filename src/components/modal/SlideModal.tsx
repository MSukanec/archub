import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSlideNavigationState } from './useSlideNavigation';

interface SlideModalProps {
  title?: string;
  views: Record<string, React.ReactNode>;
  initialView?: string;
  onClose?: () => void;
  onSaveAll?: () => void;
  isOpen?: boolean;
  className?: string;
}

export default function SlideModal({
  title,
  views,
  initialView = 'main',
  onClose,
  onSaveAll,
  isOpen = true,
  className
}: SlideModalProps) {
  const {
    activeView,
    navigateTo,
    canGoBack,
    goBack,
    history,
    isAnimating,
    SlideNavigationContext
  } = useSlideNavigationState(initialView);

  const modalRef = useRef<HTMLDivElement>(null);
  const viewKeys = Object.keys(views);
  const currentViewIndex = viewKeys.indexOf(activeView);
  const isGoingForward = history.length > 1 && history[history.length - 2] !== activeView;

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (canGoBack) {
          goBack();
        } else if (onClose) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, canGoBack, goBack, onClose]);

  // Handle outside click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      if (canGoBack) {
        goBack();
      } else if (onClose) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const contextValue = {
    activeView,
    navigateTo,
    canGoBack,
    goBack,
    history
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(var(--background), 0.8)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={handleBackdropClick}
    >
      <Card 
        ref={modalRef}
        className={cn(
          "relative w-full max-w-md overflow-hidden",
          "bg-[var(--card-bg)] border-[var(--card-border)]",
          "rounded-xl shadow-xl",
          "max-h-[80vh] flex flex-col",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)] relative z-10">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="h-8 w-8 p-0 rounded-full hover:bg-[var(--muted)]"
                disabled={isAnimating}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {title || 'Modal'}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-[var(--muted)]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area with Slide Animation */}
        <CardContent className="p-0 flex-1 relative overflow-hidden">
          <SlideNavigationContext.Provider value={contextValue}>
            <div className="relative h-full">
              {viewKeys.map((viewKey, index) => {
                const isActive = viewKey === activeView;
                let transformClass = '';
                
                if (isActive) {
                  transformClass = 'translate-x-0';
                } else if (index < currentViewIndex) {
                  // Previous views slide to the left
                  transformClass = '-translate-x-full';
                } else {
                  // Next views slide to the right
                  transformClass = 'translate-x-full';
                }

                return (
                  <div
                    key={viewKey}
                    className={cn(
                      "absolute inset-0 transition-transform duration-300 ease-in-out",
                      transformClass,
                      "overflow-y-auto scrollbar-hide",
                      "bg-[var(--card-bg)]"
                    )}
                    style={{
                      visibility: isActive || isAnimating ? 'visible' : 'hidden'
                    }}
                  >
                    <div className="p-4 min-h-full">
                      {views[viewKey]}
                    </div>
                  </div>
                );
              })}
            </div>
          </SlideNavigationContext.Provider>
        </CardContent>

        {/* Footer with Save Button (optional) */}
        {onSaveAll && (
          <div className="p-4 border-t border-[var(--card-border)] bg-[var(--card-bg)]">
            <Button 
              onClick={onSaveAll}
              className="w-full"
              disabled={isAnimating}
            >
              Guardar Todo
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}