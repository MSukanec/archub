import { ReactNode, useEffect, useRef, useCallback, useState, cloneElement, isValidElement } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalPanelStore } from "../state/panelStore";
import ModalBody from "./ModalBody";
import { ModalErrorBoundary } from "../utils/ModalErrorBoundary";
import { ModalReadinessState } from "../utils/modal-readiness";
export type ModalSize = 'sm'| 'md'| 'lg'| 'xl'| 'full';
const sizeClasses: Record<ModalSize, string> = {
  sm: 'md:max-w-[400px]',
  md: 'md:max-w-[550px] md:min-w-[450px]',
  lg: 'md:max-w-[750px] md:min-w-[600px]',
  xl: 'md:max-w-[1000px] md:min-w-[800px]',
  full: 'md:max-w-none md:min-w-0 md:w-screen md:h-screen md:rounded-none',
};
interface ModalLayoutProps {
  /** Direct children content (new simplified API) */
  children?: ReactNode;
  
  viewPanel?: ReactNode;
  editPanel?: ReactNode;
  subformPanel?: ReactNode;
  onClose: () => void;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  /** Número de columnas en desktop (1 por defecto, mobile siempre 1) */
  columns?: 1 | 2;
  
  /** Contenido para modales de pasos múltiples */
  stepContent?: ReactNode;
  /** Inicializar en modo edición automáticamente */
  isEditing?: boolean;
  /** Función para manejar submit con ENTER key */
  onSubmit?: () => void;
  
  /** Size variant for the modal: 'sm'| 'md'| 'lg'| 'xl'| 'full'*/
  size?: ModalSize;
  
  /** @deprecated Use size="xl" instead. Modal ancho (1000px en desktop) */
  wide?: boolean;
  /** @deprecated Use size="full" instead. Modal pantalla completa */
  fullscreen?: boolean;
  
  /** Estado de readiness del modal */
  readinessState?: ModalReadinessState;
  
  /** Prevenir cierre con ESC key */
  preventEscapeClose?: boolean;
  
  /** Prevenir cierre al hacer click fuera del modal */
  preventClickOutsideClose?: boolean;
  
  /** Función de validación para permitir cierre */
  canClose?: () => boolean;
  
  /** Callback cuando se intenta cerrar pero está bloqueado */
  onClosePrevented?: (reason: string) => void;
  
  /** Auto-focus en el primer input cuando se abre */
  autoFocusFirstInput?: boolean;
  
  /** Elemento específico para hacer focus inicial */
  initialFocusRef?: React.RefObject<HTMLElement>;
  
  /** Mantener focus dentro del modal (trap focus) */
  trapFocus?: boolean;
  
  /** Callback cuando cambia el panel activo */
  onPanelChange?: (panel: string) => void;
  
  /** Forzar panel específico (override del store) */
  forcedPanel?: 'view'| 'edit'| 'subform';
  
  /** Mostrar indicador de cambios sin guardar */
  hasUnsavedChanges?: boolean;
  
  /** Mensaje personalizado para cambios sin guardar */
  unsavedChangesMessage?: string;
  
  /** Animaciones habilitadas */
  enableAnimations?: boolean;
  
  /** ID único del modal para debugging y accessibility */
  modalId?: string;
  
  /** Título del modal para accessibility */
  ariaLabel?: string;
  
  /** Descripción del modal para accessibility */
  ariaDescription?: string;
  
  /** Use drawer pattern on mobile devices (slide up from bottom) */
  mobileDrawer?: boolean;
  
