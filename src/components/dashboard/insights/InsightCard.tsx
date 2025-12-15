import { Card } from '@/components/ui/card';
import { type Insight } from './types';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: Insight;
  className?: string;
}

const typeStyles = {
  info: {
    container: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  warning: {
    container: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400'
  },
  alert: {
    container: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-400'
  }
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[name];
  
  if (!IconComponent) {
    return <LucideIcons.Lightbulb className={className} />;
  }
  
  return <IconComponent className={className} />;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const styles = typeStyles[insight.type];
  
  return (
    <Card 
      className={cn(
        'p-4 border-0 shadow-sm',
        styles.container,
        className
      )}
      data-testid={`insight-card-${insight.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          <DynamicIcon name={insight.icon} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-tight mb-1">
            {insight.title}
          </h4>
          <p className="text-xs opacity-80 leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </Card>
  );
}
