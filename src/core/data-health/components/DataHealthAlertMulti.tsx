import { ChevronRight } from 'lucide-react';
import { Callout } from '@/components/shared/Callout';
import type { DataIssue } from '../types';
import { getRuleIcon } from '../rules/micro';
import { useGlobalModalStore } from '@/components/modal';

interface DataHealthAlertMultiProps {
  issues: DataIssue[];
  entityLabel?: string;
  activeFilterIssueId?: string | null;
  onToggleFilter: (issueId: string) => void;
  dismissedIssueIds?: Set<string>;
  onDismissIssue?: (issueId: string) => void;
}

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
  dismissedIssueIds = new Set(),
  onDismissIssue,
}: DataHealthAlertMultiProps) {
  const openModal = useGlobalModalStore((state) => state.openModal);
  
  const visibleIssues = issues.filter(issue => !dismissedIssueIds.has(issue.id));
  
  if (visibleIssues.length === 0) return null;

  const isFiltering = !!activeFilterIssueId;
  const filteredIssue = issues.find(i => i.id === activeFilterIssueId);
  const totalAffected = filteredIssue?.affectedCount || 0;

  const handleOpenDetails = (issue: DataIssue) => {
    openModal('data-health-details', { issue });
  };

  return (
    <div className="space-y-2">
      {visibleIssues.map((issue) => {
        const Icon = getRuleIcon(issue.ruleId);
        const bgColor = severityColors[issue.severity] || severityColors.warning;
        const isThisIssueFiltered = activeFilterIssueId === issue.id;
        
        return (
          <div key={issue.id} className="flex gap-2 items-center">
            <Callout
              icon={Icon}
              text={`${issue.affectedCount} ${issue.title.toLowerCase()}`}
              backgroundColor={bgColor}
              button={isThisIssueFiltered ? {
                label: 'Filtro activo',
                onClick: () => onToggleFilter(issue.id)
              } : undefined}
              onClose={onDismissIssue ? () => onDismissIssue(issue.id) : undefined}
              onClick={() => onToggleFilter(issue.id)}
              className="flex-1"
            />
            <button
              onClick={() => handleOpenDetails(issue)}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Ver detalles"
              data-testid={`data-health-details-${issue.ruleId}`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
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
