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
    <div className={`px-3 py-3 border-b border-[var(--card-border)] ${className}`}>
        {Icon && (
        )}
            {title}
          </h2>
          {stepConfig && (
              Paso {stepConfig.currentStep} de {stepConfig.totalSteps}
              {stepConfig.stepTitle && ` • ${stepConfig.stepTitle}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}