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
    <div className={`p-2 border-t border-[var(--card-border)] mt-auto ${className}`}>
      <div className="flex gap-2 w-full">
        {hasCancel && (
          <Button
            variant="secondary"
            onClick={cancelAction.onClick}
            disabled={cancelAction.disabled}
            className="w-1/4"
          >
            {cancelAction.loading ? 'Cargando...' : cancelAction.label}
          </Button>
        )}
        
        <div className="flex gap-2 w-3/4">
          {hasPrevious && (
            <Button
              variant="secondary"
              onClick={previousAction.onClick}
              disabled={previousAction.disabled}
              className="flex-1"
            >
              {previousAction.loading ? 'Cargando...' : previousAction.label}
            </Button>
          )}
          
          {hasNext && (
            <Button
              variant={nextAction.variant || "default"}
              onClick={nextAction.onClick}
              disabled={nextAction.disabled}
              className="flex-1"
            >
              {nextAction.loading ? 'Cargando...' : nextAction.label}
            </Button>
          )}
          
          {hasSubmit && (
            <Button
              variant={submitAction.variant || "default"}
              onClick={submitAction.onClick}
              disabled={submitAction.disabled}
              className="flex-1"
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
              className="flex-1"
            >
              {action.loading ? 'Cargando...' : action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}