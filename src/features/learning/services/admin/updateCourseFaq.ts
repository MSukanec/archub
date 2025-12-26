import { supabase } from '@/lib/supabase';
export interface UpdateCourseFaqData {
  question: string;
  answer: string;
  sortIndex?: number;
}
export async function updateCourseFaq(faqId: string, data: UpdateCourseFaqData) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase
    .from('course_faqs')
    .update({
      question: data.question,
      answer: data.answer,
      sort_index: data.sortIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', faqId);
  if (error) throw error;
}
