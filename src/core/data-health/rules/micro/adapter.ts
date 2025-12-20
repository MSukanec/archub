import type { DataHealthRule, DataIssue, DataHealthContext, CorrectiveAction } from '../../types';
import type { MicroRule, EntityLabels } from './types';

export interface FeatureRuleConfig<T> {
  ruleId: string;
  featureTag: string;
  microRule: MicroRule<T>;
  entityLabels: EntityLabels;
  formatTitle: (count: number, labels: EntityLabels) => string;
  formatDescription: (count: number, labels: EntityLabels) => string;
  getItemLabel: (item: T) => string;
  getRecommendedAction: (affectedIds: (string | number)[]) => CorrectiveAction;
}

export function createFeatureRule<T extends { id: string | number }>(
  config: FeatureRuleConfig<T>
): DataHealthRule<T> {
  const { 
    ruleId,
    featureTag, 
    microRule, 
    entityLabels, 
    formatTitle, 
    formatDescription, 
    getItemLabel, 
    getRecommendedAction 
  } = config;

  return {
    id: ruleId,
    name: formatTitle(1, entityLabels),
    description: formatDescription(1, entityLabels),
    category: microRule.config.category,
    appliesTo: [featureTag],
    check: (items: T[], ctx: DataHealthContext): DataIssue | null => {
      const result = microRule.check(items, ctx);
      
      if (result.isEmpty) return null;

      const count = result.affected.length;
      const affectedIds = result.affected.map(item => item.id);

      return {
        id: `${ctx.organizationId}-${ruleId}`,
        ruleId: ruleId,
        title: formatTitle(count, entityLabels),
        description: formatDescription(count, entityLabels),
        severity: microRule.config.severity,
        affectedCount: count,
        affectedEntities: result.affected.slice(0, 5).map(item => ({
          id: item.id,
          label: getItemLabel(item),
        })),
        recommendedAction: getRecommendedAction(affectedIds),
      };
    },
  };
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function createExchangeRateDescription(count: number, labels: EntityLabels): string {
  const entity = count === 1 ? labels.singular : labels.plural;
  const tienen = count > 1 ? 'tienen' : 'tiene';
  const estan = count > 1 ? 'están' : 'está';
  const registrados = count > 1 ? 'registrados' : 'registrado';
  
  return `Tu organización opera con múltiples monedas. ${count} ${entity} ${estan} ${registrados} en moneda extranjera pero no ${tienen} cotización válida (debe ser mayor a 1). Sin esta información, el sistema no puede convertir correctamente los montos a la moneda base.

Ejemplos de cotización válida:
• Si tu moneda base es ARS: 1 USD = 1400 ARS
• Si tu moneda base es USD: 1 ARS = 0.0007 USD

Sin la cotización correcta, los totales y reportes serán incorrectos.`;
}
