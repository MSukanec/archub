/**
 * Zod schemas for Clients feature forms validation
 */
import { z } from 'zod';

// ========== Project Client Schema ==========

export const projectClientSchema = z.object({
  contact_id: z.string().min(1, 'El contacto es requerido'),
  client_role_id: z.string().nullable().optional(),
  is_primary: z.boolean().default(true),
  notes: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'deleted', 'potential', 'rejected', 'completed']).default('active'),
});

export type ProjectClientFormData = z.infer<typeof projectClientSchema>;

// ========== Client Commitment Schema ==========

export const clientCommitmentSchema = z.object({
  client_id: z.string().min(1, 'El cliente es requerido'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'El tipo de cambio debe ser mayor a 0'),
});

export type ClientCommitmentFormData = z.infer<typeof clientCommitmentSchema>;

// ========== Client Payment Schema ==========

export const clientPaymentSchema = z.object({
  client_id: z.string().nullable().optional(),
  commitment_id: z.string().nullable().optional(),
  schedule_id: z.string().nullable().optional(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'El tipo de cambio debe ser mayor a 0'),
  payment_date: z.string().min(1, 'La fecha de pago es requerida'),
  notes: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  wallet_id: z.string().nullable().optional(),
  status: z.enum(['confirmed', 'pending', 'rejected', 'void']).default('confirmed'),
  file_url: z.string().nullable().optional(),
});

export type ClientPaymentFormData = z.infer<typeof clientPaymentSchema>;

// ========== Client Payment Schedule Schema ==========

export const clientPaymentScheduleSchema = z.object({
  commitment_id: z.string().min(1, 'El compromiso es requerido'),
  installment_number: z.number().min(1, 'El número de cuota debe ser mayor a 0'),
  due_date: z.string().min(1, 'La fecha de vencimiento es requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  exchange_rate: z.number().min(0.0001, 'El tipo de cambio debe ser mayor a 0'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  notes: z.string().nullable().optional(),
});

export type ClientPaymentScheduleFormData = z.infer<typeof clientPaymentScheduleSchema>;

// ========== Client Role Schema ==========

export const clientRoleSchema = z.object({
  name: z.string().min(1, 'El nombre del rol es requerido').max(100, 'El nombre es demasiado largo'),
  description: z.string().nullable().optional(),
  is_default: z.boolean().default(false),
});

export type ClientRoleFormData = z.infer<typeof clientRoleSchema>;
