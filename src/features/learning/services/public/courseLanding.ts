import { supabase } from '@/lib/supabase';
import type { Course, CourseDetails, CourseModule, Lesson, CourseFaq, Testimonial } from '@shared/schema';

/**
 * Fetch public course data by slug (NO AUTH required)
 * Used for public landing pages
 */
export async function fetchCourseLandingBySlug(slug: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // 1. Fetch course with details and creator info (is_active check removed - handled by frontend BlockedRestricted)
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      *,
      course_details (*),
      creator:users!courses_created_by_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('slug', slug)
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

    // Generate cover URL from course_details (NEW preferred method)
    if (courseDetails.image_bucket && courseDetails.image_path) {
      // Public bucket: use direct public URL
      if (courseDetails.image_bucket === 'public-assets') {
        (course as any).cover_url = supabase.storage
          .from(courseDetails.image_bucket)
          .getPublicUrl(courseDetails.image_path).data.publicUrl;
      } else {
        // Private bucket: would need signed URL (not typical for course covers)
        const { data } = await supabase.storage
          .from(courseDetails.image_bucket)
          .createSignedUrl(courseDetails.image_path, 3600);
        if (data?.signedUrl) {
          (course as any).cover_url = data.signedUrl;
        }
      }
    }
  }

  // 1.5. Fetch course media (instructor photo, og_image) - ONLY if not from course_details
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
      // Only use media_links cover if not already set from course_details
      if (link.category === 'course_cover' && link.media_files?.file_url && !(course as any).cover_url) {
        (course as any).cover_url = link.media_files.file_url;
      } else if (link.category === 'instructor_photo' && link.media_files?.file_url) {
        (course as any).instructor_photo_url = link.media_files.file_url;
      } else if (link.category === 'og_image' && link.media_files?.file_url) {
        (course as any).og_image_url = link.media_files.file_url;
      }
    });
  }

  // Fallback: Use creator's avatar if no instructor_photo_url
  if (!(course as any).instructor_photo_url && (course as any).creator?.avatar_url) {
    (course as any).instructor_photo_url = (course as any).creator.avatar_url;
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

  // 5. Fetch Testimonials (graceful fallback if table doesn't exist yet)
  let testimonials: any[] = [];
  try {
    const { data: testimonialsData, error: testimonialsError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('course_id', course.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('sort_index', { ascending: true });

    if (!testimonialsError && testimonialsData) {
      testimonials = testimonialsData;
    }
  } catch {
    // Table might not exist yet - continue with empty testimonials
    console.log('Testimonials table not available yet');
  }

  // 6. Fetch Client Gallery images
  let clientGallery: { id: string; url: string }[] = [];
  try {
    const { data: galleryLinks, error: galleryError } = await supabase
      .from('media_links')
      .select(`
        id,
        media_files!inner (
          file_url,
          is_deleted
        )
      `)
      .eq('course_id', course.id)
      .eq('category', 'client_gallery')
      .eq('media_files.is_deleted', false)
      .order('position', { ascending: true });

    if (!galleryError && galleryLinks) {
      clientGallery = galleryLinks
        .map((link: any) => {
          const mediaFile = Array.isArray(link.media_files) 
            ? link.media_files[0] 
            : link.media_files;
          return {
            id: link.id,
            url: mediaFile?.file_url || null,
          };
        })
        .filter((item: any) => item.url !== null);
    }
  } catch {
    console.log('Client gallery fetch failed - continuing without');
  }

  return {
    course: course as Course,
    modules: (modules || []) as CourseModule[],
    lessons: (lessons || []) as Lesson[],
    faqs: (faqs || []) as CourseFaq[],
    testimonials: (testimonials || []) as Testimonial[],
    clientGallery,
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

  // is_active check removed - handled by frontend BlockedRestricted
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      short_description,
      price,
      is_active,
      status,
      course_details (
        badge_text,
        instructor_name,
        instructor_title,
        image_bucket,
        image_path
      )
    `)
    .eq('visibility', 'public')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);

  if (!courses || courses.length === 0) {
    return [];
  }

  // Build cover URL map from course_details (NEW preferred method)
  const coverUrlMap = new Map<string, string>();
  courses.forEach(course => {
    const courseDetails = (course as any).course_details?.[0] || (course as any).course_details;
    if (courseDetails?.image_bucket && courseDetails?.image_path) {
      // Public bucket: use direct public URL
      if (courseDetails.image_bucket === 'public-assets') {
        const publicUrl = supabase.storage
          .from(courseDetails.image_bucket)
          .getPublicUrl(courseDetails.image_path).data.publicUrl;
        coverUrlMap.set(course.id, publicUrl);
      }
    }
  });

  // Fetch cover images from media_links (LEGACY fallback)
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
    // Prefer course_details URL over media_links
    let cover_url = coverUrlMap.get(course.id) || null;
    
    // Fallback to media_links if no cover in course_details
    if (!cover_url) {
      const coverLink = (mediaLinks || []).find((link: any) => link.course_id === course.id);
      const mediaFile = Array.isArray(coverLink?.media_files) ? coverLink.media_files[0] : coverLink?.media_files;
      cover_url = mediaFile?.file_url || null;
    }
    
    const courseDetails = (course as any).course_details?.[0] || (course as any).course_details;
    
    return {
      ...course,
      cover_url,
      status: (course as any).status || 'available',
      badge_text: courseDetails?.badge_text || null,
      instructor_name: courseDetails?.instructor_name || null,
      instructor_title: courseDetails?.instructor_title || null,
    };
  });

  return coursesWithCovers as any;
}
