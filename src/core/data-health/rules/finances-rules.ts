import type { DataHealthRule, NormalizedPayment } from '../types';
import { 
  createMissingExchangeRateRule,
  createMissingRelationRule,
  createMissingPersonnelRule,
} from './micro';
import { 
  createFeatureRule, 
  pluralize, 
  createExchangeRateDescription,
  createMissingClientDescription,
  createMissingProjectDescription,
  createMissingPersonnelDescription,
} from './micro/adapter';
const FEATURE_TAG = 'finances';
const entityLabels = {
  singular: 'movimiento',
  plural: 'movimientos',
};
export const clientPaymentsWithoutClientRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'client-payments-without-client',
  featureTag: FEATURE_TAG,
  microRule: createMissingRelationRule<NormalizedPayment>({
    relationType: 'client',
    relationField: 'clientId',
    filterFn: (item) => item.movementType === 'client_payment',
  }),
  entityLabels,
  formatTitle: () => `Pagos sin cliente asignado`,
  formatDescription: (count, labels) => 
    createMissingClientDescription(count, labels),
  getItemLabel: (item) => item.label || `Pago #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Asignar cliente',
    description: 'Editar los pagos para asignar un cliente',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});
export const paymentsWithoutProjectRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'payments-without-project',
  featureTag: FEATURE_TAG,
  microRule: createMissingRelationRule<NormalizedPayment>({
    relationType: 'project',
    relationField: 'projectId',
    filterFn: (item) => {
      const typesRequiringProject = ['client_payment', 'material_payment', 'personnel_payment'];
      return typesRequiringProject.includes(item.movementType || '');
    },
  }),
  entityLabels,
  formatTitle: () => `Movimientos sin proyecto asignado`,
  formatDescription: (count, labels) => 
    createMissingProjectDescription(count, labels),
  getItemLabel: (item) => item.label || `Pago #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Asignar proyecto',
    description: 'Editar los movimientos para asignar un proyecto',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});
export const personnelPaymentsWithoutPersonnelRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'personnel-payments-without-personnel',
  featureTag: FEATURE_TAG,
  microRule: createMissingPersonnelRule<NormalizedPayment>({
    filterFn: (item) => item.movementType === 'personnel_payment',
  }),
  entityLabels,
  formatTitle: () => `Pagos de personal sin personal asignado`,
  formatDescription: (count, labels) => 
    createMissingPersonnelDescription(count, labels),
  getItemLabel: (item) => item.label || `Pago #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Asignar personal',
    description: 'Editar los pagos para asignar el personal que recibió el pago',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});
export const financesInvalidExchangeRateRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'finances-invalid-exchange-rate',
  featureTag: FEATURE_TAG,
  microRule: createMissingExchangeRateRule<NormalizedPayment>(),
  entityLabels,
  formatTitle: (count, labels) => 
    `${pluralize(count, labels.singular, labels.plural)} sin cotización válida`,
  formatDescription: (count, labels) => 
    createExchangeRateDescription(count, labels),
  getItemLabel: (item) => item.label || `Movimiento #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Configurar cotización',
    description: 'Editar cada movimiento y establecer la cotización correcta del tipo de cambio.',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});
export const allFinancesRules: DataHealthRule<NormalizedPayment>[] = [
  clientPaymentsWithoutClientRule,
  personnelPaymentsWithoutPersonnelRule,
  paymentsWithoutProjectRule,
  financesInvalidExchangeRateRule,
];
