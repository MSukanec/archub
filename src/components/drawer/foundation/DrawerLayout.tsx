import { ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DrawerSide = 'left' | 'right';

const sizeClasses: Record<DrawerSize, string> = {
  sm: 'w-full sm:w-[400px]',
  md: 'w-full sm:w-[500px]',
  lg: 'w-full sm:w-[600px]',
  xl: 'w-full sm:w-[800px]',
  full: 'w-full',
};

const sideClasses: Record<DrawerSide, string> = {
  left: 'left-0 animate-in slide-in-from-left duration-300',
  right: 'right-0 animate-in slide-in-from-right duration-300',
};

export interface DrawerLayoutProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  
  size?: DrawerSize;
  side?: DrawerSide;
  
  preventEscapeClose?: boolean;
  preventClickOutsideClose?: boolean;
  
  className?: string;
  overlayClassName?: string;
  
  ariaLabel?: string;
  ariaDescription?: string;
  
  zIndex?: number;
}

export function DrawerLayout({
  children,
  isOpen,
  onClose,
  headerContent,
  footerContent,
  size = 'lg',
  side = 'right',
  preventEscapeClose = false,
  preventClickOutsideClose = false,
  className,
  overlayClassName,
  ariaLabel,
  ariaDescription,
  zIndex = 50,
}: DrawerLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerId = useRef(`drawer-${Date.now()}`);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);
  
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !preventEscapeClose && isOpen) {
        event.preventDefault();
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preventEscapeClose, handleClose, isOpen]);
  
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (preventClickOutsideClose) return;
    
    if (event.target === overlayRef.current) {
      handleClose();
    }
  }, [preventClickOutsideClose, handleClose]);
  
  if (!isMounted || !isOpen) return null;
  
  const content = (
    <div
      ref={overlayRef}
      className={cn(
        'fixed inset-0 bg-black/60 animate-in fade-in duration-200',
        overlayClassName
      )}
      style={{ zIndex }}
      onClick={handleOverlayClick}
      data-testid="drawer-overlay"
    >
      <div
        ref={drawerRef}
        id={drawerId.current}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${drawerId.current}-description` : undefined}
        className={cn(
          'fixed inset-y-0 flex flex-col bg-background shadow-2xl',
          'border-l border-border',
          sizeClasses[size],
          sideClasses[side],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        data-testid="drawer-content"
      >
        {ariaDescription && (
          <div id={`${drawerId.current}-description`} className="sr-only">
            {ariaDescription}
          </div>
        )}
        
        {headerContent && (
          <div className="shrink-0 relative border-b border-border">
            {headerContent}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="absolute top-3 right-3 h-8 w-8 p-0"
              data-testid="drawer-close-button"
              aria-label="Cerrar drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {footerContent && (
          <div className="shrink-0 border-t border-border" data-testid="drawer-footer">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
  
  return createPortal(content, document.body);
}

export default DrawerLayout;
