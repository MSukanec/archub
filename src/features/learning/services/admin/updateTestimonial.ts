import { supabase } from '@/lib/supabase';

export interface UpdateTestimonialData {
  authorName?: string;
  authorTitle?: string;
  authorAvatarUrl?: string;
  content?: string;
  rating?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  sortIndex?: number;
}

export async function updateTestimonial(testimonialId: string, data: UpdateTestimonialData) {
  if (!supabase) throw new Error('Supabase not initialized');

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (data.authorName !== undefined) updatePayload.author_name = data.authorName;
  if (data.authorTitle !== undefined) updatePayload.author_title = data.authorTitle;
  if (data.authorAvatarUrl !== undefined) updatePayload.author_avatar_url = data.authorAvatarUrl;
  if (data.content !== undefined) updatePayload.content = data.content;
  if (data.rating !== undefined) updatePayload.rating = data.rating;
  if (data.isFeatured !== undefined) updatePayload.is_featured = data.isFeatured;
  if (data.isActive !== undefined) updatePayload.is_active = data.isActive;
  if (data.sortIndex !== undefined) updatePayload.sort_index = data.sortIndex;

  const { error, data: testimonial } = await supabase
    .from('testimonials')
    .update(updatePayload)
    .eq('id', testimonialId)
    .select()
    .single();

  if (error) throw error;
  return testimonial;
}
