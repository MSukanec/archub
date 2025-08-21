import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalPanelStore } from "./modalPanelStore";
import FormModalBody from "./FormModalBody";

interface FormModalLayoutProps {
  viewPanel?: ReactNode;
  editPanel?: ReactNode;
  subformPanel?: ReactNode;
  onClose: () => void;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  columns?: number;
  // Nueva prop para modales de pasos
  stepContent?: ReactNode;
  // Prop para inicializar en modo edición
  isEditing?: boolean;
  // Función para manejar el submit con ENTER
  onSubmit?: () => void;
  // Prop para controlar el ancho del modal (similar al Layout)
  wide?: boolean;
}

export function FormModalLayout({
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
}: FormModalLayoutProps) {
  const { currentPanel, setPanel } = useModalPanelStore();

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Inicializar en modo edición si isEditing es true
  useEffect(() => {
    if (isEditing) {
      setPanel('edit');
    } else {
      setPanel('view');
    }
  }, [isEditing, setPanel]);

  // Manejar ENTER para submit global
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo procesar ENTER si hay función de submit y no estamos en un textarea
      if (event.key === 'Enter' && onSubmit && 
          (event.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        onSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSubmit]);

  // Reset panel al cerrar modal
  const handleClose = () => {
    setPanel('view');
    onClose();
  };

  const getCurrentPanel = () => {
    // Si stepContent está definido, úsalo en lugar de las lógicas de panel
    if (stepContent) {
      return stepContent;
    }
    
    switch (currentPanel) {
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

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
    >
      <div
        data-modal-content
        className={cn(
          "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl",
          "w-full h-full rounded-none", // Mobile: full viewport
          // Desktop width control based on wide prop
          wide 
            ? "md:w-[1200px] md:h-auto md:max-h-[90vh] md:rounded-lg md:mx-auto md:my-12" // WIDE: fixed 1200px
            : "md:w-[600px] md:h-auto md:max-h-[90vh] md:rounded-lg md:mx-auto md:my-12", // DEFAULT: fixed 600px
          "flex flex-col overflow-auto",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {headerContent && (
          <div className="shrink-0 relative">
            {headerContent}
            <Button
              variant="ghost-flat"
              size="icon-sm"
              onClick={handleClose}
              className="absolute top-1/2 right-4 transform -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Current Panel Content */}
        <FormModalBody columns={columns}>{getCurrentPanel()}</FormModalBody>

        {/* Footer */}
        {footerContent && (
          <div className="shrink-0">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
