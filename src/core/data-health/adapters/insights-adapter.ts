import type { DataHealthResult, DataIssue, DataSeverity } from '../types';
import type { InsightItem } from '@/components/dashboard/InsightCard';
import type { InsightAction } from '@/components/insights/types';

type InsightVariant = 'info' | 'success' | 'warning' | 'danger';

const severityToVariant: Record<DataSeverity, InsightVariant> = {
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

export function dataIssueToInsight(issue: DataIssue): InsightItem {
  const actions: InsightAction[] = [{
    id: `${issue.id}-action`,
    label: issue.recommendedAction.label,
    type: issue.recommendedAction.actionType === 'navigate' ? 'navigate' : 'open',
    payload: {
      targetPath: issue.recommendedAction.targetPath,
      targetIds: issue.recommendedAction.targetIds,
      ruleId: issue.ruleId,
      severity: issue.severity,
      affectedCount: issue.affectedCount,
    },
  }];

  return {
    title: issue.title,
    description: issue.description,
    variant: severityToVariant[issue.severity],
    actions,
  };
}

export function dataHealthToInsights(result: DataHealthResult): InsightItem[] {
  return result.issues.map(dataIssueToInsight);
}

export function mergeWithBusinessInsights(
  businessInsights: InsightItem[],
  dataHealthInsights: InsightItem[],
  options: { 
    dataHealthFirst?: boolean; 
    maxDataHealthItems?: number;
  } = {}
): InsightItem[] {
  const { 
    dataHealthFirst = true, 
    maxDataHealthItems,
  } = options;

  const limitedHealthInsights = maxDataHealthItems 
    ? dataHealthInsights.slice(0, maxDataHealthItems)
    : dataHealthInsights;

  if (dataHealthFirst) {
    return [...limitedHealthInsights, ...businessInsights];
  }

  return [...businessInsights, ...limitedHealthInsights];
}
