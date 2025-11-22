import { supabase } from '@/lib/supabase';
import type { Course, CourseDetails, CourseModule, Lesson, CourseFaq } from '@shared/schema';

/**
 * Fetch public course data by slug (NO AUTH required)
 * Used for public landing pages
 */
export async function fetchCourseLandingBySlug(slug: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // 1. Fetch course with details
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      *,
      course_details (*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('visibility', 'public')
    .eq('is_deleted', false)
    .single();

  if (courseError) throw new Error(`Course not found: ${courseError.message}`);
  if (!course) throw new Error('Course not found');

  // Merge course_details into course object
  const courseDetails = (course as any).course_details?.[0] || (course as any).course_details;
  if (courseDetails) {
    Object.assign(course, {
      instructor_name: courseDetails.instructor_name,
      instructor_title: courseDetails.instructor_title,
      instructor_bio: courseDetails.instructor_bio,
      badge_text: courseDetails.badge_text,
      highlights: courseDetails.highlights,
      preview_video_id: courseDetails.preview_video_id,
      seo_keywords: courseDetails.seo_keywords,
      landing_sections: courseDetails.landing_sections,
    });
  }

  // 1.5. Fetch course media (cover, instructor photo, og_image)
  const { data: mediaLinks } = await supabase
    .from('media_links')
    .select(`
      category,
      media_files!inner (
        file_url,
        is_deleted
      )
    `)
    .eq('course_id', course.id)
    .eq('media_files.is_deleted', false)
    .in('category', ['course_cover', 'instructor_photo', 'og_image']);

  // Attach media URLs to course object
  if (mediaLinks && mediaLinks.length > 0) {
    mediaLinks.forEach((link: any) => {
      if (link.category === 'course_cover' && link.media_files?.file_url) {
        (course as any).cover_url = link.media_files.file_url;
      } else if (link.category === 'instructor_photo' && link.media_files?.file_url) {
        (course as any).instructor_photo_url = link.media_files.file_url;
      } else if (link.category === 'og_image' && link.media_files?.file_url) {
        (course as any).og_image_url = link.media_files.file_url;
      }
    });
  }

  // 2. Fetch modules
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', course.id)
    .order('sort_index', { ascending: true });

  if (modulesError) throw new Error(`Modules fetch error: ${modulesError.message}`);

  // 2.5. Fetch module images and prepare lessons query
  let moduleIds: string[] = [];
  if (modules && modules.length > 0) {
    moduleIds = modules.map((m) => m.id);
    
    const { data: moduleMediaLinks } = await supabase
      .from('media_links')
      .select(`
        course_module_id,
        media_files!inner (
          file_url,
          is_deleted
        )
      `)
      .in('course_module_id', moduleIds)
      .eq('category', 'module_image')
      .eq('media_files.is_deleted', false);

    // Attach module_image_url to each module
    if (moduleMediaLinks && moduleMediaLinks.length > 0) {
      modules.forEach((module: any) => {
        const mediaLink = moduleMediaLinks.find((link: any) => link.course_module_id === module.id);
        if (mediaLink?.media_files) {
          const mediaFile = Array.isArray(mediaLink.media_files) 
            ? mediaLink.media_files[0] 
            : mediaLink.media_files;
          if (mediaFile?.file_url) {
            module.module_image_url = mediaFile.file_url;
          }
        }
      });
    }
  }

  // 3. Fetch lessons (active only)
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
    .select(`
      id,
      slug,
      title,
      short_description,
      price,
      course_details (
        badge_text,
        instructor_name,
        instructor_title
      )
    `)
    .eq('is_active', true)
    .eq('visibility', 'public')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);

  if (!courses || courses.length === 0) {
    return [];
  }

  // Fetch cover images for all courses
  const courseIds = courses.map(c => c.id);
  const { data: mediaLinks } = await supabase
    .from('media_links')
    .select(`
      course_id,
      media_files!inner (
        file_url,
        is_deleted
      )
    `)
    .in('course_id', courseIds)
    .eq('category', 'course_cover')
    .eq('media_files.is_deleted', false);

  // Attach cover_url and merge course_details
  const coursesWithCovers = courses.map(course => {
    const coverLink = (mediaLinks || []).find((link: any) => link.course_id === course.id);
    const mediaFile = Array.isArray(coverLink?.media_files) ? coverLink.media_files[0] : coverLink?.media_files;
    const courseDetails = (course as any).course_details?.[0] || (course as any).course_details;
    
    return {
      ...course,
      cover_url: mediaFile?.file_url || null,
      badge_text: courseDetails?.badge_text || null,
      instructor_name: courseDetails?.instructor_name || null,
      instructor_title: courseDetails?.instructor_title || null,
    };
  });

  return coursesWithCovers as any;
}
