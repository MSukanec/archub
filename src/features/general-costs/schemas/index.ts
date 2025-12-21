import { z } from 'zod';

export const generalCostSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category_id: z.string().optional(),
});

export type GeneralCostFormData = z.infer<typeof generalCostSchema>;

export const generalCostPaymentSchema = z.object({
  payment_date: z.date({
    required_error: "Fecha es requerida",
  }),
  general_cost_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  notes: z.string().optional(),
  reference: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected', 'void']).default('confirmed'),
});

export type GeneralCostPaymentFormData = z.infer<typeof generalCostPaymentSchema>;
