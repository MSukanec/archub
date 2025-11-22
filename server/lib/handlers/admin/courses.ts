// api/lib/handlers/admin/courses.ts
// Admin course management handlers

import type { AdminContext, AdminHandlerResult } from "./types.js";
import { success, error } from "./types.js";

/**
 * Fields that belong to course_details table
 */
const COURSE_DETAILS_FIELDS = [
  'instructor_name',
  'instructor_title',
  'instructor_bio',
  'badge_text',
  'highlights',
  'preview_video_id',
  'seo_keywords',
  'landing_sections'
];

/**
 * Deleted image fields that should be completely ignored
 * These are now handled via media_links table
 */
const DELETED_IMAGE_FIELDS = [
  'cover_url',
  'instructor_photo_url',
  'og_image_url'
];

/**
 * Split incoming data into courses and course_details objects
 * Filters out deleted image fields that are now handled via media_links
 */
function splitCourseData(data: any): { coursesData: any; detailsData: any } {
  const coursesData: any = {};
  const detailsData: any = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip deleted image fields completely
    if (DELETED_IMAGE_FIELDS.includes(key)) {
      continue;
    }
    
    if (COURSE_DETAILS_FIELDS.includes(key)) {
      detailsData[key] = value;
    } else {
      coursesData[key] = value;
    }
  }

  return { coursesData, detailsData };
}

/**
 * Merge course and course_details data
 */
function mergeCourseData(course: any, details: any): any {
  if (!details) return course;
  
  const merged = { ...course };
  
  for (const field of COURSE_DETAILS_FIELDS) {
    if (details[field] !== undefined) {
      merged[field] = details[field];
    }
  }
  
  return merged;
}

/**
 * List all courses (with course_details joined)
 */
export async function listCourses(
  ctx: AdminContext
): Promise<AdminHandlerResult> {
  try {
    const { data: courses, error: dbError } = await ctx.supabase
      .from('courses')
      .select(`
        *,
        course_details (
          instructor_name,
          instructor_title,
          instructor_bio,
          badge_text,
          highlights,
          preview_video_id,
          seo_keywords,
          landing_sections
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching courses:', dbError);
      return error("Failed to fetch courses");
    }

    // Merge course_details into each course
    const mergedCourses = (courses || []).map(course => {
      const details = Array.isArray(course.course_details) 
        ? course.course_details[0] 
        : course.course_details;
      const merged = mergeCourseData(course, details);
      delete merged.course_details;
      return merged;
    });

    return success(mergedCourses);
  } catch (err: any) {
    console.error('listCourses error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Get single course by ID (with course_details joined)
 */
export async function getCourse(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { data: course, error: dbError } = await ctx.supabase
      .from('courses')
      .select(`
        *,
        course_details (
          instructor_name,
          instructor_title,
          instructor_bio,
          badge_text,
          highlights,
          preview_video_id,
          seo_keywords,
          landing_sections
        )
      `)
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single();

    if (dbError) {
      console.error('Error fetching course:', dbError);
      return error("Failed to fetch course");
    }

    // Merge course_details into course
    const details = Array.isArray(course.course_details) 
      ? course.course_details[0] 
      : course.course_details;
    const merged = mergeCourseData(course, details);
    delete merged.course_details;

    return success(merged);
  } catch (err: any) {
    console.error('getCourse error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Create new course (creates both courses and course_details)
 */
export async function createCourse(
  ctx: AdminContext,
  courseData: any
): Promise<AdminHandlerResult> {
  try {
    // Split data into courses and course_details
    const { coursesData, detailsData } = splitCourseData(courseData);

    // Create course record
    const { data: course, error: dbError } = await ctx.supabase
      .from('courses')
      .insert(coursesData)
      .select()
      .single();

    if (dbError) {
      console.error('Error creating course:', dbError);
      return error("Failed to create course");
    }

    // Create course_details record if there's any details data
    const hasDetailsData = Object.keys(detailsData).some(key => detailsData[key] !== null && detailsData[key] !== undefined);
    
    if (hasDetailsData) {
      const { error: detailsError } = await ctx.supabase
        .from('course_details')
        .insert({
          course_id: course.id,
          ...detailsData
        });

      if (detailsError) {
        console.error('Error creating course_details:', detailsError);
        // Don't fail the entire operation, just log the error
      }
    }

    // Return merged data
    const merged = mergeCourseData(course, detailsData);
    return success(merged);
  } catch (err: any) {
    console.error('createCourse error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Update course (updates both courses and course_details, creates course_details if missing)
 */
export async function updateCourse(
  ctx: AdminContext,
  params: { id: string },
  updates: any
): Promise<AdminHandlerResult> {
  try {
    // Split data into courses and course_details
    const { coursesData, detailsData } = splitCourseData(updates);

    // Update course record if there's any courses data
    if (Object.keys(coursesData).length > 0) {
      const { error: courseError } = await ctx.supabase
        .from('courses')
        .update(coursesData)
        .eq('id', params.id);

      if (courseError) {
        console.error('Error updating course:', courseError);
        return error("Failed to update course");
      }
    }

    // Handle course_details update/insert
    const hasDetailsData = Object.keys(detailsData).length > 0;
    
    if (hasDetailsData) {
      // Check if course_details exists
      const { data: existingDetails } = await ctx.supabase
        .from('course_details')
        .select('id')
        .eq('course_id', params.id)
        .maybeSingle();

      if (existingDetails) {
        // Update existing course_details
        const { error: updateError } = await ctx.supabase
          .from('course_details')
          .update(detailsData)
          .eq('course_id', params.id);

        if (updateError) {
          console.error('Error updating course_details:', updateError);
          // Don't fail the entire operation
        }
      } else {
        // Create new course_details
        const { error: insertError } = await ctx.supabase
          .from('course_details')
          .insert({
            course_id: params.id,
            ...detailsData
          });

        if (insertError) {
          console.error('Error inserting course_details:', insertError);
          // Don't fail the entire operation
        }
      }
    }

    // Fetch the updated course with details
    const { data: updatedCourse, error: fetchError } = await ctx.supabase
      .from('courses')
      .select(`
        *,
        course_details (
          instructor_name,
          instructor_title,
          instructor_bio,
          badge_text,
          highlights,
          preview_video_id,
          seo_keywords,
          landing_sections
        )
      `)
      .eq('id', params.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated course:', fetchError);
      return error("Failed to fetch updated course");
    }

    // Merge course_details into course
    const details = Array.isArray(updatedCourse.course_details) 
      ? updatedCourse.course_details[0] 
      : updatedCourse.course_details;
    const merged = mergeCourseData(updatedCourse, details);
    delete merged.course_details;

    return success(merged);
  } catch (err: any) {
    console.error('updateCourse error:', err);
    return error(err.message || "Internal error");
  }
}

/**
 * Delete course (soft delete)
 */
export async function deleteCourse(
  ctx: AdminContext,
  params: { id: string }
): Promise<AdminHandlerResult> {
  try {
    const { error: dbError } = await ctx.supabase
      .from('courses')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
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
