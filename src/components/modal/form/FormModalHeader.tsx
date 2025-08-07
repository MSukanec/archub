import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FormModalHeaderProps {
  title?: string;
  description?: string; // Agregando descripción como en el legacy
  icon?: LucideIcon;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  className?: string;
}

export function FormModalHeader({
  title,
  description,
  icon: Icon,
  leftActions,
  rightActions,
  className,
}: FormModalHeaderProps) {
  return (
    <div className={cn("px-3 py-3 flex items-center justify-between border-b border-[var(--card-border)]", className)}>
        {leftActions}
        {title && (
            {Icon && (
            )}
              {description && (
                  {description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
        {rightActions}
      </div>
    </div>
  );
}