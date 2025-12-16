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
  participants: (orgId: string) => ['capital-participants', orgId] as const,
  contributions: (orgId: string, projectId?: string) => ['capital-contributions', orgId, projectId] as const,
  contribution: (id: string) => ['capital-contribution', id] as const,
  withdrawals: (orgId: string, projectId?: string) => ['capital-withdrawals', orgId, projectId] as const,
  withdrawal: (id: string) => ['capital-withdrawal', id] as const,
} as const;

// Backward compatibility
export const PARTNER_PAYMENT_STATUS = CAPITAL_PAYMENT_STATUS;
export const PARTNER_PAYMENT_STATUS_OPTIONS = CAPITAL_PAYMENT_STATUS_OPTIONS;
export const PARTNER_QUERY_KEYS = CAPITAL_QUERY_KEYS;
