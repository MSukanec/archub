import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StepModalConfig } from './types';

interface FormModalStepHeaderProps {
  title: string;
  icon?: LucideIcon;
  stepConfig?: StepModalConfig;
  className?: string;
}

export function FormModalStepHeader({
  title,
  icon: Icon,
  stepConfig,
  className = ""
}: FormModalStepHeaderProps) {
  return (
    <div className={`px-4 py-3 border-b border-[var(--card-border)] ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className="h-5 w-5 text-[var(--accent)]" />
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {stepConfig && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                Paso {stepConfig.currentStep} de {stepConfig.totalSteps}
              </p>
              {stepConfig.stepTitle && (
                <>
                  <span className="text-sm text-muted-foreground">•</span>
                  <p className="text-sm text-muted-foreground">
                    {stepConfig.stepTitle}
                  </p>
                </>
              )}
            </div>
          )}
          {stepConfig?.stepDescription && (
            <p className="text-xs text-muted-foreground mt-1">
              {stepConfig.stepDescription}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}