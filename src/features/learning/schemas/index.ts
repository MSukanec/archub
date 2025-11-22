/**
 * Zod schemas for the Learning module
 */

import { z } from 'zod';

// ========== LESSON PROGRESS SCHEMAS ==========

/**
 * Schema for updating lesson progress
 */
export const updateLessonProgressSchema = z.object({
  progress_pct: z.number().min(0).max(100).optional(),
  last_position_sec: z.number().min(0).optional(),
  completed_at: z.string().datetime().nullable().optional(),
  is_completed: z.boolean().optional(),
});

export type UpdateLessonProgressFormData = z.infer<typeof updateLessonProgressSchema>;

// ========== LESSON NOTES SCHEMAS ==========

/**
 * Schema for creating/updating a lesson note
 */
export const upsertLessonNoteSchema = z.object({
  body: z.string().min(1, 'El contenido de la nota es requerido'),
  time_sec: z.number().min(0).nullable().optional(),
  is_pinned: z.boolean().optional().default(false),
  note_type: z.enum(['summary', 'marker', 'general']).optional().default('general'),
});

export type UpsertLessonNoteFormData = z.infer<typeof upsertLessonNoteSchema>;

/**
 * Schema for creating/updating a summary note
 */
export const upsertSummaryNoteSchema = z.object({
  body: z.string().min(1, 'El resumen es requerido'),
});

export type UpsertSummaryNoteFormData = z.infer<typeof upsertSummaryNoteSchema>;

// ========== MARKERS SCHEMAS ==========

/**
 * Schema for creating/updating a marker (video bookmark)
 */
export const upsertMarkerSchema = z.object({
  body: z.string().min(1, 'La descripción del marcador es requerida'),
  time_sec: z.number().min(0, 'El tiempo debe ser mayor o igual a 0'),
  is_pinned: z.boolean().optional().default(false),
});

export type UpsertMarkerFormData = z.infer<typeof upsertMarkerSchema>;

// ========== FAVORITE SCHEMA ==========

/**
 * Schema for toggling lesson favorite
 */
export const toggleFavoriteSchema = z.object({
  is_favorite: z.boolean(),
});

export type ToggleFavoriteFormData = z.infer<typeof toggleFavoriteSchema>;
