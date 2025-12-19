import type { DataHealthRule, NormalizedPayment, DataIssue } from '../types';

export const paymentsWithoutCategoryRule: DataHealthRule<NormalizedPayment> = {
  id: 'payments-without-category',
  name: 'Pagos sin categoría',
  description: 'Detecta pagos que no tienen una categoría asignada, lo cual dificulta el análisis por categorías',
  category: 'classification',
  appliesTo: ['payments', 'general-costs'],
  check: (payments, ctx) => {
    const affected = payments.filter(p => !p.categoryId && !p.categoryName);
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-payments-without-category`,
      ruleId: 'payments-without-category',
      title: 'sin categoría asignada (seleccioná una categoría para organizar mejor tus pagos)',
      description: `${affected.length} pago${affected.length > 1 ? 's' : ''} necesita${affected.length > 1 ? 'n' : ''} una categoría para que los gráficos de distribución sean precisos.`,
      severity: 'warning',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Pago #${p.id}` 
      })),
      recommendedAction: {
        label: 'Asignar categorías',
        description: 'Editar los pagos para asignar una categoría a cada uno',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};

export const paymentsMissingExchangeRateRule: DataHealthRule<NormalizedPayment> = {
  id: 'payments-missing-exchange-rate',
  name: 'Pagos sin cotización válida',
  description: 'Detecta pagos en moneda extranjera que no tienen cotización válida (null, 0, o 1), impidiendo calcular totales en moneda base',
  category: 'currency',
  appliesTo: ['payments', 'general-costs', 'finances'],
  check: (payments, ctx) => {
    const minValidRate = 1.0;
    
    const affected = payments.filter(p => {
      const isForeignCurrency = p.currencyId && ctx.defaultCurrencyId && p.currencyId !== ctx.defaultCurrencyId;
      const hasInvalidRate = !p.exchangeRate || p.exchangeRate <= minValidRate;
      return isForeignCurrency && hasInvalidRate;
    });
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-payments-missing-exchange-rate`,
      ruleId: 'payments-missing-exchange-rate',
      title: 'sin cotización válida (moneda extranjera requiere tipo de cambio, ej: 1 USD = 1.400 ARS)',
      description: `${affected.length} pago${affected.length > 1 ? 's' : ''} en moneda extranjera necesita${affected.length > 1 ? 'n' : ''} que ingreses el tipo de cambio para calcular los totales correctamente.`,
      severity: 'critical',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Pago #${p.id}` 
      })),
      recommendedAction: {
        label: 'Corregir cotización',
        description: 'Editar los pagos para agregar la cotización correcta (ej: 1 USD = 1400 ARS)',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};

export const paymentsWithFutureDateRule: DataHealthRule<NormalizedPayment> = {
  id: 'payments-with-future-date',
  name: 'Pagos con fecha futura',
  description: 'Detecta pagos con fecha posterior a hoy, lo cual puede indicar un error de carga',
  category: 'dates',
  appliesTo: ['payments', 'general-costs', 'finances'],
  check: (payments, ctx) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const toleranceDays = ctx.dateToleranceDays ?? 0;
    const toleranceDate = new Date(today);
    toleranceDate.setDate(toleranceDate.getDate() + toleranceDays);

    const affected = payments.filter(p => {
      if (!p.paymentDate) return false;
      const paymentDate = new Date(p.paymentDate);
      return paymentDate > toleranceDate;
    });
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-payments-with-future-date`,
      ruleId: 'payments-with-future-date',
      title: 'con fecha futura (verificá que la fecha sea correcta)',
      description: `${affected.length} pago${affected.length > 1 ? 's' : ''} tiene${affected.length > 1 ? 'n' : ''} fecha posterior a hoy.`,
      severity: 'info',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Pago #${p.id}` 
      })),
      recommendedAction: {
        label: 'Revisar fechas',
        description: 'Verificar y corregir las fechas de los pagos',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};

export const paymentsWithoutConceptRule: DataHealthRule<NormalizedPayment> = {
  id: 'payments-without-concept',
  name: 'Pagos sin concepto',
  description: 'Detecta pagos que no están asociados a ningún concepto de gasto',
  category: 'classification',
  appliesTo: ['payments', 'general-costs'],
  check: (payments, ctx) => {
    const affected = payments.filter(p => !p.conceptId && !p.conceptName);
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-payments-without-concept`,
      ruleId: 'payments-without-concept',
      title: 'sin concepto asignado (seleccioná a qué concepto corresponde el pago)',
      description: `${affected.length} pago${affected.length > 1 ? 's' : ''} necesita${affected.length > 1 ? 'n' : ''} que selecciones un concepto para que los análisis sean completos.`,
      severity: 'warning',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Pago #${p.id}` 
      })),
      recommendedAction: {
        label: 'Asignar concepto',
        description: 'Editar los pagos para asignar un concepto de gasto',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};

export const allPaymentRules: DataHealthRule<NormalizedPayment>[] = [
  paymentsWithoutCategoryRule,
  paymentsMissingExchangeRateRule,
  paymentsWithFutureDateRule,
  paymentsWithoutConceptRule,
];
