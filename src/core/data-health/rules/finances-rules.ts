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
      title: `movimiento${affected.length > 1 ? 's' : ''} sin cotización válida`,
      description: `Tu organización opera con múltiples monedas. ${affected.length} movimiento${affected.length > 1 ? 's' : ''} financiero${affected.length > 1 ? 's' : ''} está${affected.length > 1 ? 'n' : ''} registrado${affected.length > 1 ? 's' : ''} en moneda extranjera pero no ${affected.length > 1 ? 'tienen' : 'tiene'} cotización válida (debe ser mayor a 1). Sin esta información, el sistema no puede convertir correctamente los montos a la moneda base.\n\nEjemplos de cotización válida:\n• Si tu moneda base es ARS: 1 USD = 1400 ARS\n• Si tu moneda base es USD: 1 ARS = 0.0007 USD\n\nSin la cotización correcta, los totales del balance y los reportes financieros serán incorrectos.`,
      severity: 'critical',
      affectedCount: affected.length,
      affectedEntities: affected.slice(0, 5).map(p => ({ 
        id: p.id, 
        label: p.label || `Movimiento #${p.id}` 
      })),
      recommendedAction: {
        label: 'Configurar cotización',
        description: 'Editar cada movimiento y establecer la cotización correcta del tipo de cambio. La cotización se utiliza para convertir correctamente el monto a la moneda base de tu organización.',
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
