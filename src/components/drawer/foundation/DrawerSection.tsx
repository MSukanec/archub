import { ReactNode } from 'react';
import { LucideIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
export interface DrawerSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  
  collapsible?: boolean;
  defaultExpanded?: boolean;
  
  actions?: ReactNode;
  badge?: ReactNode;
  
  className?: string;
  contentClassName?: string;
}
export function DrawerSection({
  title,
  icon: Icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  actions,
  badge,
  className,
  contentClassName,
}: DrawerSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const handleToggle = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <div className={cn('border-b border-border last:border-b-0', className)}>
      <div
        className={cn(
          'px-6 py-3 flex items-center gap-2',
          collapsible && 'cursor-pointer hover:bg-muted/50 transition-colors'
        )}
        onClick={handleToggle}
        role={collapsible ? 'button': undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
      >
        {collapsible && (
          <span className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
        
        <span className="text-sm font-medium text-foreground flex-1">
          {title}
        </span>
        
        {badge}
        
        {actions && !collapsible && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>
      
      {(!collapsible || isExpanded) && (
        <div className={cn('px-6 pb-4', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
export default DrawerSection;
