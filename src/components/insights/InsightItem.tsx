import { type Insight } from './types';
import { type InsightItem as ContainerInsightItem } from '../InsightCard';
import * as LucideIcons from 'lucide-react';

type InsightVariant = 'info' | 'warning' | 'success' | 'danger';

function mapTypeToVariant(type: Insight['type']): InsightVariant {
  switch (type) {
    case 'info': return 'info';
    case 'warning': return 'warning';
    case 'alert': return 'danger';
    default: return 'info';
  }
}

function getIconElement(iconName: string, className?: string) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  
  if (!IconComponent) {
    return <LucideIcons.Lightbulb className={className} />;
  }
  
  return <IconComponent className={className} />;
}

export function toInsightItems(insights: Insight[]): ContainerInsightItem[] {
  return insights.map(insight => {
    let fullDescription = insight.description;
    
    if (insight.context) {
      fullDescription += ` ${insight.context}`;
    }
    
    if (insight.actionHint) {
      fullDescription += ` → ${insight.actionHint}`;
    }
    
    return {
      title: insight.title,
      description: fullDescription,
      variant: mapTypeToVariant(insight.type),
      icon: getIconElement(insight.icon, 'h-3 w-3'),
      actions: insight.actions
    };
  });
}
