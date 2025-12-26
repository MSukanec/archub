import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StepModalConfig } from '../factory/types';
interface ModalStepHeaderProps {
  title: string;
  icon?: LucideIcon;
  stepConfig?: StepModalConfig;
  className?: string;
}
export function ModalStepHeader({
  title,
  icon: Icon,
  stepConfig,
  className = ""
}: ModalStepHeaderProps) {
  return (
    <div className={`px-3 py-3 border-b border-[var(--card-border)] ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className="h-4 w-4 text-[var(--accent)]" />
        )}
        <div className="flex-1 pr-2">
          <h2 className="text-sm font-medium text-[var(--card-fg)]">
            {title}
          </h2>
          {stepConfig && (
            <p className="text-xs text-[var(--text-muted)] leading-tight">
              Paso {stepConfig.currentStep} de {stepConfig.totalSteps}
              {stepConfig.stepTitle && ` • ${stepConfig.stepTitle}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
export { ModalStepHeader as FormModalStepHeader };
