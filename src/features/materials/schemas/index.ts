/**
 * Materials Feature - Zod Schemas
 * 
 * Schemas de validación para formularios de materiales.
 */

import { z } from 'zod';

// ============ MATERIAL SCHEMAS ============

export const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  material_type: z.enum(['material', 'consumable'], { 
    required_error: 'Selecciona el tipo de material' 
  }),
  category_id: z.string().min(1, 'La categoría es requerida'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
  is_completed: z.boolean().optional(),
});

export type MaterialFormData = z.infer<typeof materialSchema>;

// ============ MATERIAL VALIDATION HELPERS ============

export const validateMaterialName = (name: string): boolean => {
  return name.trim().length > 0;
};

export const validateMaterialType = (type: string): boolean => {
  return ['material', 'consumable'].includes(type);
};
