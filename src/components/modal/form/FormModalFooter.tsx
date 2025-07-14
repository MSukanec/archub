import React, { ReactNode } from 'react';

interface FormModalFooterProps {
  leftButton: ReactNode;
  rightButton: ReactNode;
}

export function FormModalFooter({
  leftButton,
  rightButton,
}: FormModalFooterProps) {
  return (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto">
      <div className="flex gap-2 w-full">
        <div className="w-1/4">
          {leftButton}
        </div>
        <div className="w-3/4">
          {rightButton}
        </div>
      </div>
    </div>
  );
}