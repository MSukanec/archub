import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { DataIssue } from '../types';
import { getRuleIcon } from '../rules/micro';

interface DataHealthDetailsModalProps {
  issue: DataIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const severityLabels: Record<string, string> = {
  critical: 'Crítico',
  warning: 'Advertencia',
  info: 'Información',
};

const severityVariants: Record<string, any> = {
  critical: 'default',
  warning: 'default',
  info: 'default',
};

export function DataHealthDetailsModal({
  issue,
  open,
  onOpenChange,
}: DataHealthDetailsModalProps) {
  if (!issue) return null;

  const Icon = getRuleIcon(issue.ruleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {Icon && <Icon className="h-6 w-6 mt-1 flex-shrink-0" />}
            <div className="flex-1">
              <DialogTitle className="text-xl">{issue.title}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge>
                  {severityLabels[issue.severity]}
                </Badge>
                <Badge>
                  {issue.affectedCount} afectado{issue.affectedCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {issue.description}
            </div>
          </div>

          {issue.affectedEntities && issue.affectedEntities.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-2">
                Elementos afectados ({issue.affectedEntities.length}
                {issue.affectedCount > issue.affectedEntities.length
                  ? ` de ${issue.affectedCount}`
                  : ''})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {issue.affectedEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="p-2 rounded bg-muted text-sm flex items-center justify-between"
                  >
                    <span>{entity.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {issue.recommendedAction && (
            <div className="border-t pt-4 bg-muted/50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1">Acción recomendada</h4>
              <p className="text-sm text-muted-foreground">
                {issue.recommendedAction.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
