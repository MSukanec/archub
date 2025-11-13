// api/_lib/handlers/admin/courses.ts
// Admin course management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * List all courses
 */
export async function listCourses(
  ctx: AdminContext
): Promise<AdminHandlerResult> {
  try {
    const { data: courses, error: dbError } = await ctx.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching courses:', dbError);
      return error("Failed to fetch courses");
    }

    return success(courses || []);
  } catch (err: any) {
    console.error('listCourses error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Get single course by ID
 */
export async function getCourse(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { data: course, error: dbError } = await ctx.supabase
      .from('courses')
      .select('*')
      .eq('id', params.id)
      .single();

    if (dbError) {
      console.error('Error fetching course:', dbError);
      return error("Failed to fetch course");
    }

    return success(course);
  } catch (err: any) {
    console.error('getCourse error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Create new course
 */
export async function createCourse(
  ctx: AdminContext,
  courseData: any
): Promise<AdminHandlerResult> {
  try {
    const { data: course, error: dbError } = await ctx.supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (dbError) {
      console.error('Error creating course:', dbError);
      return error("Failed to create course");
    }

    return success(course);
  } catch (err: any) {
    console.error('createCourse error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update course
 */
export async function updateCourse(
  ctx: AdminContext,
  params: { id: string },
  updates: any
): Promise<AdminHandlerResult> {
  try {
    const { data: course, error: dbError } = await ctx.supabase
      .from('courses')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (dbError) {
      console.error('Error updating course:', dbError);
      return error("Failed to update course");
    }

    return success(course);
  } catch (err: any) {
    console.error('updateCourse error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Delete course
 */
export async function deleteCourse(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { error: dbError } = await ctx.supabase
      .from('courses')
      .delete()
      .eq('id', params.id);

    if (dbError) {
      console.error('Error deleting course:', dbError);
      return error("Failed to delete course");
    }

    return success({ id: params.id });
  } catch (err: any) {
    console.error('deleteCourse error:', err);
    return error(err.message || "Internal error");
  }
}
