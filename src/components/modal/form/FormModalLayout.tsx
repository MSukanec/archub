import React, { ReactNode, useEffect, useRef, useCallback, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalPanelStore } from "./modalPanelStore";
import FormModalBody from "./FormModalBody";
import { ModalErrorBoundary } from "../utils/ModalErrorBoundary";
import { ModalReadinessResult } from "../utils/modal-readiness";

interface FormModalLayoutProps {
  viewPanel?: ReactNode;
  editPanel?: ReactNode;
  subformPanel?: ReactNode;
  onClose: () => void;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  columns?: number;
  
  // PROPIEDADES EXISTENTES MEJORADAS
  /** Contenido para modales de pasos múltiples */
  stepContent?: ReactNode;
  /** Inicializar en modo edición automáticamente */
  isEditing?: boolean;
  /** Función para manejar submit con ENTER key */
  onSubmit?: () => void;
  /** Modal ancho (1200px en desktop) */
  wide?: boolean;
  /** Modal pantalla completa */
  fullscreen?: boolean;
  
  // NUEVAS PROPIEDADES AVANZADAS
  
  /** Estado de readiness del modal */
  readinessState?: ModalReadinessResult;
  
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
  forcedPanel?: 'view' | 'edit' | 'subform';
  
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
}

export function FormModalLayout({
  // Propiedades existentes
  viewPanel,
  editPanel,
  subformPanel,
  onClose,
  headerContent,
  footerContent,
  className,
  columns = 2,
  stepContent,
  isEditing = false,
  onSubmit,
  wide = false,
  fullscreen = false,
  
  // Nuevas propiedades avanzadas
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
}: FormModalLayoutProps) {
  
  const { currentPanel, setPanel } = useModalPanelStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  // Guardar el elemento activo antes de abrir el modal
  useEffect(() => {
    lastActiveElement.current = document.activeElement as HTMLElement;
    
    return () => {
      // Restaurar focus al elemento anterior cuando se cierre el modal
      if (lastActiveElement.current && lastActiveElement.current.focus) {
        setTimeout(() => {
          lastActiveElement.current?.focus();
        }, 0);
      }
    };
  }, []);

  // GESTIÓN DE PANEL MEJORADA
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

  // PREVENIR SCROLL DEL BODY
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // GESTIÓN DE ELEMENTOS FOCUSABLES PARA TRAP FOCUS
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
    
    // Actualizar lista cuando cambie el contenido
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(modalRef.current, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'aria-hidden']
    });

    return () => observer.disconnect();
  }, [trapFocus, effectivePanel]);

  // FOCUS INICIAL
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

    // Delay para asegurar que el DOM esté listo
    const timeoutId = setTimeout(setInitialFocus, 100);
    return () => clearTimeout(timeoutId);
  }, [initialFocusRef, autoFocusFirstInput, focusableElements, effectivePanel]);

  // LÓGICA DE CIERRE MEJORADA
  const attemptClose = useCallback(() => {
    // Verificar si se puede cerrar
    if (canClose && !canClose()) {
      onClosePrevented?.('Custom validation failed');
      return false;
    }

    // Verificar cambios sin guardar
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

    setIsClosing(true);
    setPanel('view');
    
    if (enableAnimations) {
      setTimeout(() => {
        onClose();
      }, 250); // Tiempo para animación (sincronizado con CSS duration-250)
    } else {
      onClose();
    }
  }, [attemptClose, setPanel, enableAnimations, onClose]);

  // MANEJO DE TECLADO MEJORADO
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC para cerrar
      if (event.key === 'Escape' && !preventEscapeClose) {
        event.preventDefault();
        handleClose();
        return;
      }

      // ENTER para submit (solo si readiness state permite)
      if (
        event.key === 'Enter' &&
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

      // TAB para trap focus
      if (event.key === 'Tab' && trapFocus && focusableElements.length > 0) {
        const currentIndex = focusableElements.indexOf(event.target as HTMLElement);
        
        if (event.shiftKey) {
          // Shift + Tab (hacia atrás)
          if (currentIndex <= 0) {
            event.preventDefault();
            focusableElements[focusableElements.length - 1]?.focus();
          }
        } else {
          // Tab (hacia adelante)
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

  // CLICK FUERA DEL MODAL
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (preventClickOutsideClose) return;
    
    if (event.target === overlayRef.current) {
      handleClose();
    }
  }, [preventClickOutsideClose, handleClose]);

  // OBTENER PANEL ACTUAL
  const getCurrentPanel = () => {
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

  // RENDERIZADO CON ERROR BOUNDARY Y MEJORAS DE ACCESSIBILITY - NUEVO LAYOUT DERECHA
  const modalContent = (
    <div 
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 bg-black/80",
        enableAnimations && !isClosing && "animate-in fade-in duration-75",
        enableAnimations && isClosing && "animate-out fade-out duration-75"
      )}
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
          // Base: fullscreen en mobile
          "fixed inset-0 flex flex-col bg-background shadow-lg transition ease-in-out duration-250",
          // Desktop: modal centrado con altura dinámica
          "md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-auto md:min-w-[500px] md:max-w-[90vw] md:max-h-[90vh] md:border md:rounded-lg",
          enableAnimations && !isClosing && "animate-in fade-in-0 zoom-in-95 md:slide-in-from-bottom-4 duration-200",
          enableAnimations && isClosing && "animate-out fade-out-0 zoom-out-95 md:slide-out-to-bottom-4 duration-200",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Descripción aria-describedby (oculta visualmente) */}
        {ariaDescription && (
          <div 
            id={`${modalId}-description`} 
            className="sr-only"
          >
            {ariaDescription}
          </div>
        )}

        {/* Indicador de cambios sin guardar */}
        {hasUnsavedChanges && (
          <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning">
              Tienes cambios sin guardar
            </span>
          </div>
        )}

        {/* Header */}
        {headerContent && (
          <div className="shrink-0 relative">
            {headerContent}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="absolute top-1/2 right-4 transform -translate-y-1/2"
              data-testid={`modal-close-button-${modalId}`}
              aria-label="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Current Panel Content con readiness gates */}
        <div className="flex-1 overflow-auto">
          {readinessState && !readinessState.isReady ? (
            <readinessState.LoadingGate>
              {/* Este contenido se muestra cuando no está ready */}
              <div className="p-8"></div>
            </readinessState.LoadingGate>
          ) : (
            <FormModalBody 
              columns={columns} 
              data-testid={`modal-body-${modalId}`}
            >
              {getCurrentPanel()}
            </FormModalBody>
          )}
        </div>

        {/* Footer */}
        {footerContent && (
          <div className="shrink-0" data-testid={`modal-footer-${modalId}`}>
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ModalErrorBoundary
      onClose={onClose}
      fallbackTitle="Error en Modal"
      fallbackDescription="Ha ocurrido un error al cargar este modal."
    >
      {modalContent}
    </ModalErrorBoundary>
  );
}
