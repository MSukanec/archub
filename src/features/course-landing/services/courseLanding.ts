import { supabase } from '@/lib/supabase';
import type { Course, CourseModule, Lesson, CourseFaq } from '@shared/schema';

/**
 * Fetch public course data by slug (NO AUTH required)
 * Used for public landing pages
 */
export async function fetchCourseLandingBySlug(slug: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // 1. Fetch course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('visibility', 'public')
    .single();

  if (courseError) throw new Error(`Course not found: ${courseError.message}`);
  if (!course) throw new Error('Course not found');

  // 2. Fetch modules
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', course.id)
    .order('sort_index', { ascending: true });

  if (modulesError) throw new Error(`Modules fetch error: ${modulesError.message}`);

  // 3. Fetch lessons (active only)
  const moduleIds = (modules || []).map((m) => m.id);
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('*')
    .in('module_id', moduleIds)
    .eq('is_active', true)
    .order('sort_index', { ascending: true });

  if (lessonsError) throw new Error(`Lessons fetch error: ${lessonsError.message}`);

  // 4. Fetch FAQs
  const { data: faqs, error: faqsError } = await supabase
    .from('course_faqs')
    .select('*')
    .eq('course_id', course.id)
    .order('sort_index', { ascending: true });

  if (faqsError) throw new Error(`FAQs fetch error: ${faqsError.message}`);

  return {
    course: course as Course,
    modules: (modules || []) as CourseModule[],
    lessons: (lessons || []) as Lesson[],
    faqs: (faqs || []) as CourseFaq[],
  };
}

/**
 * Fetch all public courses (NO AUTH required)
 * Used for course catalog page
 */
export async function getAllPublicCourses() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, slug, title, short_description, cover_url, price, badge_text, instructor_name, instructor_title')
    .eq('is_active', true)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);

  return (courses || []) as Course[];
}
