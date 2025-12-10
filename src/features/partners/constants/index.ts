export const PARTNER_PAYMENT_STATUS = {
  confirmed: { label: 'Confirmado', variant: 'default' as const, color: 'green' },
  pending: { label: 'Pendiente', variant: 'secondary' as const, color: 'yellow' },
  rejected: { label: 'Rechazado', variant: 'destructive' as const, color: 'red' },
  void: { label: 'Anulado', variant: 'outline' as const, color: 'gray' },
} as const;

export const PARTNER_PAYMENT_STATUS_OPTIONS = Object.entries(PARTNER_PAYMENT_STATUS).map(
  ([value, config]) => ({
    value,
    label: config.label,
    color: config.color,
  })
);

export const PARTNER_QUERY_KEYS = {
  partners: (orgId: string) => ['partners', orgId] as const,
  contributions: (orgId: string, projectId?: string) => ['partner-contributions', orgId, projectId] as const,
  contribution: (id: string) => ['partner-contribution', id] as const,
  withdrawals: (orgId: string, projectId?: string) => ['partner-withdrawals', orgId, projectId] as const,
  withdrawal: (id: string) => ['partner-withdrawal', id] as const,
} as const;
