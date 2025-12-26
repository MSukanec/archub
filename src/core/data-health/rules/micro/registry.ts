import type { LucideIcon } from 'lucide-react';
import { DollarSign, Calendar, Users, FolderOpen, Wallet, Tag, AlertTriangle } from 'lucide-react';
import type { DataSeverity } from '../../types';
export interface RuleMetadata {
  id: string;
  icon: LucideIcon;
  severity: DataSeverity;
  category: string;
}
export const microRuleRegistry: Record<string, RuleMetadata> = {
  'missing-exchange-rate': {
    id: 'missing-exchange-rate',
    icon: DollarSign,
    severity: 'critical',
    category: 'currency',
  },
  'finances-invalid-exchange-rate': {
    id: 'finances-invalid-exchange-rate',
    icon: DollarSign,
    severity: 'critical',
    category: 'currency',
  },
  'capital-missing-exchange-rate': {
    id: 'capital-missing-exchange-rate',
    icon: DollarSign,
    severity: 'critical',
    category: 'currency',
  },
  'future-date': {
    id: 'future-date',
    icon: Calendar,
    severity: 'info',
    category: 'dates',
  },
  'capital-with-future-date': {
    id: 'capital-with-future-date',
    icon: Calendar,
    severity: 'info',
    category: 'dates',
  },
  'payments-with-future-date': {
    id: 'payments-with-future-date',
    icon: Calendar,
    severity: 'info',
    category: 'dates',
  },
  'missing-client': {
    id: 'missing-client',
    icon: Users,
    severity: 'warning',
    category: 'missing_relation',
  },
  'client-payments-without-client': {
    id: 'client-payments-without-client',
    icon: Users,
    severity: 'warning',
    category: 'missing_relation',
  },
  'missing-personnel': {
    id: 'missing-personnel',
    icon: Users,
    severity: 'warning',
    category: 'missing_relation',
  },
  'personnel-payments-without-personnel': {
    id: 'personnel-payments-without-personnel',
    icon: Users,
    severity: 'warning',
    category: 'missing_relation',
  },
  'personnel-missing-personnel': {
    id: 'personnel-missing-personnel',
    icon: Users,
    severity: 'warning',
    category: 'missing_relation',
  },
  'personnel-missing-exchange-rate': {
    id: 'personnel-missing-exchange-rate',
    icon: DollarSign,
    severity: 'critical',
    category: 'currency',
  },
  'missing-project': {
    id: 'missing-project',
    icon: FolderOpen,
    severity: 'warning',
    category: 'missing_relation',
  },
  'payments-without-project': {
    id: 'payments-without-project',
    icon: FolderOpen,
    severity: 'warning',
    category: 'missing_relation',
  },
  'missing-wallet': {
    id: 'missing-wallet',
    icon: Wallet,
    severity: 'warning',
    category: 'classification',
  },
  'capital-missing-wallet': {
    id: 'capital-missing-wallet',
    icon: Wallet,
    severity: 'warning',
    category: 'classification',
  },
  'missing-category': {
    id: 'missing-category',
    icon: Tag,
    severity: 'info',
    category: 'classification',
  },
  'payments-without-category': {
    id: 'payments-without-category',
    icon: Tag,
    severity: 'info',
    category: 'classification',
  },
  'missing-concept': {
    id: 'missing-concept',
    icon: Tag,
    severity: 'info',
    category: 'classification',
  },
  'payments-without-concept': {
    id: 'payments-without-concept',
    icon: Tag,
    severity: 'info',
    category: 'classification',
  },
};
export function getRuleIcon(ruleId: string): LucideIcon {
  const metadata = microRuleRegistry[ruleId];
  return metadata?.icon || AlertTriangle;
}
export function getRuleSeverity(ruleId: string): DataSeverity {
  const metadata = microRuleRegistry[ruleId];
  return metadata?.severity || 'warning';
}
export function getRuleMetadata(ruleId: string): RuleMetadata | undefined {
  return microRuleRegistry[ruleId];
}