  /** Position in the modal stack (for z-index calculation) */
  stackIndex?: number;
}
export function ModalLayout({
  children,
  viewPanel,
  editPanel,
  subformPanel,
  onClose,
  headerContent,
  footerContent,
  className,
  columns = 1,
  stepContent,
  isEditing = false,
  onSubmit,
  size,
  wide = false,
  fullscreen = false,
  
  readinessState,
  preventEscapeClose = false,
  preventClickOutsideClose = true,
  canClose,
  onClosePrevented,
  autoFocusFirstInput = false,
  initialFocusRef,
  trapFocus = true,
  onPanelChange,
  forcedPanel,
  hasUnsavedChanges = false,
  unsavedChangesMessage = "Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?",
  enableAnimations = true,
  modalId = `modal-${Date.now()}`,
  ariaLabel,
  ariaDescription,
  mobileDrawer = false,
  stackIndex = 0,
}: ModalLayoutProps) {
  
  const { currentPanel, setPanel } = useModalPanelStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const resolvedSize: ModalSize = size || (fullscreen ? 'full': wide ? 'xl': 'lg');
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  useEffect(() => {
    lastActiveElement.current = document.activeElement as HTMLElement;
    
    return () => {
      if (lastActiveElement.current && lastActiveElement.current.focus) {
        setTimeout(() => {
          lastActiveElement.current?.focus();
        }, 0);
      }
    };
  }, []);
  const effectivePanel = forcedPanel || currentPanel;
  
  useEffect(() => {
    if (forcedPanel && forcedPanel !== currentPanel) {
      setPanel(forcedPanel);
    }
  }, [forcedPanel, currentPanel, setPanel]);
  useEffect(() => {
    if (isEditing && !forcedPanel) {
      setPanel('edit');
    } else if (!isEditing && !forcedPanel) {
      setPanel('view');
    }
  }, [isEditing, forcedPanel, setPanel]);
  useEffect(() => {
    if (onPanelChange) {
      onPanelChange(effectivePanel);
    }
  }, [effectivePanel, onPanelChange]);
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  useEffect(() => {
    if (!trapFocus || !modalRef.current) return;
    const updateFocusableElements = () => {
      const modal = modalRef.current;
      if (!modal) return;
      const focusableSelectors = [
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(', ');
      const elements = Array.from(modal.querySelectorAll(focusableSelectors)) as HTMLElement[];
      setFocusableElements(elements.filter(el => {
        return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
      }));
    };
    updateFocusableElements();
    
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(modalRef.current, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
    });
    return () => observer.disconnect();
  }, [trapFocus, effectivePanel]);
  useEffect(() => {
    const setInitialFocus = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (autoFocusFirstInput && focusableElements.length > 0) {
        const firstInput = focusableElements.find(el => 
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) &&
          el.getAttribute('type') !== 'hidden'
        );
        if (firstInput) {
          firstInput.focus();
        } else {
          focusableElements[0]?.focus();
        }
      }
    };
    const timeoutId = setTimeout(setInitialFocus, 100);
    return () => clearTimeout(timeoutId);
  }, [initialFocusRef, autoFocusFirstInput, focusableElements, effectivePanel]);
  const attemptClose = useCallback(() => {
    if (canClose && !canClose()) {
      onClosePrevented?.('Custom validation failed');
      return false;
    }
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(unsavedChangesMessage);
      if (!confirmed) {
        onClosePrevented?.('Unsaved changes confirmation cancelled');
        return false;
      }
    }
    return true;
  }, [canClose, hasUnsavedChanges, unsavedChangesMessage, onClosePrevented]);
  const handleClose = useCallback(() => {
    if (!attemptClose()) return;
    setPanel('view');
    onClose();
  }, [attemptClose, setPanel, onClose]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape'&& !preventEscapeClose) {
        event.preventDefault();
        handleClose();
        return;
      }
      if (
        event.key === 'Enter'&&
        onSubmit &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        (!readinessState || readinessState.isReady)
      ) {
        const activeElement = event.target as HTMLElement;
        const isTextarea = activeElement?.tagName?.toLowerCase() === 'textarea';
        const isSelect = activeElement?.getAttribute('role') === 'combobox';
        const isButton = activeElement?.tagName?.toLowerCase() === 'button';
        
        if (!isTextarea && !isSelect && !isButton) {
          event.preventDefault();
          onSubmit();
        }
      }
      if (event.key === 'Tab'&& trapFocus && focusableElements.length > 0) {
        const currentIndex = focusableElements.indexOf(event.target as HTMLElement);
        
        if (event.shiftKey) {
          if (currentIndex <= 0) {
            event.preventDefault();
            focusableElements[focusableElements.length - 1]?.focus();
          }
        } else {
          if (currentIndex >= focusableElements.length - 1) {
            event.preventDefault();
            focusableElements[0]?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    preventEscapeClose,
    handleClose,
    onSubmit,
    readinessState,
    trapFocus,
    focusableElements,
  ]);
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (preventClickOutsideClose) return;
    
    if (event.target === overlayRef.current) {
      handleClose();
    }
  }, [preventClickOutsideClose, handleClose]);
  const getCurrentPanel = () => {
    if (children) {
      return children;
    }
    
    if (stepContent) {
      return stepContent;
    }
    
    switch (effectivePanel) {
      case "view":
        return viewPanel;
      case "edit":
        return editPanel;
      case "subform":
        return subformPanel;
      default:
        return viewPanel;
    }
  };
  const isFullSize = resolvedSize === 'full';
  const calculatedZIndex = 50 + stackIndex * 10;
  const overlayOpacity = Math.min(0.8, 0.5 + stackIndex * 0.1);
  const modalContent = (
    <div 
      ref={overlayRef}
      className={cn(
        "fixed inset-0",
        enableAnimations && "animate-in fade-in duration-200 ease-out"
      )}
      style={{ 
        zIndex: calculatedZIndex,
        backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
      }}
      onClick={handleOverlayClick}
      data-testid={`modal-overlay-${modalId}`}
    >
      <div
        ref={modalRef}
        id={modalId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${modalId}-description` : undefined}
        data-modal-content
        data-testid={`modal-content-${modalId}`}
        className={cn(
          "fixed flex flex-col bg-background shadow-2xl overflow-hidden",
          "inset-0 w-full h-full",
          "pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]",
          "pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          !isFullSize && [
            "md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2",
            "md:w-auto md:h-auto md:max-h-[90vh] md:border md:rounded-lg",
            "md:pb-0 md:pt-0 md:pl-0 md:pr-0",
          ],
          isFullSize && [
            "md:inset-0 md:w-screen md:h-screen md:rounded-none md:border-none",
          ],
          sizeClasses[resolvedSize],
          enableAnimations && [
            "animate-in fade-in-0 zoom-in-95 duration-200 ease-out",
            mobileDrawer && "slide-in-from-bottom-full md:slide-in-from-bottom-0",
          ],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {ariaDescription && (
          <div 
            id={`${modalId}-description`} 
            className="sr-only"
          >
            {ariaDescription}
          </div>
        )}
        {hasUnsavedChanges && (
          <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning">
              Tienes cambios sin guardar
            </span>
          </div>
        )}
        <div className="shrink-0 relative">
          {headerContent && (
            <>
              {isValidElement(headerContent) ? (
                cloneElement(headerContent, {
                  ...(effectivePanel === 'subform'&& {
                    showBackButton: (headerContent.props as any).showBackButton ?? true,
                    onBackClick: (headerContent.props as any).onBackClick ?? (() => setPanel('edit')),
                  }),
                } as any)
              ) : (
                headerContent
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-3 right-3 h-8 w-8 p-0 flex items-center justify-center"
            data-testid={`modal-close-button-${modalId}`}
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {readinessState && !readinessState.isReady ? (
          <div className="flex-1 overflow-y-auto">
            <readinessState.LoadingGate>
              <div className="p-8"></div>
            </readinessState.LoadingGate>
          </div>
        ) : children ? (
          // Nueva API: children ya contiene la estructura (ModalBody, etc)
          // No envolver en div con overflow porque ModalBody ya lo tiene
          children
        ) : (
          // Vieja API: envolver en ModalBody con scroll
          <div className="flex-1 overflow-y-auto">
            <ModalBody 
              columns={columns} 
              data-testid={`modal-body-${modalId}`}
            >
              {getCurrentPanel()}
            </ModalBody>
          </div>
        )}
        {footerContent && (
          <div className="shrink-0" data-testid={`modal-footer-${modalId}`}>
            {effectivePanel === 'subform'&& isValidElement(footerContent) ? (
              cloneElement(footerContent, {
                onLeftClick: () => setPanel('edit'),
                onRightClick: (footerContent.props as any).onRightClick 
                  ? () => {
                      (footerContent.props as any).onRightClick?.();
                      setPanel('edit');
                    }
                  : undefined,
                onSubmit: (footerContent.props as any).onSubmit
                  ? () => {
                      (footerContent.props as any).onSubmit?.();
                      setPanel('edit');
                    }
                  : undefined,
              } as any)
            ) : (
              footerContent
            )}
          </div>
        )}
      </div>
    </div>
  );
  if (!isMounted) {
    return null;
  }
  return createPortal(
    <ModalErrorBoundary
      onClose={onClose}
      fallbackTitle="Error en Modal"
      fallbackDescription="Ha ocurrido un error al cargar este modal."
    >
      {modalContent}
    </ModalErrorBoundary>,
    document.body
  );
}
export { ModalLayout as FormModalLayout };
