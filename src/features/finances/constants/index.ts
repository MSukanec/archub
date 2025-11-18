/**
 * Constants for finances feature
 * Enums, configurations, and static options
 */

// ========== React Query Keys ==========

export const FINANCIAL_QUERY_KEYS = {
  all: ['financial-movements'] as const,
  lists: () => [...FINANCIAL_QUERY_KEYS.all, 'list'] as const,
  list: (organizationId: string | undefined) => 
    [...FINANCIAL_QUERY_KEYS.lists(), organizationId] as const,
  details: () => [...FINANCIAL_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | undefined) => 
    [...FINANCIAL_QUERY_KEYS.details(), id] as const,
  stats: (organizationId: string | undefined) => 
    [...FINANCIAL_QUERY_KEYS.all, 'stats', organizationId] as const,
};

// ========== Movement Types ==========

export const MOVEMENT_TYPES = {
  client_payment: { 
    label: "Pago de Cliente", 
    icon: "Users",
    color: "green" 
  },
  material_payment: { 
    label: "Pago de Material", 
    icon: "Package",
    color: "blue" 
  },
  personnel_payment: { 
    label: "Pago de Personal", 
    icon: "Users",
    color: "orange" 
  },
  indirect_payment: { 
    label: "Pago Indirecto", 
    icon: "Layers",
    color: "purple" 
  },
  subcontract_payment: { 
    label: "Pago de Subcontrato", 
    icon: "FileText",
    color: "indigo" 
  },
  general_cost_payment: { 
    label: "Gasto General", 
    icon: "CreditCard",
    color: "red" 
  },
  partner_payment: { 
    label: "Pago a Socio", 
    icon: "Handshake",
    color: "teal" 
  },
} as const;

// ========== Payment Status ==========

export const PAYMENT_STATUS = {
  confirmed: { 
    label: "Confirmado", 
    variant: "success" as const,
    color: "green" 
  },
  pending: { 
    label: "Pendiente", 
    variant: "warning" as const,
    color: "yellow" 
  },
  rejected: { 
    label: "Rechazado", 
    variant: "destructive" as const,
    color: "red" 
  },
  void: { 
    label: "Anulado", 
    variant: "secondary" as const,
    color: "gray" 
  },
} as const;

// ========== Table Configuration ==========

/**
 * Column configuration for the financial movements table.
 * Matches the columns from the legacy MovementsList.tsx page.
 */
export const FINANCIAL_MOVEMENTS_COLUMNS = [
  'payment_date',
  'description',
  'movement_type',
  'movement_category',
  'movement_subcategory',
  'amount',
  'currency',
  'wallet',
  'project',
  'status',
  'creator',
  'actions',
] as const;
