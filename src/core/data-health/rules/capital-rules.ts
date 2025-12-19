import type { DataHealthRule, NormalizedPayment, DataIssue } from '../types';

export const capitalMissingExchangeRateRule: DataHealthRule<NormalizedPayment> = {
  id: 'capital-missing-exchange-rate',
  name: 'Transacciones sin cotización válida',
  description: 'Detecta transacciones de capital en moneda extranjera que no tienen cotización válida (null, 0, o 1)',
  category: 'currency',
  appliesTo: ['capital'],
  check: (transactions, ctx) => {
    const minValidRate = 1.0;
    
    const affected = transactions.filter(t => {
      const isForeignCurrency = t.currencyId && ctx.defaultCurrencyId && t.currencyId !== ctx.defaultCurrencyId;
      const hasInvalidRate = !t.exchangeRate || t.exchangeRate <= minValidRate;
      return isForeignCurrency && hasInvalidRate;
    });
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-capital-missing-exchange-rate`,
      ruleId: 'capital-missing-exchange-rate',
      title: 'sin cotización válida (moneda extranjera requiere tipo de cambio, ej: 1 USD = 1400 ARS)',
      description: `${affected.length} transacción${affected.length > 1 ? 'es' : ''} en moneda extranjera necesita${affected.length > 1 ? 'n' : ''} que ingreses el tipo de cambio para calcular los totales correctamente.`,
      severity: 'critical',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(t => ({ 
        id: t.id, 
        label: t.label || `Transacción #${t.id}` 
      })),
      recommendedAction: {
        label: 'Corregir cotización',
        description: 'Editar las transacciones para agregar la cotización correcta (ej: 1 USD = 1400 ARS)',
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
      title: 'sin billetera asignada (seleccioná de qué billetera salió o entró el dinero)',
      description: `${affected.length} transacción${affected.length > 1 ? 'es' : ''} necesita${affected.length > 1 ? 'n' : ''} que selecciones una billetera.`,
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
      title: 'con fecha futura (verificá que la fecha sea correcta)',
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
