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

// Query keys moved to src/core/query-keys/capital.keys.ts
// Import from there instead
import { capitalKeys } from '@/core/query-keys';

// Backward compatibility - re-export
export const CAPITAL_QUERY_KEYS = capitalKeys;
export const PARTNER_QUERY_KEYS = capitalKeys;
