import { ReactNode } from 'react';
import { AppCard } from '@/components/shared/AppCard';
import { Button } from '@/components/ui/button';
import { Info, AlertTriangle, CheckCircle2, XCircle, LucideIcon, ChevronRight } from 'lucide-react';
import { type InsightAction } from './insights/types';

type InsightVariant = 'info' | 'warning' | 'success' | 'danger';

function highlightValues(text: string): ReactNode {
  const pattern = /(\$[\d.,]+|~?\d+(?:[.,]\d+)?%|~\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:meses?|días?|pagos?|veces?))/gi;
  const parts = text.split(pattern);
  
  if (parts.length === 1) return text;
  
  return parts.map((part, i) => {
    if (!part) return null;
    if (i % 2 === 1) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export interface InsightItem {
  icon?: ReactNode;
  title: string;
  description?: string;
  variant?: InsightVariant;
  actions?: InsightAction[];
}

export interface InsightCardProps {
  title?: string;
  titleIcon?: ReactNode;
  icon?: ReactNode;
  description?: string;
  items?: InsightItem[];
  insights?: InsightItem[];
  emptyText?: string;
  className?: string;
  onAction?: (action: InsightAction) => void;
  dismissedIds?: Set<string>;
  onDismiss?: (issueId: string) => void;
  'data-testid'?: string;
}

const variantStyles: Record<InsightVariant, { borderVar: string; icon: LucideIcon; iconClass: string }> = {
  info: {
    borderVar: 'var(--info-neutral)',
    icon: Info,
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    borderVar: 'var(--warning)',
    icon: AlertTriangle,
    iconClass: 'text-yellow-600 dark:text-yellow-400',
  },
  success: {
    borderVar: 'var(--success)',
    icon: CheckCircle2,
    iconClass: 'text-green-600 dark:text-green-400',
  },
  danger: {
    borderVar: 'var(--destructive)',
    icon: XCircle,
    iconClass: 'text-red-600 dark:text-red-400',
  },
};

export function InsightCard({
  title,
  titleIcon,
  icon,
  description,
  items,
  insights,
  emptyText,
  className,
  onAction,
  'data-testid': testId,
}: InsightCardProps) {
  const resolvedIcon = icon || titleIcon;
  const resolvedItems = items || insights || [];
  const safeItems = resolvedItems || [];
  
  return (
    <AppCard 
      title={title} 
      icon={resolvedIcon} 
      description={description}
      className={className} 
      data-testid={testId}
    >
      {safeItems.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {emptyText || 'No hay insights disponibles en este momento'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {safeItems.map((item, index) => {
            const variant = item.variant || 'info';
            const styles = variantStyles[variant];
            const IconComponent = styles.icon;

            return (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border"
                style={{ borderColor: styles.borderVar }}
                data-testid={`${testId}-item-${index}`}
              >
                <div className="mt-0.5" style={{ color: styles.borderVar }}>
                  {item.icon || <IconComponent className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  {item.description && (
                    <p className="text-xs text-muted-foreground/80 mt-0.5">
                      {highlightValues(item.description)}
                    </p>
                  )}
                  {item.actions && item.actions.length > 0 && onAction && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.actions.map((action) => (
                        <Button
                          key={action.id}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => onAction(action)}
                          data-testid={`${testId}-action-${action.id}`}
                        >
                          {action.label}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppCard>
  );
}
