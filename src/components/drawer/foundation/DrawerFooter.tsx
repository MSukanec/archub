import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DrawerFooterProps {
  leftLabel?: string;
  onLeftClick?: () => void;
  leftVariant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  leftDisabled?: boolean;
  
  submitText?: string;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  
  children?: ReactNode;
  className?: string;
}

export function DrawerFooter({
  leftLabel = 'Cancelar',
  onLeftClick,
  leftVariant = 'outline',
  leftDisabled = false,
  submitText,
  onSubmit,
  submitDisabled = false,
  submitLoading = false,
  children,
  className,
}: DrawerFooterProps) {
  if (children) {
    return (
      <div 
        className={cn('px-6 py-4', className)}
        data-testid="drawer-footer-content"
      >
        {children}
      </div>
    );
  }
  
  return (
    <div 
      className={cn('px-6 py-4 flex gap-3', className)}
      data-testid="drawer-footer-buttons"
    >
      {onLeftClick && (
        <Button
          type="button"
          variant={leftVariant}
          onClick={onLeftClick}
          disabled={leftDisabled}
          className="flex-1"
          data-testid="drawer-cancel-button"
        >
          {leftLabel}
        </Button>
      )}
      
      {submitText && onSubmit && (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled || submitLoading}
          className="flex-[2]"
          data-testid="drawer-submit-button"
        >
          {submitLoading ? 'Procesando...' : submitText}
        </Button>
      )}
    </div>
  );
}

export default DrawerFooter;
