import { AlertTriangle, Users, FolderOpen, DollarSign, Calendar, Tag } from 'lucide-react';
import { Callout } from '@/components/shared/Callout';
import type { DataIssue } from '../types';

interface DataHealthAlertMultiProps {
  issues: DataIssue[];
  entityLabel?: string;
  activeFilterIssueId?: string | null;
  onToggleFilter: (issueId: string) => void;
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

const severityColors: Record<string, string> = {
  critical: 'var(--error)',
  warning: 'var(--warning)',
  info: 'var(--info)',
};

export function DataHealthAlertMulti({
  issues,
  entityLabel = 'elemento',
  activeFilterIssueId,
  onToggleFilter,
  showClearButton = false,
}: DataHealthAlertMultiProps) {
  if (issues.length === 0) return null;

  const isFiltering = !!activeFilterIssueId;
  const filteredIssue = issues.find(i => i.id === activeFilterIssueId);
  const totalAffected = filteredIssue?.affectedCount || 0;

  return (
    <div className="space-y-2">
      {issues.map((issue) => {
        const Icon = issueIcons[issue.ruleId] || AlertTriangle;
        const bgColor = severityColors[issue.severity] || severityColors.warning;
        const isThisIssueFiltered = activeFilterIssueId === issue.id;
        
        return (
          <Callout
            key={issue.id}
            icon={Icon}
            text={`${issue.affectedCount} ${issue.title.toLowerCase()}`}
            backgroundColor={bgColor}
            button={isThisIssueFiltered ? {
              label: 'Filtro activo',
              onClick: () => onToggleFilter(issue.id)
            } : undefined}
            onClose={() => onToggleFilter(issue.id)}
            onClick={() => onToggleFilter(issue.id)}
          />
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
