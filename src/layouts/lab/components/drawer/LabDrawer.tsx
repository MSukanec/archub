import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface LabDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'sm'| 'md'| 'lg'| 'xl';
}
const widthClasses = {
  sm: 'w-[320px]',
  md: 'w-[400px]',
  lg: 'w-[480px]',
  xl: 'w-[560px]',
};
export function LabDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'md',
}: LabDrawerProps) {
  if (!isOpen) return null;
  return (
    <div
      className={cn(
        'h-full border-l border-border bg-background flex flex-col',
        widthClasses[width]
      )}
    >
      {(title || subtitle) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div>
            {title && (
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            data-testid="button-close-drawer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
export default LabDrawer;
