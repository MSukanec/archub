import { supabase } from '@/lib/supabase';
export interface CreateTestimonialData {
  courseId?: string;
  organizationId?: string;
  productId?: string;
  authorName: string;
  authorTitle?: string;
  authorAvatarUrl?: string;
  content: string;
  rating?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  sortIndex?: number;
}
export async function createTestimonial(data: CreateTestimonialData) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error, data: testimonial } = await supabase
    .from('testimonials')
    .insert({
      course_id: data.courseId || null,
      organization_id: data.organizationId || null,
      product_id: data.productId || null,
      author_name: data.authorName,
      author_title: data.authorTitle || null,
      author_avatar_url: data.authorAvatarUrl || null,
      content: data.content,
      rating: data.rating || null,
      is_featured: data.isFeatured || false,
      is_active: data.isActive !== false,
      sort_index: data.sortIndex || 0
    })
    .select()
    .single();
  if (error) throw error;
  return testimonial;
}
