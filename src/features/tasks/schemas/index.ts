import { z } from 'zod';

export const taskSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name_rendered: z.string().optional(),
  custom_name: z.string().optional(),
  unit: z.string().min(1, 'La unidad es requerida'),
  category: z.string().optional(),
  division: z.string().optional(),
  param_values: z.record(z.string()).optional(),
  param_order: z.array(z.string()).optional(),
  is_system: z.boolean().default(false),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const taskMaterialSchema = z.object({
  task_id: z.string().min(1, 'La tarea es requerida'),
  material_id: z.string().min(1, 'El material es requerido'),
  amount: z.number().min(0.001, 'La cantidad debe ser mayor a 0'),
});

export type TaskMaterialFormData = z.infer<typeof taskMaterialSchema>;

export const taskLaborSchema = z.object({
  task_id: z.string().min(1, 'La tarea es requerida'),
  labor_id: z.string().min(1, 'La mano de obra es requerida'),
  labor_yield: z.number().min(0.001, 'El rendimiento debe ser mayor a 0'),
});

export type TaskLaborFormData = z.infer<typeof taskLaborSchema>;

export const taskCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  description: z.string().optional(),
});

export type TaskCategoryFormData = z.infer<typeof taskCategorySchema>;

export const taskDivisionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  description: z.string().optional(),
});

export type TaskDivisionFormData = z.infer<typeof taskDivisionSchema>;

export const taskParameterSchema = z.object({
  label: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El identificador es requerido'),
  type: z.enum(['select', 'number', 'text']).default('select'),
  is_required: z.boolean().default(true),
});

export type TaskParameterFormData = z.infer<typeof taskParameterSchema>;

export const taskParameterOptionSchema = z.object({
  parameter_id: z.string().min(1, 'El parámetro es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  label: z.string().min(1, 'La etiqueta es requerida'),
});

export type TaskParameterOptionFormData = z.infer<typeof taskParameterOptionSchema>;
