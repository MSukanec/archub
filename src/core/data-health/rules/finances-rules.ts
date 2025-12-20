import type { DataHealthRule, NormalizedPayment } from '../types';
import { 
  createMissingExchangeRateRule,
  createMissingRelationRule,
} from './micro';
import { 
  createFeatureRule, 
  pluralize, 
  createExchangeRateDescription 
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
  formatTitle: () => `Sin cliente asignado`,
  formatDescription: (count) => 
    `${count} pago${count > 1 ? 's' : ''} de cliente sin cliente asignado.`,
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
  formatTitle: () => `Sin proyecto asignado`,
  formatDescription: (count, labels) => 
    `${count} ${pluralize(count, labels.singular, labels.plural)} sin proyecto asignado.`,
  getItemLabel: (item) => item.label || `Pago #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Asignar proyecto',
    description: 'Editar los movimientos para asignar un proyecto',
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
  paymentsWithoutProjectRule,
  financesInvalidExchangeRateRule,
];
