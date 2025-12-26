import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
interface ModalFooterProps {
  leftLabel?: string;
  onLeftClick?: () => void;
  rightLabel?: string;
  onRightClick?: () => void;
  
  middleLabel?: string;
  onMiddleClick?: () => void;
  middleVariant?: ButtonVariant;
  middleDisabled?: boolean;
  
  cancelText?: string;
  submitText?: string;
  onSubmit?: () => void;
  submitVariant?: ButtonVariant;
  submitDisabled?: boolean;
  showLoadingSpinner?: boolean;
  
  /** Estado de readiness del modal (from useModalReadiness) */
  readinessState?: {
    isReady: boolean;
    isLoading: boolean;
    hasError: boolean;
  };
  
  /** Función de validación custom para habilitar submit */
  canSubmit?: () => boolean;
  
  /** Estado de mutación/carga para prevenir double-submit */
  isSubmitting?: boolean;
  
  /** Referencia al formulario para validación automática */
  formRef?: React.RefObject<HTMLFormElement>;
  
  /** Hook de react-hook-form para validación automática */
  formState?: {
    isValid: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
    errors: Record<string, any>;
  };
  
  /** Callback cuando se intenta submit pero está deshabilitado */
  onDisabledSubmitAttempt?: (reason: string) => void;
  
  /** Prevenir submit con ENTER (para casos especiales) */
  preventEnterSubmit?: boolean;
  
  /** Mostrar contador de errores de validación */
  showValidationErrors?: boolean;
  
  /** Texto personalizado para loading state */
  loadingText?: string;
  
  /** Auto-focus en el botón submit cuando esté habilitado */
  autoFocusSubmit?: boolean;
  
  /** Tiempo mínimo de loading para evitar flickering */
  minLoadingTime?: number;
  
