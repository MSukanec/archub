import type { DataHealthRule, NormalizedPayment, DataIssue } from '../types';

export const capitalMissingExchangeRateRule: DataHealthRule<NormalizedPayment> = {
  id: 'capital-missing-exchange-rate',
  name: 'Cotización de moneda no configurada',
  description: 'Detecta transacciones de capital en moneda extranjera sin cotización válida. La cotización es necesaria para calcular correctamente los totales.',
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
      title: `transacción${affected.length > 1 ? 'es' : ''} sin cotización válida`,
      description: `Tu organización opera con múltiples monedas. ${affected.length} transacción${affected.length > 1 ? 'es' : ''} de capital está${affected.length > 1 ? 'n' : ''} registrada${affected.length > 1 ? 's' : ''} en moneda extranjera pero no ${affected.length > 1 ? 'tienen' : 'tiene'} cotización válida (debe ser mayor a 1). Sin esta información, el sistema no puede convertir correctamente los montos a la moneda base.\n\nEjemplos de cotización válida:\n• Si tu moneda base es ARS: 1 USD = 1400 ARS\n• Si tu moneda base es USD: 1 ARS = 0.0007 USD\n\nSin la cotización correcta, los cálculos de capital y patrimonio de los socios no serán precisos.`,
      severity: 'critical',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(t => ({ 
        id: t.id, 
        label: t.label || `Transacción #${t.id}` 
      })),
      recommendedAction: {
        label: 'Configurar cotización',
        description: 'Editar cada transacción y establecer la cotización correcta del tipo de cambio. La cotización se utiliza para convertir correctamente el monto a la moneda base de tu organización.',
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
