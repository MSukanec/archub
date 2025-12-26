/**
 * Project Schemas
 * 
 * Zod validation schemas for the projects feature.
 */
import { z } from 'zod';
export const createProjectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido"),
  project_type_id: z.string().optional(),
  project_modality_id: z.string().optional(),
  status: z.enum(["active", "inactive", "completed", "paused"]).default("active"),
  color: z.string().optional(),
  use_custom_color: z.boolean().default(false),
  custom_color_h: z.number().min(0).max(360).nullable().optional(),
  custom_color_hex: z.string().nullable().optional(),
});
export const updateProjectSchema = z.object({
  name: z.string().min(1, "El nombre del proyecto es requerido").optional(),
  project_type_id: z.string().optional(),
  project_modality_id: z.string().optional(),
  status: z.enum(["active", "inactive", "completed", "paused"]).optional(),
  color: z.string().optional(),
  use_custom_color: z.boolean().optional(),
  custom_color_h: z.number().min(0).max(360).nullable().optional(),
  custom_color_hex: z.string().nullable().optional(),
});
export type CreateProjectForm = z.infer<typeof createProjectSchema>;
export type UpdateProjectForm = z.infer<typeof updateProjectSchema>;
export const projectModalitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
});
export type ProjectModalityFormData = z.infer<typeof projectModalitySchema>;
export const projectTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
});
export type ProjectTypeFormData = z.infer<typeof projectTypeSchema>;
