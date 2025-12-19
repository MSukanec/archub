import type { DataHealthRule, NormalizedPayment, DataIssue } from '../types';

export const clientPaymentsWithoutClientRule: DataHealthRule<NormalizedPayment> = {
  id: 'client-payments-without-client',
  name: 'Pagos de cliente sin cliente asignado',
  description: 'Detecta pagos de cliente que no tienen un cliente asignado',
  category: 'missing_relation',
  appliesTo: ['finances'],
  check: (payments, ctx) => {
    const affected = payments.filter(p => 
      p.movementType === 'client_payment' && !p.clientId
    );
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-client-payments-without-client`,
      ruleId: 'client-payments-without-client',
      title: 'sin cliente asignado (los pagos de cliente requieren seleccionar un cliente)',
      description: `${affected.length} pago${affected.length > 1 ? 's' : ''} de cliente necesita${affected.length > 1 ? 'n' : ''} que selecciones un cliente.`,
      severity: 'warning',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Pago #${p.id}` 
      })),
      recommendedAction: {
        label: 'Asignar cliente',
        description: 'Editar los pagos para asignar un cliente',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};

export const paymentsWithoutProjectRule: DataHealthRule<NormalizedPayment> = {
  id: 'payments-without-project',
  name: 'Pagos sin proyecto asignado',
  description: 'Detecta pagos de cliente/material/personal que no tienen proyecto asignado',
  category: 'missing_relation',
  appliesTo: ['finances'],
  check: (payments, ctx) => {
    const typesRequiringProject = ['client_payment', 'material_payment', 'personnel_payment'];
    const affected = payments.filter(p => 
      typesRequiringProject.includes(p.movementType || '') && !p.projectId
    );
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-payments-without-project`,
      ruleId: 'payments-without-project',
      title: 'sin proyecto asignado (este tipo de movimiento requiere seleccionar un proyecto)',
      description: `${affected.length} movimiento${affected.length > 1 ? 's' : ''} de este tipo necesita${affected.length > 1 ? 'n' : ''} que selecciones un proyecto.`,
      severity: 'warning',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Pago #${p.id}` 
      })),
      recommendedAction: {
        label: 'Asignar proyecto',
        description: 'Editar los movimientos para asignar un proyecto',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};

export const financesInvalidExchangeRateRule: DataHealthRule<NormalizedPayment> = {
  id: 'finances-invalid-exchange-rate',
  name: 'Sin cotización válida',
  description: 'Detecta movimientos en moneda extranjera sin cotización válida (debe ser mayor a 1)',
  category: 'currency',
  appliesTo: ['finances'],
  check: (payments, ctx) => {
    const minValidRate = 1.0;
    const affected = payments.filter(p => {
      const isForeignCurrency = p.currencyId && ctx.defaultCurrencyId && p.currencyId !== ctx.defaultCurrencyId;
      const hasInvalidRate = !p.exchangeRate || p.exchangeRate <= minValidRate || Number.isNaN(p.exchangeRate);
      return isForeignCurrency && hasInvalidRate;
    });
    
    if (affected.length === 0) return null;

    return {
      id: `${ctx.organizationId}-finances-invalid-exchange-rate`,
      ruleId: 'finances-invalid-exchange-rate',
      title: 'sin cotización válida (moneda extranjera requiere tipo de cambio, ej: 1 USD = 1.400 ARS)',
      description: `${affected.length} movimiento${affected.length > 1 ? 's' : ''} en moneda extranjera necesita${affected.length > 1 ? 'n' : ''} que ingreses el tipo de cambio para calcular los totales correctamente.`,
      severity: 'critical',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Movimiento #${p.id}` 
      })),
      recommendedAction: {
        label: 'Corregir cotización',
        description: 'Editar los movimientos para agregar la cotización correcta (ej: 1 USD = 1400 ARS)',
        actionType: 'bulk_edit',
        targetIds: affected.map(p => p.id),
      },
    };
  },
};

export const allFinancesRules: DataHealthRule<NormalizedPayment>[] = [
  clientPaymentsWithoutClientRule,
  paymentsWithoutProjectRule,
  financesInvalidExchangeRateRule,
];
