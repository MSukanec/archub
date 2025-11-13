// api/_lib/handlers/admin/modules.ts
// Admin course modules management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * List all modules (optionally filtered by course_id)
 */
export async function listModules(
  ctx: AdminContext,
  params?: { course_id?: string }
): Promise<AdminHandlerResult> {
  try {
    let query = ctx.supabase
      .from('course_modules')
      .select('*')
      .order('sort_index', { ascending: true });
    
    if (params?.course_id) {
      query = query.eq('course_id', params.course_id);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('Error fetching modules:', dbError);
      return error("Failed to fetch modules");
    }
    
    return success(data || []);
  } catch (err: any) {
    console.error('listModules error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Get single module by ID
 */
export async function getModule(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { data: module, error: dbError } = await ctx.supabase
      .from('course_modules')
      .select('*')
      .eq('id', params.id)
      .single();

    if (dbError) {
      console.error('Error fetching module:', dbError);
      return error("Failed to fetch module");
    }

    return success(module);
  } catch (err: any) {
    console.error('getModule error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Create new module
 */
export async function createModule(
  ctx: AdminContext,
  moduleData: any
): Promise<AdminHandlerResult> {
  try {
    const { data: module, error: dbError } = await ctx.supabase
      .from('course_modules')
      .insert(moduleData)
      .select()
      .single();

    if (dbError) {
      console.error('Error creating module:', dbError);
      return error("Failed to create module");
    }

    return success(module);
  } catch (err: any) {
    console.error('createModule error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update module
 */
export async function updateModule(
  ctx: AdminContext,
  params: { id: string },
  updates: any
): Promise<AdminHandlerResult> {
  try {
    const { data: module, error: dbError } = await ctx.supabase
      .from('course_modules')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (dbError) {
      console.error('Error updating module:', dbError);
      return error("Failed to update module");
    }

    return success(module);
  } catch (err: any) {
    console.error('updateModule error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Delete module
 */
export async function deleteModule(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { error: dbError } = await ctx.supabase
      .from('course_modules')
      .delete()
      .eq('id', params.id);

    if (dbError) {
      console.error('Error deleting module:', dbError);
      return error("Failed to delete module");
    }

    return success({ id: params.id });
  } catch (err: any) {
    console.error('deleteModule error:', err);
    return error(err.message || "Internal error");
  }
}
