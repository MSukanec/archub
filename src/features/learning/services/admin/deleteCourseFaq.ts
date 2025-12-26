import { supabase } from '@/lib/supabase';
export async function deleteCourseFaq(faqId: string) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase
    .from('course_faqs')
    .delete()
    .eq('id', faqId);
  if (error) throw error;
}
