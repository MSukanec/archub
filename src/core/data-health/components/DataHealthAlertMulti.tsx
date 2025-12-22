import { Callout } from '@/components/shared/Callout';
import type { DataIssue } from '../types';
import { getRuleIcon } from '../rules/micro';
import { useGlobalModalStore } from '@/components/modal';

interface DataHealthAlertMultiProps {
  issues: DataIssue[];
  entityLabel?: string;
  activeFilterIssueId?: string | null;
  onToggleFilter?: (issueId: string) => void;
  dismissedIssueIds?: Set<string>;
  onDismissIssue?: (issueId: string) => void;
  filteredItemIds?: Set<string | number>;
}

const severityColors: Record<string, string> = {
  critical: 'var(--error)',
  warning: 'var(--warning)',
  info: 'var(--info)',
};

export function DataHealthAlertMulti({
  issues = [],
  entityLabel = 'elemento',
  activeFilterIssueId,
  onToggleFilter,
  dismissedIssueIds = new Set(),
  onDismissIssue,
  filteredItemIds,
}: DataHealthAlertMultiProps) {
  const openModal = useGlobalModalStore((state) => state.openModal);
  
  if (!issues || issues.length === 0) return null;
  
  // Deduplicate issues by ruleId (can happen with React StrictMode or data duplication)
  const deduplicatedIssues = Array.from(
    new Map(issues.map(issue => [issue.ruleId, issue])).values()
  );
  
  const visibleIssues = deduplicatedIssues.filter(issue => {
    if (dismissedIssueIds.has(issue.id)) return false;
    
    if (filteredItemIds && filteredItemIds.size > 0) {
      const issueTargetIds = issue.recommendedAction.targetIds || [];
      const filteredIdsAsStrings = new Set(Array.from(filteredItemIds).map(id => String(id)));
      const hasOverlap = issueTargetIds.some(id => filteredIdsAsStrings.has(String(id)));
      if (!hasOverlap) return false;
    }
    
    return true;
  });
  
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
          <Callout
            key={issue.id}
            icon={Icon}
            text={`${issue.affectedCount} ${issue.title.toLowerCase()}`}
            backgroundColor={bgColor}
            buttons={[
              {
                label: 'Más información',
                onClick: (e) => {
                  e?.stopPropagation();
                  handleOpenDetails(issue);
                }
              },
              ...(onToggleFilter ? [{
                label: isThisIssueFiltered ? 'Filtro activo' : 'Mostrar',
                onClick: (e: React.MouseEvent | undefined) => {
                  e?.stopPropagation();
                  onToggleFilter(issue.id);
                }
              }] : [])
            ]}
            onClose={onDismissIssue ? () => onDismissIssue(issue.id) : undefined}
            onClick={onToggleFilter ? () => onToggleFilter(issue.id) : undefined}
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
