import { ReactNode } from 'react';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DrawerHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  
  showBackButton?: boolean;
  onBackClick?: () => void;
  
  badge?: ReactNode;
  actions?: ReactNode;
  
  className?: string;
}

export function DrawerHeader({
  title,
  description,
  icon: Icon,
  iconClassName,
  showBackButton = false,
  onBackClick,
  badge,
  actions,
  className,
}: DrawerHeaderProps) {
  return (
    <div className={cn('px-6 py-4 pr-12', className)} data-testid="drawer-header">
      <div className="flex items-start gap-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="h-8 w-8 p-0 shrink-0"
            data-testid="drawer-back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        {Icon && (
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
            'bg-primary/10 text-primary',
            iconClassName
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {title}
            </h2>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="shrink-0 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default DrawerHeader;
