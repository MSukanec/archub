import type { DataIssue } from '../types';
import { getRuleIcon } from '../rules/micro';
import { Badge } from '@/components/ui/badge';
import type { BadgeVariant } from '@/components/ui/badge';

interface DataHealthDetailsContentProps {
  issue: DataIssue;
}

const severityLabels: Record<string, string> = {
  critical: 'Crítico',
  warning: 'Advertencia',
  info: 'Información',
};

const severityVariants: Record<string, BadgeVariant> = {
  critical: 'error',
  warning: 'warning',
  info: 'info',
};

export function DataHealthDetailsContent({ issue }: DataHealthDetailsContentProps) {
  const Icon = getRuleIcon(issue.ruleId);
  const variant = severityVariants[issue.severity] || 'neutral';

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div 
            className="p-2 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: `color-mix(in srgb, var(--${issue.severity === 'critical' ? 'error' : issue.severity}) 10%, transparent)`,
              color: `var(--${issue.severity === 'critical' ? 'error' : issue.severity})`,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-foreground capitalize">{issue.title}</h3>
          <div className="flex gap-2 mt-2">
            <Badge variant={variant}>
              {severityLabels[issue.severity]}
            </Badge>
            <Badge variant="neutral">
              {issue.affectedCount} afectado{issue.affectedCount !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div 
          className="text-sm leading-relaxed text-foreground bg-muted/50 p-4 rounded-lg [&_strong]:font-semibold [&_strong]:text-foreground"
          dangerouslySetInnerHTML={{ 
            __html: issue.description
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>')
          }}
        />

        {issue.recommendedAction && (
          <div className="border-t pt-4">
            <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-1 text-accent">
                {issue.recommendedAction.label}
              </h4>
              <p className="text-sm text-muted-foreground">
                {issue.recommendedAction.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
