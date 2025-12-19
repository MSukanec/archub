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
      title: 'Sin cliente asignado',
      description: `${affected.length} pago${affected.length > 1 ? 's' : ''} de cliente sin cliente asignado.`,
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
      title: 'Sin proyecto asignado',
      description: `${affected.length} movimiento${affected.length > 1 ? 's' : ''} sin proyecto asignado.`,
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
  name: 'Cotización de moneda no configurada',
  description: 'Detecta movimientos en moneda extranjera sin cotización válida. La cotización es requerida para convertir a moneda base.',
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
      title: `${affected.length} movimiento${affected.length > 1 ? 's' : ''} con cotización faltante o inválida`,
      description: `Tu organización opera con múltiples monedas, pero ${affected.length} movimiento${affected.length > 1 ? 's' : ''} financiero${affected.length > 1 ? 's' : ''} no ${affected.length > 1 ? 'tienen' : 'tiene'} cotización válida. Sin la cotización correcta (debe ser > 1), los totales en la moneda base son incorrectos y los cálculos del balance no son confiables.`,
      severity: 'critical',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Movimiento #${p.id}` 
      })),
      recommendedAction: {
        label: 'Agregar cotización',
        description: 'Editar cada movimiento y configurar la cotización correcta entre monedas (ej: 1 USD = 1400 ARS). Esta cotización se usa para convertir el monto a la moneda base.',
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
