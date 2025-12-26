import type { DataHealthRule, NormalizedPayment } from '../types';
import { 
  createMissingExchangeRateRule,
  createMissingPersonnelRule,
} from './micro';
import { 
  createFeatureRule, 
  pluralize, 
  createExchangeRateDescription,
  createMissingPersonnelDescription,
} from './micro/adapter';
const FEATURE_TAG = 'personnel';
const entityLabels = {
  singular: 'pago',
  plural: 'pagos',
};
export const personnelPaymentsWithoutPersonnelRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'personnel-missing-personnel',
  featureTag: FEATURE_TAG,
  microRule: createMissingPersonnelRule<NormalizedPayment>({
    filterFn: () => true,
  }),
  entityLabels,
  formatTitle: () => `Pagos sin personal asignado`,
  formatDescription: (count, labels) => 
    createMissingPersonnelDescription(count, labels),
  getItemLabel: (item) => item.label || `Pago #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Asignar personal',
    description: 'Editar los pagos para asignar el personal correspondiente',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});
export const personnelInvalidExchangeRateRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'personnel-missing-exchange-rate',
  featureTag: FEATURE_TAG,
  microRule: createMissingExchangeRateRule<NormalizedPayment>(),
  entityLabels,
  formatTitle: (count, labels) => 
    `${pluralize(count, labels.singular, labels.plural)} sin cotización válida`,
  formatDescription: (count, labels) => 
    createExchangeRateDescription(count, labels),
  getItemLabel: (item) => item.label || `Pago #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Configurar cotización',
    description: 'Editar cada pago y establecer la cotización correcta del tipo de cambio.',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});
export const allPersonnelRules: DataHealthRule<NormalizedPayment>[] = [
  personnelPaymentsWithoutPersonnelRule,
  personnelInvalidExchangeRateRule,
];
