import { z } from 'zod';
export const contactSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().optional(),
  email: z.union([z.string().email('Email inválido'), z.literal('')]).optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  linked_user_id: z.string().optional(),
  national_id: z.string().optional(),
  display_name_override: z.string().optional(),
  contact_type_ids: z.array(z.string()).optional(),
}).refine((data) => {
  if (!data.linked_user_id && !data.first_name) {
    return false;
  }
  return true;
}, {
  message: 'El nombre es requerido cuando no hay usuario vinculado',
  path: ['first_name'],
});
export type ContactFormData = z.infer<typeof contactSchema>;
export const contactTypeSchema = z.object({
  name: z.string().min(1, 'El nombre del tipo es requerido'),
});
export type ContactTypeFormData = z.infer<typeof contactTypeSchema>;
export const contactAttachmentSchema = z.object({
  category: z.enum(['dni_front', 'dni_back', 'document', 'photo', 'other']),
  metadata: z.any().optional(),
});
export type ContactAttachmentFormData = z.infer<typeof contactAttachmentSchema>;
