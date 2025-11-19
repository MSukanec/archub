import { z } from 'zod';

export const generalCostSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional()
});

export type GeneralCostFormData = z.infer<typeof generalCostSchema>;
