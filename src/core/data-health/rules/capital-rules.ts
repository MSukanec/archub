import type { DataHealthRule, NormalizedPayment, DataIssue } from '../types';

export const capitalMissingExchangeRateRule: DataHealthRule<NormalizedPayment> = {
  id: 'capital-missing-exchange-rate',
  name: 'Transacciones sin cotización',
  description: 'Detecta transacciones de capital en moneda extranjera que no tienen cotización',
  category: 'currency',
  appliesTo: ['capital'],
  check: (transactions, ctx) => {
    const affected = transactions.filter(t => {
      const isForeignCurrency = t.currencyId && ctx.defaultCurrencyId && t.currencyId !== ctx.defaultCurrencyId;
      const hasNoRate = !t.exchangeRate || t.exchangeRate === 0;
      return isForeignCurrency && hasNoRate;
    });
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-capital-missing-exchange-rate`,
      ruleId: 'capital-missing-exchange-rate',
      title: 'Transacciones sin cotización',
      description: `${affected.length} transacción${affected.length > 1 ? 'es' : ''} en moneda extranjera sin cotización. Los totales en moneda base pueden ser incorrectos.`,
      severity: 'critical',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(t => ({ 
        id: t.id, 
        label: t.label || `Transacción #${t.id}` 
      })),
      recommendedAction: {
        label: 'Agregar cotización',
        description: 'Editar las transacciones para agregar la cotización correspondiente',
        actionType: 'bulk_edit',
        targetIds: affected.map(t => t.id),
      },
    };
  },
};

export const capitalMissingWalletRule: DataHealthRule<NormalizedPayment> = {
  id: 'capital-missing-wallet',
  name: 'Transacciones sin billetera',
  description: 'Detecta transacciones de capital que no tienen billetera asignada',
  category: 'classification',
  appliesTo: ['capital'],
  check: (transactions, ctx) => {
    const affected = transactions.filter(t => !t.walletId && !t.walletName);
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-capital-missing-wallet`,
      ruleId: 'capital-missing-wallet',
      title: 'Transacciones sin billetera',
      description: `${affected.length} transacción${affected.length > 1 ? 'es' : ''} no tiene${affected.length > 1 ? 'n' : ''} billetera asignada.`,
      severity: 'warning',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(t => ({ 
        id: t.id, 
        label: t.label || `Transacción #${t.id}` 
      })),
      recommendedAction: {
        label: 'Asignar billetera',
        description: 'Editar las transacciones para asignar una billetera',
        actionType: 'bulk_edit',
        targetIds: affected.map(t => t.id),
      },
    };
  },
};

export const capitalWithFutureDateRule: DataHealthRule<NormalizedPayment> = {
  id: 'capital-with-future-date',
  name: 'Transacciones con fecha futura',
  description: 'Detecta transacciones de capital con fecha posterior a hoy',
  category: 'dates',
  appliesTo: ['capital'],
  check: (transactions, ctx) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const toleranceDays = ctx.dateToleranceDays ?? 0;
    const toleranceDate = new Date(today);
    toleranceDate.setDate(toleranceDate.getDate() + toleranceDays);

    const affected = transactions.filter(t => {
      if (!t.paymentDate) return false;
      const txDate = new Date(t.paymentDate);
      return txDate > toleranceDate;
    });
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-capital-with-future-date`,
      ruleId: 'capital-with-future-date',
      title: 'Transacciones con fecha futura',
      description: `${affected.length} transacción${affected.length > 1 ? 'es' : ''} tiene${affected.length > 1 ? 'n' : ''} fecha posterior a hoy.`,
      severity: 'info',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(t => ({ 
        id: t.id, 
        label: t.label || `Transacción #${t.id}` 
      })),
      recommendedAction: {
        label: 'Revisar fechas',
        description: 'Verificar y corregir las fechas de las transacciones',
        actionType: 'bulk_edit',
        targetIds: affected.map(t => t.id),
      },
    };
  },
};

export const allCapitalRules: DataHealthRule<NormalizedPayment>[] = [
  capitalMissingExchangeRateRule,
  capitalMissingWalletRule,
  capitalWithFutureDateRule,
];
