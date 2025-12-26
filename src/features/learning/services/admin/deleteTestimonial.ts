import { supabase } from '@/lib/supabase';

export async function deleteTestimonial(testimonialId: string) {
  if (!supabase) throw new Error('Supabase not initialized');

  const { error } = await supabase
    .from('testimonials')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', testimonialId);

  if (error) throw error;
}
