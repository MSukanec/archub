// api/lib/handlers/admin/lessons.ts
// Admin course lessons management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * List all lessons (optionally filtered by module_id)
 */
export async function listLessons(
  ctx: AdminContext,
  params?: { module_id?: string }
): Promise<AdminHandlerResult> {
  try {
    let query = ctx.supabase
      .from('course_lessons')
      .select('*')
      .order('sort_index', { ascending: true });
    
    if (params?.module_id) {
      query = query.eq('module_id', params.module_id);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('Error fetching lessons:', dbError);
      return error("Failed to fetch lessons");
    }
    
    return success(data || []);
  } catch (err: any) {
    console.error('listLessons error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Get single lesson by ID
 */
export async function getLesson(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { data: lesson, error: dbError } = await ctx.supabase
      .from('course_lessons')
      .select('*')
      .eq('id', params.id)
      .single();

    if (dbError) {
      console.error('Error fetching lesson:', dbError);
      return error("Failed to fetch lesson");
    }

    return success(lesson);
  } catch (err: any) {
    console.error('getLesson error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Create new lesson
 */
export async function createLesson(
  ctx: AdminContext,
  lessonData: any
): Promise<AdminHandlerResult> {
  try {
    const { data: lesson, error: dbError } = await ctx.supabase
      .from('course_lessons')
      .insert(lessonData)
      .select()
      .single();

    if (dbError) {
      console.error('Error creating lesson:', dbError);
      return error("Failed to create lesson");
    }

    return success(lesson);
  } catch (err: any) {
    console.error('createLesson error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update lesson
 */
export async function updateLesson(
  ctx: AdminContext,
  params: { id: string },
  updates: any
): Promise<AdminHandlerResult> {
  try {
    const { data: lesson, error: dbError } = await ctx.supabase
      .from('course_lessons')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (dbError) {
      console.error('Error updating lesson:', dbError);
      return error("Failed to update lesson");
    }

    return success(lesson);
  } catch (err: any) {
    console.error('updateLesson error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Delete lesson
 */
export async function deleteLesson(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { error: dbError } = await ctx.supabase
      .from('course_lessons')
      .delete()
      .eq('id', params.id);

    if (dbError) {
      console.error('Error deleting lesson:', dbError);
      return error("Failed to delete lesson");
    }

    return success({ id: params.id });
  } catch (err: any) {
    console.error('deleteLesson error:', err);
    return error(err.message || "Internal error");
  }
}
