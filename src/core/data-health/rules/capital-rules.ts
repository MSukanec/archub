import type { DataHealthRule, NormalizedPayment } from '../types';
import { 
  createMissingExchangeRateRule,
  createFutureDateRule,
  createMissingWalletRule,
} from './micro';
import { 
  createFeatureRule, 
  pluralize, 
  createExchangeRateDescription,
  createMissingWalletDescription,
} from './micro/adapter';

const FEATURE_TAG = 'capital';

const entityLabels = {
  singular: 'transacción',
  plural: 'transacciones',
};

interface CapitalTransaction extends NormalizedPayment {
  date?: string | null;
}

export const capitalMissingExchangeRateRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'capital-missing-exchange-rate',
  featureTag: FEATURE_TAG,
  microRule: createMissingExchangeRateRule<NormalizedPayment>(),
  entityLabels,
  formatTitle: (count, labels) => 
    `${pluralize(count, labels.singular, labels.plural)} sin cotización válida`,
  formatDescription: (count, labels) => 
    createExchangeRateDescription(count, labels),
  getItemLabel: (item) => item.label || `Transacción #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Configurar cotización',
    description: 'Editar cada transacción y establecer la cotización correcta del tipo de cambio.',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});

export const capitalMissingWalletRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'capital-missing-wallet',
  featureTag: FEATURE_TAG,
  microRule: createMissingWalletRule<NormalizedPayment>(),
  entityLabels,
  formatTitle: () => 'Transacciones sin billetera',
  formatDescription: (count, labels) => 
    createMissingWalletDescription(count, labels),
  getItemLabel: (item) => item.label || `Transacción #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Asignar billetera',
    description: 'Editar las transacciones para asignar una billetera',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});

const futureDateMicroRule = createFutureDateRule<CapitalTransaction>();
export const capitalWithFutureDateRule: DataHealthRule<NormalizedPayment> = createFeatureRule({
  ruleId: 'capital-with-future-date',
  featureTag: FEATURE_TAG,
  microRule: {
    config: futureDateMicroRule.config,
    check: (items, ctx) => {
      const mappedItems = items.map(item => ({
        ...item,
        date: item.paymentDate,
      }));
      return futureDateMicroRule.check(mappedItems, ctx);
    },
  },
  entityLabels,
  formatTitle: () => 'Transacciones con fecha futura',
  formatDescription: (count, labels) => 
    `${count} ${pluralize(count, labels.singular, labels.plural)} tiene${count > 1 ? 'n' : ''} fecha posterior a hoy.`,
  getItemLabel: (item) => item.label || `Transacción #${item.id}`,
  getRecommendedAction: (affectedIds) => ({
    label: 'Revisar fechas',
    description: 'Verificar y corregir las fechas de las transacciones',
    actionType: 'bulk_edit',
    targetIds: affectedIds,
  }),
});

export const allCapitalRules: DataHealthRule<NormalizedPayment>[] = [
  capitalMissingExchangeRateRule,
  capitalMissingWalletRule,
  capitalWithFutureDateRule,
];
