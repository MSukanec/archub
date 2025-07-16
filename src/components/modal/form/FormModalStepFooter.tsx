import React from 'react';
import { Button } from "@/components/ui/button";
import { StepModalFooterConfig } from './types';

interface FormModalStepFooterProps {
  config: StepModalFooterConfig;
  className?: string;
}

export function FormModalStepFooter({
  config,
  className = ""
}: FormModalStepFooterProps) {
  const { cancelAction, previousAction, nextAction, submitAction, customActions } = config;

  // Determinar el layout según las acciones disponibles
  const hasCancel = !!cancelAction;
  const hasPrevious = !!previousAction;
  const hasNext = !!nextAction;
  const hasSubmit = !!submitAction;
  const hasCustomActions = customActions && customActions.length > 0;

  return (
    <div className={`px-6 py-4 border-t border-[var(--card-border)] bg-[var(--card-bg)] ${className}`}>
      <div className="flex justify-between items-center gap-3">
        {/* Lado izquierdo: Cancelar */}
        <div className="flex gap-2">
          {hasCancel && (
            <Button
              variant="outline"
              onClick={cancelAction.onClick}
              disabled={cancelAction.disabled}
            >
              {cancelAction.loading ? 'Cargando...' : cancelAction.label}
            </Button>
          )}
        </div>

        {/* Lado derecho: Previous/Next/Submit/Custom */}
        <div className="flex gap-2">
          {hasPrevious && (
            <Button
              variant="secondary"
              onClick={previousAction.onClick}
              disabled={previousAction.disabled}
            >
              {previousAction.loading ? 'Cargando...' : previousAction.label}
            </Button>
          )}
          
          {hasNext && (
            <Button
              variant={nextAction.variant || "default"}
              onClick={nextAction.onClick}
              disabled={nextAction.disabled}
            >
              {nextAction.loading ? 'Cargando...' : nextAction.label}
            </Button>
          )}
          
          {hasSubmit && (
            <Button
              variant={submitAction.variant || "default"}
              onClick={submitAction.onClick}
              disabled={submitAction.disabled}
            >
              {submitAction.loading ? 'Cargando...' : submitAction.label}
            </Button>
          )}

          {hasCustomActions && customActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.loading ? 'Cargando...' : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}