import { AlertTriangle, X, Users, FolderOpen, DollarSign, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DataIssue } from '../types';

interface DataHealthAlertMultiProps {
  issues: DataIssue[];
  entityLabel?: string;
  isFiltering: boolean;
  onToggleFilter: () => void;
  showClearButton?: boolean;
}

const issueIcons: Record<string, typeof Users> = {
  'client-payments-without-client': Users,
  'payments-without-project': FolderOpen,
  'finances-invalid-exchange-rate': DollarSign,
  'payments-with-future-date': Calendar,
  'payments-without-category': Tag,
  'payments-without-concept': Tag,
  'payments-missing-exchange-rate': DollarSign,
};

const severityColors: Record<string, { borderVar: string; bgVar: string; textVar: string }> = {
  critical: {
    borderVar: '--error',
    bgVar: '--error',
    textVar: '--error'
  },
  warning: {
    borderVar: '--warning',
    bgVar: '--warning',
    textVar: '--warning'
  },
  info: {
    borderVar: '--info',
    bgVar: '--info',
    textVar: '--info'
  },
};

export function DataHealthAlertMulti({
  issues,
  entityLabel = 'elemento',
  isFiltering,
  onToggleFilter,
  showClearButton = false,
}: DataHealthAlertMultiProps) {
  if (issues.length === 0) return null;

  const totalAffected = issues.reduce((sum, issue) => sum + issue.affectedCount, 0);

  return (
    <div className="space-y-2">
      {issues.map((issue) => {
        const Icon = issueIcons[issue.ruleId] || AlertTriangle;
        const colorVars = severityColors[issue.severity] || severityColors.warning;
        
        return (
          <div 
            key={issue.id}
            className={cn(
              "flex items-center justify-between w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all border",
              "hover:opacity-90",
              isFiltering && "ring-2 ring-offset-1"
            )}
            style={{
              borderColor: `var(${colorVars.borderVar})`,
              backgroundColor: `color-mix(in srgb, var(${colorVars.bgVar}) 10%, transparent)`,
              color: `var(${colorVars.textVar})`
            }}
            onClick={onToggleFilter}
            data-testid={`data-health-alert-${issue.ruleId}`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium">
                  {issue.affectedCount} {issue.title.toLowerCase()}
                </span>
              </div>
            </div>
            {showClearButton && isFiltering && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFilter();
                }}
                data-testid={`clear-problems-filter-${issue.ruleId}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
      
      {isFiltering && (
        <div className="text-xs text-muted-foreground text-center">
          Mostrando solo {totalAffected} {entityLabel}{totalAffected !== 1 ? 's' : ''} con problemas
        </div>
      )}
    </div>
  );
}