  /** Botones adicionales personalizados */
  customActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
  }>;
}
export function ModalFooter({
  leftLabel,
  onLeftClick,
  rightLabel,
  onRightClick,
  
  middleLabel,
  onMiddleClick,
  middleVariant = "destructive",
  middleDisabled = false,
  
  cancelText,
  submitText,
  onSubmit,
  submitVariant = "default",
  submitDisabled = false,
  showLoadingSpinner = false,
  
  readinessState,
  canSubmit,
  isSubmitting = false,
  formRef,
  formState,
  onDisabledSubmitAttempt,
  preventEnterSubmit = false,
  showValidationErrors = false,
  loadingText = 'Cargando...',
  autoFocusSubmit = false,
  minLoadingTime = 500,
  customActions = [],
}: ModalFooterProps) {
  
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [minLoadingActive, setMinLoadingActive] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const doubleSubmitTimeoutRef = useRef<NodeJS.Timeout>();
  
  const finalLeftLabel = cancelText || leftLabel;
  const finalRightLabel = submitText || rightLabel;
  const finalOnLeftClick = onLeftClick;
  const finalOnRightClick = onSubmit || onRightClick;
  
  const computeCanSubmit = useCallback((): boolean => {
    if (readinessState && (!readinessState.isReady || readinessState.hasError)) {
      return false;
    }
    
    if (isSubmitting || formState?.isSubmitting) {
      return false;
    }
    
    if (canSubmit && !canSubmit()) {
      return false;
    }
    
    if (formState && !formState.isValid) {
      return false;
    }
    
    if (submitDisabled) {
      return false;
    }
    
    return true;
  }, [readinessState, isSubmitting, formState, canSubmit, submitDisabled]);
  
  const currentCanSubmit = computeCanSubmit();
  
  const handleSubmitClick = useCallback(() => {
    const now = Date.now();
    
    if (now - lastSubmitTime < 1000) {
      console.warn('ModalFooter: Double-submit prevented');
      return;
    }
    
    if (!currentCanSubmit) {
      let reason = 'Unknown reason';
      if (readinessState && !readinessState.isReady) reason = 'Modal not ready';
      else if (readinessState && readinessState.hasError) reason = 'Modal has errors';
      else if (isSubmitting || formState?.isSubmitting) reason = 'Already submitting';
      else if (canSubmit && !canSubmit()) reason = 'Custom validation failed';
      else if (formState && !formState.isValid) reason = 'Form validation failed';
      else if (submitDisabled) reason = 'Submit disabled';
      
      onDisabledSubmitAttempt?.(reason);
      return;
    }
    
    setLastSubmitTime(now);
    
    if (minLoadingTime > 0) {
      setMinLoadingActive(true);
      doubleSubmitTimeoutRef.current = setTimeout(() => {
        setMinLoadingActive(false);
      }, minLoadingTime);
    }
    
    finalOnRightClick?.();
  }, [currentCanSubmit, lastSubmitTime, finalOnRightClick, onDisabledSubmitAttempt, readinessState, isSubmitting, formState, canSubmit, submitDisabled, minLoadingTime]);
  
  useEffect(() => {
    if (preventEnterSubmit) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Enter'&&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey &&
        currentCanSubmit
      ) {
        const activeElement = document.activeElement as HTMLElement;
        const isTextarea = activeElement?.tagName?.toLowerCase() === 'textarea';
        const isSelect = activeElement?.getAttribute('role') === 'combobox';
        
        if (!isTextarea && !isSelect) {
          event.preventDefault();
          handleSubmitClick();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preventEnterSubmit, currentCanSubmit, handleSubmitClick]);
  
  useEffect(() => {
    if (autoFocusSubmit && currentCanSubmit && submitButtonRef.current) {
      submitButtonRef.current.focus();
    }
  }, [autoFocusSubmit, currentCanSubmit]);
  
  useEffect(() => {
    return () => {
      if (doubleSubmitTimeoutRef.current) {
        clearTimeout(doubleSubmitTimeoutRef.current);
      }
    };
  }, []);
  
  const isLoading = showLoadingSpinner || isSubmitting || formState?.isSubmitting || readinessState?.isLoading || minLoadingActive;
  const loadingDisplay = isLoading ? loadingText : finalRightLabel;
  
  const validationErrorCount = showValidationErrors && formState?.errors 
    ? Object.keys(formState.errors).length 
    : 0;
  
  return (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto relative z-0">
      {showValidationErrors && validationErrorCount > 0 && (
        <div className="px-2 py-1 text-xs text-destructive bg-destructive/10 rounded mb-2">
          {validationErrorCount} error{validationErrorCount > 1 ? 'es': ''} de validación
        </div>
      )}
      
      <div className="flex gap-2 w-full">
        {customActions.map((action, index) => (
          <Button
            key={index}
            type="button"
            variant={action.variant || "outline"}
            onClick={action.onClick}
            disabled={action.disabled || (readinessState && !readinessState.isReady)}
            className="flex-1"
          >
            {action.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando...
              </>
            ) : (
              <>
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </>
            )}
          </Button>
        ))}
        
        {finalLeftLabel && finalOnLeftClick ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={finalOnLeftClick}
              className={middleLabel && onMiddleClick ? "w-1/4" : finalRightLabel ? "w-1/4" : "w-full"}
              disabled={isLoading && readinessState?.isLoading}
            >
              {finalLeftLabel}
            </Button>
            
            {middleLabel && onMiddleClick && (
              <Button
                type="button"
                variant={middleVariant}
                onClick={onMiddleClick}
                className="w-2/4"
                disabled={middleDisabled || isLoading}
              >
                {middleLabel}
              </Button>
            )}
            
            {finalRightLabel && (
              <Button
                ref={submitButtonRef}
                type="button"
                variant={submitVariant}
                onClick={handleSubmitClick}
                className={middleLabel && onMiddleClick ? "w-1/4" : "w-3/4"}
                disabled={!currentCanSubmit}
                data-testid="modal-submit-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {loadingDisplay}
                  </>
                ) : (
                  loadingDisplay
                )}
              </Button>
            )}
          </>
        ) : (
          <Button
            ref={submitButtonRef}
            type="button"
            variant={submitVariant}
            onClick={handleSubmitClick}
            className="w-full"
            disabled={!currentCanSubmit}
            data-testid="modal-submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {loadingDisplay}
              </>
            ) : (
              loadingDisplay
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
export { ModalFooter as FormModalFooter };
