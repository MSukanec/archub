export const CAPITAL_PAYMENT_STATUS = {
  confirmed: { label: 'Confirmado', variant: 'default' as const, color: 'green' },
  pending: { label: 'Pendiente', variant: 'secondary' as const, color: 'yellow' },
  rejected: { label: 'Rechazado', variant: 'destructive' as const, color: 'red' },
  void: { label: 'Anulado', variant: 'outline' as const, color: 'gray' },
} as const;

export const CAPITAL_PAYMENT_STATUS_OPTIONS = Object.entries(CAPITAL_PAYMENT_STATUS).map(
  ([value, config]) => ({
    value,
    label: config.label,
    color: config.color,
  })
);

export const CAPITAL_QUERY_KEYS = {
  // Participants
  participants: (orgId: string) => ['capital-participants', orgId] as const,
  partner: (partnerId: string) => ['capital-partner', partnerId] as const,
  contactsForPartner: (orgId: string) => ['capital-contacts-for-partner', orgId] as const,
  partnerContactIds: (orgId: string) => ['capital-partner-contact-ids', orgId] as const,
  
  // Contributions
  contributions: (orgId: string, projectId?: string) => ['capital-contributions', orgId, projectId] as const,
  contribution: (id: string) => ['capital-contribution', id] as const,
  
  // Withdrawals
  withdrawals: (orgId: string, projectId?: string) => ['capital-withdrawals', orgId, projectId] as const,
  withdrawal: (id: string) => ['capital-withdrawal', id] as const,
  
  // Unified movements (for dashboard)
  unifiedMovements: () => ['capital-unified-movements'] as const,
  partnerMovements: (orgId?: string, projectId?: string) => ['capital-partner-movements', orgId, projectId].filter(Boolean) as const,
} as const;

// Backward compatibility
export const PARTNER_PAYMENT_STATUS = CAPITAL_PAYMENT_STATUS;
export const PARTNER_PAYMENT_STATUS_OPTIONS = CAPITAL_PAYMENT_STATUS_OPTIONS;
export const PARTNER_QUERY_KEYS = CAPITAL_QUERY_KEYS;
