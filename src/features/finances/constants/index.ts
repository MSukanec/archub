/**
 * Constants for finances feature
 * Enums, configurations, and static options
 */

// Ejemplo: Tipos de movimientos financieros
export const MOVEMENT_TYPES = {
  income: { label: "Ingreso", color: "green" },
  expense: { label: "Egreso", color: "red" },
  transfer: { label: "Transferencia", color: "blue" },
} as const;

// Ejemplo: Estados de movimientos
export const MOVEMENT_STATUS = {
  pending: { label: "Pendiente", color: "yellow" },
  completed: { label: "Completado", color: "green" },
  cancelled: { label: "Cancelado", color: "gray" },
} as const;
