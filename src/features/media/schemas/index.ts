/**
 * Media Feature - Zod Schemas
 * 
 * Validation schemas for media forms and data
 */

import { z } from 'zod';
import { FILE_TYPES, MAX_FILE_SIZE } from '../constants';

export const mediaFileSchema = z.object({
  file_name: z.string().min(1, 'El nombre del archivo es requerido'),
  file_type: z.string().refine(
    (type) => FILE_TYPES.ALL.includes(type),
    'Tipo de archivo no soportado'
  ),
  file_size: z.number().max(MAX_FILE_SIZE, 'El archivo es demasiado grande (máx. 50MB)').optional(),
  visibility: z.enum(['organization', 'project', 'private']),
  description: z.string().optional(),
  project_id: z.string().uuid('ID de proyecto inválido'),
  organization_id: z.string().uuid('ID de organización inválido')
});

export const galleryFileSchema = mediaFileSchema.extend({
  site_log_id: z.string().uuid().nullable().optional()
});

export const documentFileSchema = mediaFileSchema.extend({
  folder_path: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const uploadMediaSchema = z.object({
  file: z.instanceof(File),
  project_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  visibility: z.enum(['organization', 'project', 'private']),
  description: z.string().optional(),
  created_by: z.string().uuid()
});
