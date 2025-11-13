// api/_lib/handlers/admin/enrollments.ts
// Admin course enrollments management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * List all enrollments with progress (optionally filtered by course_id)
 * This is an optimized query that fetches enrollments with user/course data and calculates progress
 */
export async function listEnrollments(
  ctx: AdminContext,
  params?: { course_id?: string }
): Promise<AdminHandlerResult> {
  try {
    // QUERY 1: Fetch ALL enrollments with users and courses
    let enrollmentsQuery = ctx.supabase
      .from('course_enrollments')
      .select(`
        *,
        users!inner(id, full_name, email, avatar_url),
        courses!inner(id, title)
      `)
      .order('started_at', { ascending: false });
    
    if (params?.course_id) {
      enrollmentsQuery = enrollmentsQuery.eq('course_id', params.course_id);
    }
    
    const { data: enrollments, error: enrollmentsError } = await enrollmentsQuery;
    
    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      return error("Failed to fetch enrollments");
    }

    if (!enrollments || enrollments.length === 0) {
      return success([]);
    }
    
    // Extract unique course IDs and user IDs
    const courseIds = Array.from(new Set(enrollments.map(e => e.course_id)));
    const userIds = Array.from(new Set(enrollments.map(e => e.user_id)));
    
    // QUERY 2: Fetch ALL payments for these users and courses
    const { data: allPayments } = await ctx.supabase
      .from('payments')
      .select('id, amount, currency, provider, status, user_id, course_id')
      .in('user_id', userIds)
      .in('course_id', courseIds)
      .eq('product_type', 'course');
    
    // Create (user_id + course_id) -> payment mapping
    const paymentMap = new Map<string, any>();
    (allPayments || []).forEach(payment => {
      const key = `${payment.user_id}_${payment.course_id}`;
      paymentMap.set(key, payment);
    });
    
    // QUERY 3: Fetch ALL modules for ALL courses at once
    const { data: allModules } = await ctx.supabase
      .from('course_modules')
      .select('id, course_id')
      .in('course_id', courseIds);
    
    if (!allModules || allModules.length === 0) {
      // No modules = no lessons = 0% progress for everyone
      return success(enrollments.map(e => {
        const paymentKey = `${e.user_id}_${e.course_id}`;
        return {
          ...e,
          payment: paymentMap.get(paymentKey) || null,
          progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
        };
      }));
    }
    
    // Create course_id -> module_ids mapping
    const courseModulesMap = new Map<string, string[]>();
    allModules.forEach(module => {
      if (!courseModulesMap.has(module.course_id)) {
        courseModulesMap.set(module.course_id, []);
      }
      courseModulesMap.get(module.course_id)!.push(module.id);
    });
    
    const allModuleIds = allModules.map(m => m.id);
    
    // QUERY 4: Fetch ALL lessons for ALL modules at once
    const { data: allLessons } = await ctx.supabase
      .from('course_lessons')
      .select('id, module_id')
      .in('module_id', allModuleIds);
    
    if (!allLessons || allLessons.length === 0) {
      // No lessons = 0% progress for everyone
      return success(enrollments.map(e => {
        const paymentKey = `${e.user_id}_${e.course_id}`;
        return {
          ...e,
          payment: paymentMap.get(paymentKey) || null,
          progress: { completed_lessons: 0, total_lessons: 0, progress_percentage: 0 }
        };
      }));
    }
    
    // Create module_id -> lesson_ids mapping
    const moduleLessonsMap = new Map<string, string[]>();
    allLessons.forEach(lesson => {
      if (!moduleLessonsMap.has(lesson.module_id)) {
        moduleLessonsMap.set(lesson.module_id, []);
      }
      moduleLessonsMap.get(lesson.module_id)!.push(lesson.id);
    });
    
    const allLessonIds = allLessons.map(l => l.id);
    
    // QUERY 5: Fetch ALL progress for ALL users and ALL lessons at once
    const { data: allProgress } = await ctx.supabase
      .from('course_lesson_progress')
      .select('user_id, lesson_id, is_completed')
      .in('user_id', userIds)
      .in('lesson_id', allLessonIds)
      .eq('is_completed', true);
    
    // Create user_id -> Set<completed_lesson_ids> mapping
    const userProgressMap = new Map<string, Set<string>>();
    (allProgress || []).forEach(progress => {
      if (!userProgressMap.has(progress.user_id)) {
        userProgressMap.set(progress.user_id, new Set());
      }
      userProgressMap.get(progress.user_id)!.add(progress.lesson_id);
    });
    
    // COMBINE: Calculate progress for each enrollment in memory
    const enrollmentsWithProgress = enrollments.map(enrollment => {
      const moduleIds = courseModulesMap.get(enrollment.course_id) || [];
      
      // Get all lesson IDs for this course
      const lessonIds = moduleIds.flatMap(moduleId => 
        moduleLessonsMap.get(moduleId) || []
      );
      
      const total_lessons = lessonIds.length;
      
      // Get completed lessons for this user
      const completedLessons = userProgressMap.get(enrollment.user_id) || new Set();
      const completed_lessons = lessonIds.filter(lessonId => 
        completedLessons.has(lessonId)
      ).length;
      
      const progress_percentage = total_lessons > 0 
        ? Math.round((completed_lessons / total_lessons) * 100) 
        : 0;
      
      // Get payment for this enrollment
      const paymentKey = `${enrollment.user_id}_${enrollment.course_id}`;
      
      return {
        ...enrollment,
        payment: paymentMap.get(paymentKey) || null,
        progress: { 
          completed_lessons, 
          total_lessons, 
          progress_percentage 
        }
      };
    });
    
    return success(enrollmentsWithProgress);
  } catch (err: any) {
    console.error('listEnrollments error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Get single enrollment by ID
 */
export async function getEnrollment(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { data: enrollment, error: dbError } = await ctx.supabase
      .from('course_enrollments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (dbError) {
      console.error('Error fetching enrollment:', dbError);
      return error("Failed to fetch enrollment");
    }

    return success(enrollment);
  } catch (err: any) {
    console.error('getEnrollment error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Create new enrollment
 */
export async function createEnrollment(
  ctx: AdminContext,
  enrollmentData: any
): Promise<AdminHandlerResult> {
  try {
    const { user_id, course_id, status, expires_at } = enrollmentData;
    
    const { data: enrollment, error: dbError } = await ctx.supabase
      .from('course_enrollments')
      .insert({
        user_id,
        course_id,
        status,
        expires_at: expires_at || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating enrollment:', dbError);
      return error("Failed to create enrollment");
    }

    return success(enrollment);
  } catch (err: any) {
    console.error('createEnrollment error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update enrollment
 */
export async function updateEnrollment(
  ctx: AdminContext,
  params: { id: string },
  updates: any
): Promise<AdminHandlerResult> {
  try {
    const { user_id, course_id, status, expires_at } = updates;
    
    const { data: enrollment, error: dbError } = await ctx.supabase
      .from('course_enrollments')
      .update({
        user_id,
        course_id,
        status,
        expires_at: expires_at || null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (dbError) {
      console.error('Error updating enrollment:', dbError);
      return error("Failed to update enrollment");
    }

    return success(enrollment);
  } catch (err: any) {
    console.error('updateEnrollment error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Delete enrollment
 */
export async function deleteEnrollment(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { error: dbError } = await ctx.supabase
      .from('course_enrollments')
      .delete()
      .eq('id', params.id);

    if (dbError) {
      console.error('Error deleting enrollment:', dbError);
      return error("Failed to delete enrollment");
    }

    return success({ success: true });
  } catch (err: any) {
    console.error('deleteEnrollment error:', err);
    return error(err.message || "Internal error");
  }
}
