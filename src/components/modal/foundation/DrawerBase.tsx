import { ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
export type DrawerSnapPoint = 'auto'| 'half'| 'full';
export interface DrawerBaseProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  
  snapPoint?: DrawerSnapPoint;
  dismissible?: boolean;
  showDragHandle?: boolean;
  preventScroll?: boolean;
  preventCloseOnBackdrop?: boolean;
  
  zIndex?: number;
  
  className?: string;
  overlayClassName?: string;
  
  ariaLabel?: string;
}
export function DrawerBase({
  children,
  isOpen,
  onClose,
  headerContent,
  footerContent,
  snapPoint = 'auto',
  dismissible = true,
  showDragHandle = true,
  preventScroll = true,
  preventCloseOnBackdrop = false,
  zIndex = 50,
  className,
  overlayClassName,
  ariaLabel,
}: DrawerBaseProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (!preventScroll) return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, preventScroll]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!dismissible) return;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, [dismissible]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  }, [isDragging]);
  
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  }, [isDragging, dragY, onClose]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape'&& dismissible) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dismissible, onClose]);
  
  const snapPointClasses = {
    auto: 'max-h-[90vh]',
    half: 'h-[50vh]',
    full: 'h-screen rounded-none',
  };
  
  if (!isMounted || !isOpen) return null;
  
  const canCloseOnBackdrop = dismissible && !preventCloseOnBackdrop;
  
  const content = (
    <div
      className={cn(
        'fixed inset-0',
        overlayClassName
      )}
      style={{ zIndex }}
      onClick={canCloseOnBackdrop ? onClose : undefined}
    >
      <div className="absolute inset-0 bg-black/80 animate-in fade-in duration-200" />
      
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-background rounded-t-[20px] flex flex-col',
          'animate-in slide-in-from-bottom duration-300 ease-out',
          'pb-[env(safe-area-inset-bottom)]',
          snapPointClasses[snapPoint],
          className
        )}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none': 'transform 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showDragHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        
        {headerContent && (
          <div className="shrink-0 relative px-4 pb-2 border-b border-border">
            {headerContent}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="absolute top-1/2 right-2 transform -translate-y-1/2"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex-1 overflow-auto px-4 py-4">
          {children}
        </div>
        
        {footerContent && (
          <div className="shrink-0 px-4 py-3 border-t border-border">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
  
  return createPortal(content, document.body);
}
export default DrawerBase;
