/**
 * Zod validation schemas for finances feature
 */
import { z } from "zod";
// Ejemplo: Schema de validación para crear un movimiento financiero
export const financialMovementSchema = z.object({
  movement_type: z.enum(['income', 'expense', 'transfer'], {
    required_error: "El tipo de movimiento es requerido",
  }),
  amount: z.number({
    required_error: "El monto es requerido",
  }).positive("El monto debe ser mayor a 0"),
  currency: z.string().min(1, "La moneda es requerida"),
  description: z.string().min(1, "La descripción es requerida"),
  movement_date: z.string().min(1, "La fecha es requerida"),
});
export type FinancialMovementFormData = z.infer<typeof financialMovementSchema>;
